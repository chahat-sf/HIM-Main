import { NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { getDb } from "@/lib/db";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { isEmail } from "@/lib/validation";

type SignupBody = {
	fullName?: string;
	email?: string;
	phone?: string;
	password?: string;
};

export async function POST(request: Request) {
	try {
		const ip = clientIp(request);
		if (!rateLimit(`signup:${ip}`, { limit: 10, windowMs: 60_000 })) {
			return NextResponse.json(
				{ error: "Too many attempts. Please try again shortly." },
				{ status: 429 },
			);
		}

		const body = (await request.json()) as SignupBody;
		const fullName = body.fullName?.trim() ?? "";
		const email = body.email?.trim().toLowerCase() ?? "";
		const phone = body.phone?.trim() || null;
		const password = body.password ?? "";

		if (!fullName || !email || !password) {
			return NextResponse.json(
				{ error: "Please fill in all required fields." },
				{ status: 400 },
			);
		}
		if (!isEmail(email)) {
			return NextResponse.json(
				{ error: "Please enter a valid email address." },
				{ status: 400 },
			);
		}
		if (password.length < 8) {
			return NextResponse.json(
				{ error: "Password must be at least 8 characters." },
				{ status: 400 },
			);
		}

		const db = getDb();
		const [existing] = await db.query<RowDataPacket[]>(
			`SELECT id FROM users WHERE email = :email LIMIT 1`,
			{ email },
		);
		if (existing?.[0]) {
			return NextResponse.json(
				{ error: "An account with this email already exists." },
				{ status: 409 },
			);
		}

		const passwordHash = await hashPassword(password);
		const [result] = await db.execute<ResultSetHeader>(
			`INSERT INTO users (full_name, email, phone, password_hash)
       VALUES (:fullName, :email, :phone, :passwordHash)`,
			{ fullName, email, phone, passwordHash },
		);

		const id = Number(result.insertId);
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
