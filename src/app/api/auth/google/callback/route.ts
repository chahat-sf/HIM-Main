import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
	SESSION_COOKIE,
	createSessionToken,
	sessionCookieOptions,
} from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import {
	GOOGLE_OAUTH_COOKIE,
	decodeOauthCookie,
	exchangeGoogleCode,
	googleRedirectUri,
	oauthCookieOptions,
	upsertGoogleUser,
} from "@/lib/google-auth";

function finish(
	request: Request,
	path: string,
	params: Record<string, string>,
) {
	const url = new URL(path, request.url);
	for (const [key, value] of Object.entries(params)) {
		if (value) url.searchParams.set(key, value);
	}
	const response = NextResponse.redirect(url);
	response.cookies.set(GOOGLE_OAUTH_COOKIE, "", oauthCookieOptions(0));
	return response;
}

export async function GET(request: Request) {
	const url = new URL(request.url);
	const jar = await cookies();
	const cookie = decodeOauthCookie(jar.get(GOOGLE_OAUTH_COOKIE)?.value);
	const returnTo = cookie?.returnTo ?? "/login";
	const next = cookie?.next ?? "/";

	const fail = (code: string) =>
		finish(request, returnTo, {
			error: code,
			next: next === "/" ? "" : next,
		});

	if (!rateLimit(`google-callback:${clientIp(request)}`, { limit: 20, windowMs: 60_000 })) {
		return fail("google_failed");
	}

	const googleError = url.searchParams.get("error");
	if (googleError) {
		return fail(googleError === "access_denied" ? "google_denied" : "google_failed");
	}

	const state = url.searchParams.get("state") ?? "";
	const code = url.searchParams.get("code") ?? "";
	if (!cookie || cookie.state !== state || !code) {
		return fail("google_state");
	}

	try {
		const identity = await exchangeGoogleCode(code, googleRedirectUri(request));
		if (!identity) return fail("google_failed");
		if (!identity.emailVerified) return fail("google_email");

		const account = await upsertGoogleUser(identity);
		const maxAgeSeconds = 60 * 60 * 24 * 7;
		const token = await createSessionToken(
			{ sub: account.id, email: account.email, fullName: account.fullName },
			maxAgeSeconds,
		);

		const dest = new URL(next, request.url);
		dest.searchParams.set("auth", "google");
		if (account.created) dest.searchParams.set("signup", "1");
		const response = NextResponse.redirect(dest);
		response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(maxAgeSeconds));
		response.cookies.set(GOOGLE_OAUTH_COOKIE, "", oauthCookieOptions(0));
		return response;
	} catch (error) {
		console.error("google callback error", error instanceof Error ? error.message : "failed");
		return fail("google_failed");
	}
}
