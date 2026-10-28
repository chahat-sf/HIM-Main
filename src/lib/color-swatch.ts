export type ColorOption = { name: string; hex: string };

/**
 * Cart/wishlist display swatches for a selected color name.
 * Empty catalog colors → []; otherwise at most one hex for the match.
 */
export function selectedColorSwatches(
	colors: ColorOption[] | null | undefined,
	colorName: string | null | undefined,
): string[] {
	if (!colors?.length) return [];
	const name = (colorName ?? "").trim().toLowerCase();
	if (!name) return [];
	const match = colors.find((c) => c.name.trim().toLowerCase() === name);
	const hex = match?.hex?.trim();
	return hex ? [hex] : [];
}

/** Drop color label when the product has no catalog colors. */
export function resolveCartColor(
	colors: ColorOption[] | null | undefined,
	colorName: string | null | undefined,
): string {
	if (!colors?.length) return "";
	const name = (colorName ?? "").trim();
	if (!name) return "";
	const match = colors.find(
		(c) => c.name.trim().toLowerCase() === name.toLowerCase(),
	);
	return match?.name ?? "";
}
