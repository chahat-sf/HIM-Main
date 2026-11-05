import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { safeNextPath } from "@/lib/auth-redirect";
import {
	GOOGLE_OAUTH_COOKIE,
	authReturnPath,
	encodeOauthCookie,
	googleAuthorizeUrl,
	googleConfigured,
	googleRedirectUri,
	oauthCookieOptions,
} from "@/lib/google-auth";

export async function GET(request: Request) {
	const url = new URL(request.url);
	const returnTo = authReturnPath(url.searchParams.get("return"));
	const next = safeNextPath(url.searchParams.get("next"));

	const fail = (code: string) => {
		const back = new URL(returnTo, request.url);
		back.searchParams.set("error", code);
		if (next !== "/") back.searchParams.set("next", next);
		return NextResponse.redirect(back);
	};

	if (!rateLimit(`google-start:${clientIp(request)}`, { limit: 20, windowMs: 60_000 })) {
		return fail("google_failed");
	}
	if (!googleConfigured()) {
		console.error("google auth skipped: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET missing");
		return fail("google_failed");
	}

	const state = randomBytes(32).toString("base64url");
	const response = NextResponse.redirect(
		googleAuthorizeUrl({ state, redirectUri: googleRedirectUri(request) }),
	);
	response.cookies.set(
		GOOGLE_OAUTH_COOKIE,
		encodeOauthCookie({ state, next, returnTo }),
		oauthCookieOptions(),
	);
	return response;
}
