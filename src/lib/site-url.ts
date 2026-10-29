/**
 * Absolute site origin for metadataBase / Open Graph.
 * Prefer NEXT_PUBLIC_SITE_URL in production (e.g. https://thehim.in).
 */
export function getSiteUrl(): string {
	const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
	if (explicit) return explicit.replace(/\/$/, "");

	const vercel = process.env.VERCEL_URL?.trim();
	if (vercel) return `https://${vercel.replace(/\/$/, "")}`;

	return "http://localhost:3000";
}
