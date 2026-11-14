/**
 * Absolute site origin for metadataBase / Open Graph / sitemap / robots / email.
 * Prefer NEXT_PUBLIC_SITE_URL, then SITE_URL (e.g. https://thehim.in).
 */
export function getSiteUrl(): string {
	const explicit =
		process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.SITE_URL?.trim();
	if (explicit) return explicit.replace(/\/$/, "");

	const vercel = process.env.VERCEL_URL?.trim();
	if (vercel) return `https://${vercel.replace(/\/$/, "")}`;

	return "http://localhost:3000";
}

/**
 * Search indexing for production (thehim.in) only.
 * - NEXT_PUBLIC_ALLOW_INDEXING=true/1 → on
 * - NEXT_PUBLIC_ALLOW_INDEXING=false/0 → off
 * - Else: off on Vercel (*.vercel.app); on only for thehim.in when self-hosted
 */
export function isSeoIndexingEnabled(): boolean {
	const flag = process.env.NEXT_PUBLIC_ALLOW_INDEXING?.trim().toLowerCase();
	if (flag === "true" || flag === "1") return true;
	if (flag === "false" || flag === "0") return false;

	if (process.env.VERCEL) return false;

	try {
		const host = new URL(getSiteUrl()).hostname
			.replace(/^www\./, "")
			.toLowerCase();
		return host === "thehim.in";
	} catch {
		return false;
	}
}

function isLoopbackHost(host: string): boolean {
	const hostname = host.split(":")[0]?.toLowerCase() ?? "";
	return (
		hostname === "localhost" ||
		hostname === "127.0.0.1" ||
		hostname === "::1" ||
		hostname === "[::1]"
	);
}

/**
 * Public origin for redirects behind nginx/PM2 (request.url may be localhost:PORT).
 * Prefer a non-loopback Host / X-Forwarded-*, then configured SITE_URL, then request.url.
 */
export function getRequestOrigin(request: Request): string {
	const forwardedHost = request.headers
		.get("x-forwarded-host")
		?.split(",")[0]
		?.trim();
	const host =
		forwardedHost || request.headers.get("host")?.split(",")[0]?.trim();
	if (host && !isLoopbackHost(host)) {
		const proto =
			request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
			"https";
		return `${proto}://${host}`;
	}

	const configured = getSiteUrl();
	if (configured && !isLoopbackHost(new URL(configured).host)) {
		return configured;
	}

	return new URL(request.url).origin;
}
