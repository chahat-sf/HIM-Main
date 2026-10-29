import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getAccountPayload, updateProfile } from "@/lib/account";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import {
	FIELD_LIMITS,
	parseJsonBody,
	tooManyRequests,
} from "@/lib/validation";

type ProfileBody = {
	fullName?: string;
	phone?: string | null;
	dateOfBirth?: string | null;
};

export async function PATCH(request: Request) {
	try {
		const user = await getSessionUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const ip = clientIp(request);
		if (
			!rateLimit(`profile:${ip}`, { limit: 30, windowMs: 60_000 }) ||
			!rateLimit(`profile:user:${user.id}`, { limit: 30, windowMs: 60_000 })
		) {
			return tooManyRequests();
		}

		const parsed = await parseJsonBody<ProfileBody>(request);
		if (!parsed.ok) return parsed.response;
		const body = parsed.data;

		const fullName = body.fullName?.trim();
		if (fullName !== undefined && !fullName) {
			return NextResponse.json(
				{ error: "Full name is required." },
				{ status: 400 },
			);
		}
		if (fullName !== undefined && fullName.length > FIELD_LIMITS.fullName) {
			return NextResponse.json(
				{ error: "Full name is too long." },
				{ status: 400 },
			);
		}
		if (
			body.phone != null &&
			String(body.phone).trim().length > FIELD_LIMITS.phone
		) {
			return NextResponse.json(
				{ error: "Phone number is too long." },
				{ status: 400 },
			);
		}

		if (body.dateOfBirth) {
			const ok = /^\d{4}-\d{2}-\d{2}$/.test(body.dateOfBirth);
			if (!ok) {
				return NextResponse.json(
					{ error: "Date of birth must be YYYY-MM-DD." },
					{ status: 400 },
				);
			}
		}

		await updateProfile(user.id, {
			fullName,
			phone: body.phone,
			dateOfBirth: body.dateOfBirth,
		});

		const refreshed = await getSessionUser();
		if (!refreshed) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		return NextResponse.json(await getAccountPayload(refreshed));
	} catch (error) {
		console.error("profile PATCH error", error);
		return NextResponse.json(
			{ error: "Unable to update profile." },
			{ status: 500 },
		);
	}
}
