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
	category: string;
	image: string;
	images: string[];
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

export function parseCatalogPriceRupees(price: string): number {
	return Math.round(Number(String(price).replace(/[^\d.]/g, "")) || 0);
}

export function productDetailsProse(product: CatalogProduct): string {
	if (product.details.length > 0) return `${product.details.join(". ")}.`;
	return product.description || product.fabric || "";
}
