/**
 * Progressive product image path helpers (low → mid → high).
 *
 * High: catalog path as .webp (e.g. /products/nocturne/1.webp)
 * Mid:  /products/mid/...
 * Low:  /products/low/...
 */

export type ImageTier = "low" | "mid" | "high";

export type ProductImageTiers = {
	low: string;
	mid: string;
	high: string;
};

/** Normalize catalog masters to the high WebP path. */
export function toHighImage(src: string): string {
	if (!src) return src;
	let path = src.trim();
	// Strip accidental mid/low/cards prefixes back to catalog root.
	path = path
		.replace(/^\/products\/(?:mid|low|cards)\//, "/products/")
		.replace(/\.(jpe?g|png)$/i, ".webp");
	return path;
}

function relativeUnderProducts(highSrc: string): string {
	return toHighImage(highSrc)
		.replace(/^\/products\//, "")
		.replace(/\.(jpe?g|png)$/i, ".webp");
}

export function toMidImage(src: string): string {
	const high = toHighImage(src);
	if (!high.startsWith("/products/")) return high;
	return `/products/mid/${relativeUnderProducts(high)}`;
}

export function toLowImage(src: string): string {
	const high = toHighImage(src);
	if (!high.startsWith("/products/")) return high;
	return `/products/low/${relativeUnderProducts(high)}`;
}

export function productImageTiers(src: string): ProductImageTiers {
	const high = toHighImage(src);
	return {
		low: toLowImage(high),
		mid: toMidImage(high),
		high,
	};
}

/** Listing/card image path — mid tier. */
export function toCardImage(src: string): string {
	return toMidImage(src);
}
