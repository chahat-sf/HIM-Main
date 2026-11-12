import { NextResponse, type NextRequest } from "next/server";
import {
	PREVIEW_COOKIE,
	PREVIEW_COOKIE_MAX_AGE,
	previewCookieOptions,
	previewCookieValue,
} from "@/lib/site-gate";

function timingSafeEqual(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let out = 0;
	for (let i = 0; i < a.length; i++) {
		out |= a.charCodeAt(i) ^ b.charCodeAt(i);
	}
	return out === 0;
}

/**
 * Team unlock for the unreleased gate.
 * GET /api/site-preview?secret=...  → set cookie, redirect home
 * GET /api/site-preview?clear=1     → clear cookie, redirect to coming-soon
 */
export async function GET(request: NextRequest) {
	const url = request.nextUrl;
	const clear = url.searchParams.get("clear");

	if (clear === "1") {
		const response = NextResponse.redirect(
			new URL("/coming-soon", request.url),
		);
		response.cookies.set(PREVIEW_COOKIE, "", previewCookieOptions(0));
		return response;
	}

	const expected = process.env.SITE_PREVIEW_SECRET;
	const provided = url.searchParams.get("secret") ?? "";

	if (!expected || !provided || !timingSafeEqual(provided, expected)) {
		return NextResponse.json(
			{ error: "Invalid preview secret." },
			{ status: 401 },
		);
	}

	const token = await previewCookieValue(expected);
	const response = NextResponse.redirect(new URL("/", request.url));
	response.cookies.set(
		PREVIEW_COOKIE,
		token,
		previewCookieOptions(PREVIEW_COOKIE_MAX_AGE),
	);
	return response;
}
