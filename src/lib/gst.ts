/**
 * Tax-inclusive GST helpers — safe for client and server.
 * Keep Node-only mail/checkout code out of this module.
 */

/** GST rate embedded in catalog prices (tax-inclusive). */
export const TAX_RATE = 0.18;

/**
 * Split an inclusive (GST-included) amount into taxable value + GST.
 * Catalog/line prices are what the customer pays; GST is extracted, not added.
 */
export function splitInclusiveGst(inclusiveCents: number): {
	taxableCents: number;
	taxCents: number;
} {
	const total = Math.max(0, Math.round(inclusiveCents));
	const taxCents = Math.round((total * TAX_RATE) / (1 + TAX_RATE));
	return {
		taxableCents: total - taxCents,
		taxCents,
	};
}
