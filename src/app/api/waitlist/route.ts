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

const INSTAGRAM_MAX = 64;
const INSTAGRAM_RE = /^[A-Za-z0-9._]+$/;

type WaitlistBody = {
	name?: string;
	email?: string;
	instagramUsername?: string;
	instagram?: string;
};

function isDuplicateKey(error: unknown): boolean {
	if (!error || typeof error !== "object") return false;
	const err = error as { code?: string; errno?: number };
	return err.code === "ER_DUP_ENTRY" || err.errno === 1062;
}

function normalizeInstagram(
	raw: string | undefined,
): { ok: true; value: string | null } | { ok: false; error: string } {
	const trimmed = (raw ?? "").trim();
	if (!trimmed) return { ok: true, value: null };

	const withoutAt = trimmed.startsWith("@") ? trimmed.slice(1).trim() : trimmed;
	if (!withoutAt) return { ok: true, value: null };

	if (withoutAt.length > INSTAGRAM_MAX) {
		return { ok: false, error: "Please enter a shorter Instagram username." };
	}
	if (!INSTAGRAM_RE.test(withoutAt)) {
		return {
			ok: false,
			error: "Please enter a valid Instagram username.",
		};
	}
	return { ok: true, value: withoutAt };
}

export async function POST(request: Request) {
	try {
		const ip = clientIp(request);
		if (!rateLimit(`waitlist:${ip}`, { limit: 10, windowMs: 60_000 })) {
			return tooManyRequests();
		}

		const parsed = await parseJsonBody<WaitlistBody>(request);
		if (!parsed.ok) return parsed.response;

		const body = parsed.data;
		const name = body.name?.trim().replace(/\s+/g, " ") ?? "";
		const email = body.email?.trim().toLowerCase() ?? "";
		const instagramResult = normalizeInstagram(
			body.instagramUsername ?? body.instagram,
		);

		if (!name) {
			return NextResponse.json(
				{ error: "Please enter your name." },
				{ status: 400 },
			);
		}
		if (name.length > FIELD_LIMITS.fullName) {
			return NextResponse.json(
				{ error: "Please enter a shorter name." },
				{ status: 400 },
			);
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
		if (!instagramResult.ok) {
			return NextResponse.json(
				{ error: instagramResult.error },
				{ status: 400 },
			);
		}

		const db = getDb();
		try {
			await db.execute<ResultSetHeader>(
				`INSERT INTO waitlist_subscribers (name, email, instagram_username)
         VALUES (:name, :email, :instagramUsername)`,
				{ name, email, instagramUsername: instagramResult.value },
			);
		} catch (error) {
			if (isDuplicateKey(error)) {
				return NextResponse.json({ ok: true, alreadySubscribed: true });
			}
			throw error;
		}

		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("waitlist subscribe error", error);
		return NextResponse.json(
			{ error: "Unable to subscribe. Please try again." },
			{ status: 500 },
		);
	}
}
