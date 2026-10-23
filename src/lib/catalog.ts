import productsJson from "@/data/products.json";

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
	price: string;
	swatches: string[];
};

export const CATALOG_PRODUCTS = productsJson as CatalogProduct[];

export function getCatalogProductBySlug(
	slug: string,
): CatalogProduct | undefined {
	return CATALOG_PRODUCTS.find((p) => p.slug === slug);
}

export function getCatalogProductById(id: number): CatalogProduct | undefined {
	return CATALOG_PRODUCTS.find((p) => p.id === id);
}

export function parseCatalogPriceRupees(price: string): number {
	return Math.round(Number(String(price).replace(/[^\d.]/g, "")) || 0);
}
