import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { getDb } from "@/lib/db";
import { setSessionCookie, verifyPassword } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import {
	FIELD_LIMITS,
	isEmail,
	parseJsonBody,
	tooManyRequests,
} from "@/lib/validation";

type LoginBody = {
	email?: string;
	password?: string;
	remember?: boolean;
};

/** Precomputed bcrypt(12) of a fixed dummy — equalizes timing when email is unknown. */
const DUMMY_PASSWORD_HASH =
	"$2b$12$Jq6c.k/8eb1g9/1fjRPUde.diwybqEzeUKRP20aYgO13fDWB51m1m";

export async function POST(request: Request) {
	try {
		const ip = clientIp(request);
		if (!rateLimit(`login:${ip}`, { limit: 10, windowMs: 60_000 })) {
			return tooManyRequests();
		}

		const parsed = await parseJsonBody<LoginBody>(request);
		if (!parsed.ok) return parsed.response;

		const body = parsed.data;
		const email = body.email?.trim().toLowerCase() ?? "";
		const password = body.password ?? "";
		const remember = body.remember !== false;

		if (!email || !password) {
			return NextResponse.json(
				{ error: "Please enter your email and password." },
				{ status: 400 },
			);
		}
		if (!isEmail(email) || email.length > FIELD_LIMITS.email) {
			return NextResponse.json(
				{ error: "Please enter a valid email address." },
				{ status: 400 },
			);
		}
		if (password.length > FIELD_LIMITS.password) {
			return NextResponse.json(
				{ error: "Invalid email or password." },
				{ status: 401 },
			);
		}

		if (!rateLimit(`login:email:${email}`, { limit: 5, windowMs: 60_000 })) {
			return tooManyRequests();
		}

		const db = getDb();
		const [rows] = await db.query<RowDataPacket[]>(
			`SELECT id, full_name, email, password_hash
       FROM users WHERE email = :email LIMIT 1`,
			{ email },
		);
		const user = rows?.[0];

		const hash = user ? String(user.password_hash) : DUMMY_PASSWORD_HASH;
		const ok = await verifyPassword(password, hash);
		if (!user || !ok) {
			return NextResponse.json(
				{ error: "Invalid email or password." },
				{ status: 401 },
			);
		}

		await setSessionCookie(
			{
				sub: Number(user.id),
				email: String(user.email),
				fullName: String(user.full_name),
			},
			remember,
		);

		return NextResponse.json({
			id: Number(user.id),
			fullName: String(user.full_name),
			email: String(user.email),
		});
	} catch (error) {
		console.error("login error", error);
		return NextResponse.json(
			{ error: "Unable to sign in. Please try again." },
			{ status: 500 },
		);
	}
}
