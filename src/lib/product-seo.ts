/** SEO-approved product metadata keyed by final canonical slug. */

export type ProductSeoEntry = {
	metaTitle: string;
	metaDescription: string;
	mainImageAlt: string;
	/** Preferred OG path when asset lands under public/og/ */
	ogImagePreferred: string;
	marketingLine: string;
};

export const PRODUCT_SLUG_REDIRECTS: Record<string, string> = {
	"textured-thermal-white-9": "the-nocturne-black-velvet-jacket",
	"textured-thermal-white-12": "the-last-word-black-evening-tuxedo",
	"textured-thermal-white-11": "the-composure-black-cotton-velvet-jacket",
	"textured-thermal-white-10": "the-archivist-houndstooth-wool-overcoat",
	"textured-thermal-white-8": "the-exception-double-breasted-denim-suit",
	"textured-thermal-white-7": "the-attache-double-breasted-blazer",
};

export const PRODUCT_SEO: Record<string, ProductSeoEntry> = {
	"the-nocturne-black-velvet-jacket": {
		metaTitle: "The Nocturne Black Velvet Jacket | HIM World",
		metaDescription:
			"The Nocturne by HIM World: a black embellished velvet jacket in premium Korean velvet. Midnight mystery with timeless elegance for evening wear.",
		mainImageAlt:
			"The Nocturne black embellished velvet jacket by HIM World, front view",
		ogImagePreferred: "/og/og-the-nocturne-black-velvet-jacket.jpg",
		marketingLine: "Midnight mystery, tailored in velvet.",
	},
	"the-last-word-black-evening-tuxedo": {
		metaTitle: "The Last Word Black Evening Tuxedo | HIM World",
		metaDescription:
			"The Last Word by HIM World: a black evening tuxedo in all-weather Merino wool blend. Sharp structured tailoring for a commanding look.",
		mainImageAlt:
			"The Last Word black evening tuxedo by HIM World, front view",
		ogImagePreferred: "/og/og-the-last-word-black-evening-tuxedo.jpg",
		marketingLine: "Understated authority. Lasting impression.",
	},
	"the-composure-black-cotton-velvet-jacket": {
		metaTitle: "The Composure Cotton-Velvet Jacket | HIM World",
		metaDescription:
			"The Composure by HIM World: a structured black cotton-velvet jacket with a sharp silhouette. Quiet confidence, modern sophistication.",
		mainImageAlt:
			"The Composure black cotton-velvet structured jacket by HIM World",
		ogImagePreferred: "/og/og-the-composure-black-cotton-velvet-jacket.jpg",
		marketingLine: "Presence, not performance.",
	},
	"the-archivist-houndstooth-wool-overcoat": {
		metaTitle: "The Archivist Houndstooth Overcoat | HIM World",
		metaDescription:
			"The Archivist by HIM World: a houndstooth wool-blend overcoat with a structured silhouette. Heritage-inspired tailoring with timeless character.",
		mainImageAlt:
			"The Archivist houndstooth wool overcoat by HIM World, front view",
		ogImagePreferred: "/og/og-the-archivist-houndstooth-wool-overcoat.jpg",
		marketingLine: "Heritage, worn with character.",
	},
	"the-exception-double-breasted-denim-suit": {
		metaTitle: "The Exception Double-Breasted Denim Suit | HIM World",
		metaDescription:
			"The Exception by HIM World: a double-breasted tailored suit in premium 10 oz denim. Denim character with a sharp formal silhouette.",
		mainImageAlt:
			"The Exception double-breasted tailored denim suit by HIM World",
		ogImagePreferred: "/og/og-the-exception-double-breasted-denim-suit.jpg",
		marketingLine: "Style beyond convention.",
	},
	"the-attache-double-breasted-blazer": {
		metaTitle: "The Attaché Double-Breasted Blazer | HIM World",
		metaDescription:
			"The Attaché by HIM World: a dark double-breasted blazer in terry rayon blend. A commanding tailored silhouette inspired by modern diplomacy.",
		mainImageAlt:
			"The Attaché dark double-breasted tailored blazer by HIM World",
		ogImagePreferred: "/og/og-the-attache-double-breasted-blazer.jpg",
		marketingLine: "Worldly polish, sharply tailored.",
	},
};

export function getProductSeo(slug: string): ProductSeoEntry | null {
	return PRODUCT_SEO[slug] ?? null;
}
