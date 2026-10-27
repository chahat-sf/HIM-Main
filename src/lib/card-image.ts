/**
 * Listing/card image path.
 * Currently returns the catalog master as-is (no downscaled /products/cards/ variant)
 * so product imagery stays sharp.
 */
export function toCardImage(src: string): string {
	return src;
}
