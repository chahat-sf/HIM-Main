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

type PushSubscribeBody = {
	email?: string;
	subscription?: {
		endpoint?: string;
		keys?: {
			p256dh?: string;
			auth?: string;
		};
	};
};

export async function POST(request: Request) {
	try {
		const ip = clientIp(request);
		if (!rateLimit(`push-subscribe:${ip}`, { limit: 10, windowMs: 60_000 })) {
			return tooManyRequests();
		}

		const parsed = await parseJsonBody<PushSubscribeBody>(request);
		if (!parsed.ok) return parsed.response;

		const body = parsed.data;
		const email = body.email?.trim().toLowerCase() ?? "";
		const endpoint = body.subscription?.endpoint?.trim() ?? "";
		const p256dh = body.subscription?.keys?.p256dh?.trim() ?? "";
		const auth = body.subscription?.keys?.auth?.trim() ?? "";

		if (!email || !isEmail(email) || email.length > FIELD_LIMITS.email) {
			return NextResponse.json(
				{ error: "Please enter a valid email address." },
				{ status: 400 },
			);
		}
		if (!endpoint || endpoint.length > 2048) {
			return NextResponse.json(
				{ error: "Invalid push subscription." },
				{ status: 400 },
			);
		}
		if (!p256dh || p256dh.length > 255 || !auth || auth.length > 255) {
			return NextResponse.json(
				{ error: "Invalid push subscription keys." },
				{ status: 400 },
			);
		}

		const userAgent =
			(request.headers.get("user-agent") ?? "").slice(0, 512) || null;

		const db = getDb();
		await db.execute<ResultSetHeader>(
			`INSERT INTO push_subscriptions (email, endpoint, p256dh, auth, user_agent)
       VALUES (:email, :endpoint, :p256dh, :auth, :userAgent)
       ON DUPLICATE KEY UPDATE
         email = VALUES(email),
         p256dh = VALUES(p256dh),
         auth = VALUES(auth),
         user_agent = VALUES(user_agent)`,
			{ email, endpoint, p256dh, auth, userAgent },
		);

		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("push subscribe error", error);
		return NextResponse.json(
			{ error: "Unable to save push subscription." },
			{ status: 500 },
		);
	}
}
