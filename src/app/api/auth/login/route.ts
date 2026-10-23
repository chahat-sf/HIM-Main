import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { getDb } from "@/lib/db";
import { setSessionCookie, verifyPassword } from "@/lib/auth";

type LoginBody = {
  email?: string;
  password?: string;
  remember?: boolean;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginBody;
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";
    const remember = body.remember !== false;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Please enter your email and password." },
        { status: 400 },
      );
    }

    const db = getDb();
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT id, full_name, email, password_hash
       FROM users WHERE email = :email LIMIT 1`,
      { email },
    );
    const user = rows?.[0];
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 },
      );
    }

    const ok = await verifyPassword(password, String(user.password_hash));
    if (!ok) {
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
