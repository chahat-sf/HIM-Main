import { NextResponse } from "next/server";
import type { ResultSetHeader } from "mysql2";
import { setSessionCookie } from "@/lib/auth";
import { dbExecute } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import {
	consumeSignupVerification,
	deleteSignupVerification,
	emailAlreadyRegistered,
	isSixDigitCode,
	parseSignupFields,
} from "@/lib/signup-verification";
import { parseJsonBody, tooManyRequests } from "@/lib/validation";

type SignupBody = {
	fullName?: string;
	email?: string;
	phone?: string;
	password?: string;
	otp?: string;
};

function isDuplicateEmail(error: unknown): boolean {
	return (
		typeof error === "object" &&
		error !== null &&
		"code" in error &&
		(error as { code?: string }).code === "ER_DUP_ENTRY"
	);
}

export async function POST(request: Request) {
	try {
		const ip = clientIp(request);
		if (!rateLimit(`signup:${ip}`, { limit: 10, windowMs: 60_000 })) {
			return tooManyRequests();
		}

		const parsed = await parseJsonBody<SignupBody>(request);
		if (!parsed.ok) return parsed.response;

		const fields = parseSignupFields(parsed.data);
		if (!fields.ok) {
			return NextResponse.json(
				{ error: fields.error.error },
				{ status: fields.error.status },
			);
		}

		const otp = parsed.data.otp?.trim() ?? "";
		if (!isSixDigitCode(otp)) {
			return NextResponse.json(
				{ error: "Enter the 6-digit code from your email." },
				{ status: 400 },
			);
		}

		const { email, fullName, phone } = fields.data;
		if (await emailAlreadyRegistered(email)) {
			return NextResponse.json(
				{ error: "An account with this email already exists." },
				{ status: 409 },
			);
		}

		const verified = await consumeSignupVerification(fields.data, otp);
		if (!verified.ok) {
			return NextResponse.json(
				{ error: verified.error },
				{ status: verified.status },
			);
		}

		let id: number;
		try {
			const [result] = await dbExecute<ResultSetHeader>(
				`INSERT INTO users (full_name, email, phone, password_hash)
         VALUES (:fullName, :email, :phone, :passwordHash)`,
				{
					fullName: verified.signup.fullName,
					email: verified.signup.email,
					phone: verified.signup.phone,
					passwordHash: verified.signup.passwordHash,
				},
			);
			id = Number(result.insertId);
		} catch (error) {
			if (isDuplicateEmail(error)) {
				return NextResponse.json(
					{ error: "An account with this email already exists." },
					{ status: 409 },
				);
			}
			throw error;
		}

		try {
			await deleteSignupVerification(verified.signup.email);
		} catch (error) {
			console.error("signup verification cleanup failed", error);
		}

		await setSessionCookie({ sub: id, email, fullName }, true);

		return NextResponse.json({
			id,
			fullName,
			email,
			phone,
		});
	} catch (error) {
		console.error("signup error", error);
		return NextResponse.json(
			{ error: "Unable to create account. Please try again." },
			{ status: 500 },
		);
	}
}
