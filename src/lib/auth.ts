import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import type { RowDataPacket } from "mysql2";
import { getDb } from "@/lib/db";

export const SESSION_COOKIE = "him_session";
const BCRYPT_ROUNDS = 12;

export type SessionPayload = {
	sub: number;
	email: string;
	fullName: string;
};

export type PublicUser = {
	id: number;
	fullName: string;
	email: string;
	phone: string | null;
	dateOfBirth: string | null;
};

function getSecret(): Uint8Array {
	const secret = process.env.AUTH_SECRET;
	if (!secret || secret.length < 16) {
		throw new Error("AUTH_SECRET must be set (16+ characters)");
	}
	return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string): Promise<string> {
	return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(
	password: string,
	passwordHash: string,
): Promise<boolean> {
	return bcrypt.compare(password, passwordHash);
}

export async function createSessionToken(
	payload: SessionPayload,
	maxAgeSeconds: number,
): Promise<string> {
	return new SignJWT({
		email: payload.email,
		fullName: payload.fullName,
	})
		.setProtectedHeader({ alg: "HS256" })
		.setSubject(String(payload.sub))
		.setIssuedAt()
		.setExpirationTime(`${maxAgeSeconds}s`)
		.sign(getSecret());
}

export async function verifySessionToken(
	token: string,
): Promise<SessionPayload | null> {
	try {
		const { payload } = await jwtVerify(token, getSecret());
		const sub = Number(payload.sub);
		if (!Number.isFinite(sub) || !payload.email || !payload.fullName) {
			return null;
		}
		return {
			sub,
			email: String(payload.email),
			fullName: String(payload.fullName),
		};
	} catch {
		return null;
	}
}

export function sessionCookieOptions(maxAgeSeconds: number) {
	return {
		httpOnly: true,
		sameSite: "lax" as const,
		secure: process.env.NODE_ENV === "production",
		path: "/",
		maxAge: maxAgeSeconds,
	};
}

export async function setSessionCookie(
	payload: SessionPayload,
	remember: boolean,
): Promise<void> {
	const maxAgeSeconds = remember ? 60 * 60 * 24 * 7 : 60 * 60 * 24;
	const token = await createSessionToken(payload, maxAgeSeconds);
	const jar = await cookies();
	jar.set(SESSION_COOKIE, token, sessionCookieOptions(maxAgeSeconds));
}

export async function clearSessionCookie(): Promise<void> {
	const jar = await cookies();
	jar.set(SESSION_COOKIE, "", {
		...sessionCookieOptions(0),
		maxAge: 0,
	});
}

export async function getSessionFromCookies(): Promise<SessionPayload | null> {
	const jar = await cookies();
	const token = jar.get(SESSION_COOKIE)?.value;
	if (!token) return null;
	return verifySessionToken(token);
}

export async function getSessionUser(): Promise<PublicUser | null> {
	const session = await getSessionFromCookies();
	if (!session) return null;

	const db = getDb();
	const [rows] = await db.query<RowDataPacket[]>(
		`SELECT id, full_name, email, phone, date_of_birth
     FROM users WHERE id = :id LIMIT 1`,
		{ id: session.sub },
	);

	const row = rows?.[0];
	if (!row) return null;

	return {
		id: Number(row.id),
		fullName: String(row.full_name),
		email: String(row.email),
		phone: row.phone ? String(row.phone) : null,
		dateOfBirth: formatDateOfBirth(
			(row.date_of_birth as Date | string | null) ?? null,
		),
	};
}

function formatDateOfBirth(value: Date | string | null): string | null {
	if (!value) return null;
	if (typeof value === "string") return value.slice(0, 10);
	const y = value.getFullYear();
	const m = String(value.getMonth() + 1).padStart(2, "0");
	const d = String(value.getDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
}
