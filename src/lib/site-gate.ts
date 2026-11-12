/** Cookie set by /api/site-preview so the team can QA while the gate is on. */
export const PREVIEW_COOKIE = "him_site_preview";

/** Cookie lifetime: 30 days. */
export const PREVIEW_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export function isSiteUnreleased(): boolean {
	return process.env.SITE_UNRELEASED === "true";
}

function timingSafeEqual(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let out = 0;
	for (let i = 0; i < a.length; i++) {
		out |= a.charCodeAt(i) ^ b.charCodeAt(i);
	}
	return out === 0;
}

/** Deterministic token derived from the preview secret (never store the raw secret). */
export async function previewCookieValue(secret: string): Promise<string> {
	const data = new TextEncoder().encode(`him-site-preview:${secret}`);
	const hash = await crypto.subtle.digest("SHA-256", data);
	return Array.from(new Uint8Array(hash))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

export async function isValidPreviewCookie(
	cookie: string | undefined,
): Promise<boolean> {
	const secret = process.env.SITE_PREVIEW_SECRET;
	if (!secret || !cookie) return false;
	const expected = await previewCookieValue(secret);
	return timingSafeEqual(cookie, expected);
}

/** Paths reachable without a preview cookie while the site is unreleased. */
export function isUnreleasedAllowlisted(pathname: string): boolean {
	return (
		pathname === "/coming-soon" ||
		pathname === "/api/waitlist" ||
		pathname === "/api/site-preview" ||
		pathname === "/api/push/subscribe" ||
		pathname === "/sw.js"
	);
}

export function previewCookieOptions(maxAge: number) {
	return {
		httpOnly: true,
		sameSite: "lax" as const,
		secure: process.env.NODE_ENV === "production",
		path: "/",
		maxAge,
	};
}
