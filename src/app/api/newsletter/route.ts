import { NextResponse } from "next/server";
import type { ResultSetHeader } from "mysql2";
import { getDb } from "@/lib/db";

type NewsletterBody = {
	email?: string;
	source?: string;
};

function isDuplicateKey(error: unknown): boolean {
	if (!error || typeof error !== "object") return false;
	const err = error as { code?: string; errno?: number };
	return err.code === "ER_DUP_ENTRY" || err.errno === 1062;
}

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as NewsletterBody;
		const email = body.email?.trim().toLowerCase() ?? "";
		const source = (body.source?.trim() || "footer").slice(0, 64);

		if (!email) {
			return NextResponse.json(
				{ error: "Please enter your email address." },
				{ status: 400 },
			);
		}
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return NextResponse.json(
				{ error: "Please enter a valid email address." },
				{ status: 400 },
			);
		}

		const db = getDb();
		try {
			await db.execute<ResultSetHeader>(
				`INSERT INTO newsletter_subscribers (email, source)
         VALUES (:email, :source)`,
				{ email, source },
			);
		} catch (error) {
			if (isDuplicateKey(error)) {
				return NextResponse.json({ ok: true, alreadySubscribed: true });
			}
			throw error;
		}

		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("newsletter subscribe error", error);
		return NextResponse.json(
			{ error: "Unable to subscribe. Please try again." },
			{ status: 500 },
		);
	}
}
