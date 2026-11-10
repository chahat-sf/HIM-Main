export type PdpLayout = "outfit" | "single";

export type CatalogColor = { name: string; hex: string };

export type CatalogProduct = {
	id: number;
	slug: string;
	name: string;
	title: string;
	fabric: string;
	description: string;
	marketingLine: string;
	alternatives: string[];
	details: string[];
	/** What’s included with the product, e.g. "Blazer" or "Jacket and trousers" */
	includes: string;
	category: string;
	image: string;
	images: string[];
	/** PDP gallery video (last slot when set) */
	videoUrl: string | null;
	/** Display string e.g. "38,000.00" */
	price: string;
	priceCents: number;
	swatches: string[];
	colors: CatalogColor[];
	sizes: string[];
	sizeFit: string;
	shipping: string;
	pdpLayout: PdpLayout;
};

export type PdpMediaItem =
	| { kind: "image"; src: string }
	| { kind: "video"; src: string; poster: string };

export function productVideoPoster(videoUrl: string): string {
	return videoUrl.replace(/\.mp4$/i, "-poster.webp");
}

/** Card-only signature masters — keep off the PDP gallery (too compressed for hero). */
export function isCardSignatureImage(src: string): boolean {
	return /\/signature\.webp$/i.test(src.trim());
}

export function buildPdpMedia(product: CatalogProduct): PdpMediaItem[] {
	const gallery = product.images.filter((src) => !isCardSignatureImage(src));
	const items: PdpMediaItem[] = gallery.map((src) => ({
		kind: "image" as const,
		src,
	}));
	if (product.videoUrl) {
		items.push({
			kind: "video",
			src: product.videoUrl,
			poster: productVideoPoster(product.videoUrl),
		});
	}
	return items;
}

export function parseCatalogPriceRupees(price: string): number {
	return Math.round(Number(String(price).replace(/[^\d.]/g, "")) || 0);
}

export function productDetailsProse(product: CatalogProduct): string {
	if (product.details.length > 0) return `${product.details.join(". ")}.`;
	return product.description || product.fabric || "";
}
