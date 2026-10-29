import { NextResponse } from "next/server";
import type { ResultSetHeader } from "mysql2";
import { getDb } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import {
	FIELD_LIMITS,
	isEmail,
	parseJsonBody,
	tooManyRequests,
} from "@/lib/validation";

type ContactBody = {
	name?: string;
	email?: string;
	subject?: string;
	message?: string;
};

const SUBJECTS = new Set(["order", "styling", "returns", "press", "other"]);

export async function POST(request: Request) {
	try {
		const ip = clientIp(request);
		if (!rateLimit(`contact:${ip}`, { limit: 8, windowMs: 60_000 })) {
			return tooManyRequests("Too many messages. Please try again shortly.");
		}

		const parsed = await parseJsonBody<ContactBody>(request);
		if (!parsed.ok) return parsed.response;

		const body = parsed.data;
		const name = body.name?.trim() ?? "";
		const email = body.email?.trim().toLowerCase() ?? "";
		const subject = body.subject?.trim().toLowerCase() ?? "";
		const message = body.message?.trim() ?? "";

		if (!name) {
			return NextResponse.json(
				{ error: "Please enter your name." },
				{ status: 400 },
			);
		}
		if (name.length > FIELD_LIMITS.fullName) {
			return NextResponse.json({ error: "Name is too long." }, { status: 400 });
		}
		if (!email) {
			return NextResponse.json(
				{ error: "Please enter your email address." },
				{ status: 400 },
			);
		}
		if (!isEmail(email) || email.length > FIELD_LIMITS.email) {
			return NextResponse.json(
				{ error: "Please enter a valid email address." },
				{ status: 400 },
			);
		}
		if (!subject || !SUBJECTS.has(subject)) {
			return NextResponse.json(
				{ error: "Please select a subject." },
				{ status: 400 },
			);
		}
		if (!message) {
			return NextResponse.json(
				{ error: "Please enter a message." },
				{ status: 400 },
			);
		}
		if (message.length > 5000) {
			return NextResponse.json(
				{ error: "Message is too long." },
				{ status: 400 },
			);
		}

		const db = getDb();
		await db.execute<ResultSetHeader>(
			`INSERT INTO contact_messages (name, email, subject, message)
       VALUES (:name, :email, :subject, :message)`,
			{ name, email, subject, message },
		);

		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("contact submit error", error);
		return NextResponse.json(
			{ error: "Unable to send your message. Please try again." },
			{ status: 500 },
		);
	}
}
