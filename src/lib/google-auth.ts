import { createRemoteJWKSet, jwtVerify } from "jose";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { dbExecute } from "@/lib/db";
import { safeNextPath } from "@/lib/auth-redirect";

const GOOGLE_JWKS = createRemoteJWKSet(
	new URL("https://www.googleapis.com/oauth2/v3/certs"),
);

export const GOOGLE_OAUTH_COOKIE = "him_google_oauth";
const OAUTH_MAX_AGE = 10 * 60;

export type GoogleOauthCookie = {
	state: string;
	next: string;
	returnTo: "/login" | "/signup";
};

export function googleClientId(): string {
	return process.env.GOOGLE_CLIENT_ID?.trim() ?? "";
}

export function googleClientSecret(): string {
	return process.env.GOOGLE_CLIENT_SECRET?.trim() ?? "";
}

export function googleConfigured(): boolean {
	return Boolean(googleClientId() && googleClientSecret());
}

export function googleRedirectUri(request: Request): string {
	return `${new URL(request.url).origin}/api/auth/google/callback`;
}

export function authReturnPath(value: string | null): "/login" | "/signup" {
	return value === "/signup" ? "/signup" : "/login";
}

export function encodeOauthCookie(data: GoogleOauthCookie): string {
	return Buffer.from(JSON.stringify(data)).toString("base64url");
}

export function decodeOauthCookie(value: string | undefined): GoogleOauthCookie | null {
	if (!value) return null;
	try {
		const parsed = JSON.parse(
			Buffer.from(value, "base64url").toString("utf8"),
		) as Partial<GoogleOauthCookie>;
		if (!parsed.state || typeof parsed.state !== "string") return null;
		return {
			state: parsed.state,
			next: safeNextPath(parsed.next),
			returnTo: authReturnPath(parsed.returnTo ?? null),
		};
	} catch {
		return null;
	}
}

export function oauthCookieOptions(maxAge = OAUTH_MAX_AGE) {
	return {
		httpOnly: true,
		sameSite: "lax" as const,
		secure: process.env.NODE_ENV === "production",
		path: "/",
		maxAge,
	};
}

export function googleAuthorizeUrl(options: {
	state: string;
	redirectUri: string;
}): string {
	const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
	url.searchParams.set("client_id", googleClientId());
	url.searchParams.set("redirect_uri", options.redirectUri);
	url.searchParams.set("response_type", "code");
	url.searchParams.set("scope", "openid email profile");
	url.searchParams.set("state", options.state);
	url.searchParams.set("prompt", "select_account");
	return url.toString();
}

export type GoogleIdentity = {
	sub: string;
	email: string;
	emailVerified: boolean;
	fullName: string;
};

export async function exchangeGoogleCode(
	code: string,
	redirectUri: string,
): Promise<GoogleIdentity | null> {
	const body = new URLSearchParams({
		code,
		client_id: googleClientId(),
		client_secret: googleClientSecret(),
		redirect_uri: redirectUri,
		grant_type: "authorization_code",
	});
	const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body,
	});
	if (!tokenRes.ok) return null;
	const token = (await tokenRes.json()) as { id_token?: string };
	if (!token.id_token) return null;

	const { payload } = await jwtVerify(token.id_token, GOOGLE_JWKS, {
		issuer: ["https://accounts.google.com", "accounts.google.com"],
		audience: googleClientId(),
	});
	const email = String(payload.email ?? "")
		.trim()
		.toLowerCase();
	const sub = String(payload.sub ?? "");
	if (!email || !sub) return null;
	const verified = payload.email_verified === true || payload.email_verified === "true";
	const given = String(payload.given_name ?? "").trim();
	const family = String(payload.family_name ?? "").trim();
	const combined = [given, family].filter(Boolean).join(" ");
	const fullName = (String(payload.name ?? "").trim() || combined || email.split("@")[0] || "HIM").slice(0, 120);
	return { sub, email, emailVerified: verified, fullName };
}

export type GoogleAccount = {
	id: number;
	email: string;
	fullName: string;
	created: boolean;
};

export async function upsertGoogleUser(
	identity: GoogleIdentity,
): Promise<GoogleAccount> {
	const [rows] = await dbExecute<RowDataPacket[]>(
		`SELECT id, full_name, email, google_sub
     FROM users
     WHERE google_sub = :sub OR email = :email
     LIMIT 2`,
		{ sub: identity.sub, email: identity.email },
	);
	const list = rows ?? [];
	const bySub = list.find((row) => String(row.google_sub ?? "") === identity.sub);
	const byEmail = list.find(
		(row) => String(row.email).toLowerCase() === identity.email,
	);
	const existing = bySub ?? byEmail;
	if (existing) {
		const linked = existing.google_sub ? String(existing.google_sub) : "";
		if (linked && linked !== identity.sub) {
			throw new Error("google-account-mismatch");
		}
		if (!linked) {
			await dbExecute<ResultSetHeader>(
				`UPDATE users SET google_sub = :sub WHERE id = :id AND google_sub IS NULL`,
				{ sub: identity.sub, id: Number(existing.id) },
			);
		}
		return {
			id: Number(existing.id),
			email: String(existing.email),
			fullName: String(existing.full_name),
			created: false,
		};
	}

	try {
		const [result] = await dbExecute<ResultSetHeader>(
			`INSERT INTO users (full_name, email, phone, password_hash, google_sub)
       VALUES (:fullName, :email, NULL, NULL, :sub)`,
			{
				fullName: identity.fullName,
				email: identity.email,
				sub: identity.sub,
			},
		);
		return {
			id: Number(result.insertId),
			email: identity.email,
			fullName: identity.fullName,
			created: true,
		};
	} catch (error) {
		const duplicate =
			typeof error === "object" &&
			error !== null &&
			"code" in error &&
			(error as { code?: string }).code === "ER_DUP_ENTRY";
		if (!duplicate) throw error;
		const [again] = await dbExecute<RowDataPacket[]>(
			`SELECT id, full_name, email FROM users WHERE email = :email LIMIT 1`,
			{ email: identity.email },
		);
		const row = again?.[0];
		if (!row) throw error;
		await dbExecute<ResultSetHeader>(
			`UPDATE users SET google_sub = :sub WHERE id = :id AND (google_sub IS NULL OR google_sub = :sub)`,
			{ sub: identity.sub, id: Number(row.id) },
		);
		return {
			id: Number(row.id),
			email: String(row.email),
			fullName: String(row.full_name),
			created: false,
		};
	}
}
