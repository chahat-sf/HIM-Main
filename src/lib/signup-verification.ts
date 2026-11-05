import { randomInt } from "node:crypto";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { dbExecute } from "@/lib/db";
import { FIELD_LIMITS, isEmail } from "@/lib/validation";

export const OTP_TTL_MINUTES = 10;
export const OTP_MAX_ATTEMPTS = 5;

/** bcrypt(12) of a fixed dummy — equalizes timing when no pending row exists. */
const DUMMY_OTP_HASH =
	"$2b$12$Jq6c.k/8eb1g9/1fjRPUde.diwybqEzeUKRP20aYgO13fDWB51m1m";

export type SignupFields = {
	fullName: string;
	email: string;
	phone: string | null;
	password: string;
};

export type SignupFieldError = { error: string; status: number };

export function parseSignupFields(body: {
	fullName?: string;
	email?: string;
	phone?: string;
	password?: string;
}): { ok: true; data: SignupFields } | { ok: false; error: SignupFieldError } {
	const fullName = body.fullName?.trim() ?? "";
	const email = body.email?.trim().toLowerCase() ?? "";
	const phone = body.phone?.trim() || null;
	const password = body.password ?? "";

	if (!fullName || !email || !password) {
		return {
			ok: false,
			error: { error: "Please fill in all required fields.", status: 400 },
		};
	}
	if (fullName.length > FIELD_LIMITS.fullName) {
		return { ok: false, error: { error: "Name is too long.", status: 400 } };
	}
	if (!isEmail(email) || email.length > FIELD_LIMITS.email) {
		return {
			ok: false,
			error: { error: "Please enter a valid email address.", status: 400 },
		};
	}
	if (phone && phone.length > FIELD_LIMITS.phone) {
		return {
			ok: false,
			error: { error: "Phone number is too long.", status: 400 },
		};
	}
	if (password.length < 8) {
		return {
			ok: false,
			error: { error: "Password must be at least 8 characters.", status: 400 },
		};
	}
	if (password.length > FIELD_LIMITS.password) {
		return { ok: false, error: { error: "Password is too long.", status: 400 } };
	}

	return { ok: true, data: { fullName, email, phone, password } };
}

export function isSixDigitCode(value: string): boolean {
	return /^\d{6}$/.test(value);
}

export function createSignupCode(): string {
	return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export async function emailAlreadyRegistered(email: string): Promise<boolean> {
	const [rows] = await dbExecute<RowDataPacket[]>(
		`SELECT id FROM users WHERE email = :email LIMIT 1`,
		{ email },
	);
	return Boolean(rows?.[0]);
}

/** Replace any pending signup for this email. Returns the plaintext code to email. */
export async function saveSignupVerification(
	fields: SignupFields,
): Promise<string> {
	const code = createSignupCode();
	const [passwordHash, otpHash] = await Promise.all([
		hashPassword(fields.password),
		hashPassword(code),
	]);

	await dbExecute<ResultSetHeader>(
		`INSERT INTO signup_verifications
       (email, full_name, phone, password_hash, otp_hash, expires_at, attempts)
     VALUES
       (:email, :fullName, :phone, :passwordHash, :otpHash,
        DATE_ADD(UTC_TIMESTAMP(), INTERVAL ${OTP_TTL_MINUTES} MINUTE), 0)
     ON DUPLICATE KEY UPDATE
       full_name = VALUES(full_name),
       phone = VALUES(phone),
       password_hash = VALUES(password_hash),
       otp_hash = VALUES(otp_hash),
       expires_at = DATE_ADD(UTC_TIMESTAMP(), INTERVAL ${OTP_TTL_MINUTES} MINUTE),
       attempts = 0`,
		{
			email: fields.email,
			fullName: fields.fullName,
			phone: fields.phone,
			passwordHash,
			otpHash,
		},
	);

	return code;
}

export async function deleteSignupVerification(email: string): Promise<void> {
	await dbExecute<ResultSetHeader>(
		`DELETE FROM signup_verifications WHERE email = :email`,
		{ email },
	);
}

export type VerifiedSignup = SignupFields & { passwordHash: string };

export type VerifySignupResult =
	| { ok: true; signup: VerifiedSignup }
	| { ok: false; error: string; status: number };

/**
 * Check the code against the pending row. On success the row is removed and
 * the stored password hash is returned for insert. Wrong codes consume an attempt.
 */
export async function consumeSignupVerification(
	fields: SignupFields,
	otp: string,
): Promise<VerifySignupResult> {
	const [rows] = await dbExecute<RowDataPacket[]>(
		`SELECT id, full_name, phone, password_hash, otp_hash, attempts
     FROM signup_verifications
     WHERE email = :email AND expires_at > UTC_TIMESTAMP()
     LIMIT 1`,
		{ email: fields.email },
	);
	const row = rows?.[0];
	const otpHash = row ? String(row.otp_hash) : DUMMY_OTP_HASH;
	const codeOk = await verifyPassword(otp, otpHash);

	if (!row || Number(row.attempts) >= OTP_MAX_ATTEMPTS) {
		await deleteSignupVerification(fields.email);
		return {
			ok: false,
			error: "That code is invalid or has expired. Request a new one.",
			status: 400,
		};
	}

	if (!codeOk) {
		const nextAttempts = Number(row.attempts) + 1;
		if (nextAttempts >= OTP_MAX_ATTEMPTS) {
			await deleteSignupVerification(fields.email);
			return {
				ok: false,
				error: "Too many incorrect codes. Request a new one.",
				status: 400,
			};
		}
		await dbExecute<ResultSetHeader>(
			`UPDATE signup_verifications
       SET attempts = attempts + 1
       WHERE id = :id AND attempts < :maxAttempts`,
			{ id: Number(row.id), maxAttempts: OTP_MAX_ATTEMPTS },
		);
		return { ok: false, error: "That code is incorrect.", status: 400 };
	}

	const passwordOk = await verifyPassword(
		fields.password,
		String(row.password_hash),
	);
	const storedPhone = row.phone ? String(row.phone) : null;
	const detailsMatch =
		passwordOk &&
		String(row.full_name) === fields.fullName &&
		storedPhone === fields.phone;
	if (!detailsMatch) {
		return {
			ok: false,
			error:
				"Those details don't match the code we sent. Change them back, or request a new code.",
			status: 400,
		};
	}

	return {
		ok: true,
		signup: {
			...fields,
			passwordHash: String(row.password_hash),
		},
	};
}
