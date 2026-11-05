/**
 * Absolute site origin for metadataBase / Open Graph / sitemap / robots.
 * Prefer NEXT_PUBLIC_SITE_URL, then SITE_URL (e.g. https://him-main.vercel.app).
 */
export function getSiteUrl(): string {
	const explicit =
		process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
		process.env.SITE_URL?.trim();
	if (explicit) return explicit.replace(/\/$/, "");

	const vercel = process.env.VERCEL_URL?.trim();
	if (vercel) return `https://${vercel.replace(/\/$/, "")}`;

	return "http://localhost:3000";
}
