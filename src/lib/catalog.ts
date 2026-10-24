import type { RowDataPacket } from "mysql2";
import { getDb } from "@/lib/db";
import type {
	CatalogColor,
	CatalogProduct,
	PdpLayout,
} from "@/lib/catalog-types";

export type {
	CatalogColor,
	CatalogProduct,
	PdpLayout,
} from "@/lib/catalog-types";
export {
	parseCatalogPriceRupees,
	productDetailsProse,
} from "@/lib/catalog-types";

type ProductRow = RowDataPacket & {
	id: number;
	slug: string;
	name: string;
	title: string;
	fabric: string | null;
	description: string | null;
	marketing_line: string | null;
	alternatives_json: unknown;
	details_json: unknown;
	category: string | null;
	image_url: string;
	images_json: unknown;
	price_cents: number;
	swatches_json: unknown;
	colors_json: unknown;
	sizes_json: unknown;
	size_fit: string | null;
	shipping: string | null;
	pdp_layout: string;
};

const DEFAULT_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const DEFAULT_SHIP =
	"Free standard shipping on orders above ₹3,000. Express delivery available at checkout. Hassle-free 30-day returns.";

function parseJsonArray<T>(value: unknown, fallback: T[]): T[] {
	if (value == null) return fallback;
	if (Array.isArray(value)) return value as T[];
	if (typeof value === "string") {
		try {
			const parsed = JSON.parse(value) as unknown;
			return Array.isArray(parsed) ? (parsed as T[]) : fallback;
		} catch {
			return fallback;
		}
	}
	return fallback;
}

function formatPriceRupees(cents: number): string {
	const rupees = Math.round(Number(cents) / 100) || 0;
	return rupees.toLocaleString("en-IN", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
}

function mapRow(row: ProductRow): CatalogProduct {
	const colors = parseJsonArray<CatalogColor>(row.colors_json, []);
	const swatchesFromDb = parseJsonArray<string>(row.swatches_json, []);
	const swatches =
		swatchesFromDb.length > 0 ? swatchesFromDb : colors.map((c) => c.hex);
	const images = parseJsonArray<string>(row.images_json, []);
	const image = row.image_url || images[0] || "/products/man-image-100.webp";

	return {
		id: row.id,
		slug: row.slug,
		name: row.name,
		title: row.title,
		fabric: row.fabric ?? "",
		description: row.description ?? "",
		marketingLine: row.marketing_line ?? "",
		alternatives: parseJsonArray<string>(row.alternatives_json, []),
		details: parseJsonArray<string>(row.details_json, []),
		category: row.category ?? "",
		image,
		images: images.length > 0 ? images : [image],
		price: formatPriceRupees(row.price_cents),
		priceCents: Number(row.price_cents) || 0,
		swatches,
		colors,
		sizes: parseJsonArray<string>(row.sizes_json, DEFAULT_SIZES),
		sizeFit: row.size_fit?.trim() || "True to size.",
		shipping: row.shipping?.trim() || DEFAULT_SHIP,
		pdpLayout: row.pdp_layout === "single" ? "single" : "outfit",
	};
}

const SELECT_COLS = `
  id, slug, name, title, fabric, description, marketing_line,
  alternatives_json, details_json, category, image_url, images_json,
  price_cents, swatches_json, colors_json, sizes_json, size_fit,
  shipping, pdp_layout
`;

export async function listProducts(): Promise<CatalogProduct[]> {
	const [rows] = await getDb().execute<ProductRow[]>(
		`SELECT ${SELECT_COLS} FROM products ORDER BY id ASC`,
	);
	return (rows as ProductRow[]).map(mapRow);
}

export async function getProductBySlug(
	slug: string,
): Promise<CatalogProduct | null> {
	if (!slug) return null;
	const [rows] = await getDb().execute<ProductRow[]>(
		`SELECT ${SELECT_COLS} FROM products WHERE slug = :slug LIMIT 1`,
		{ slug },
	);
	const row = (rows as ProductRow[])[0];
	return row ? mapRow(row) : null;
}

export async function getProductById(
	id: number,
): Promise<CatalogProduct | null> {
	const [rows] = await getDb().execute<ProductRow[]>(
		`SELECT ${SELECT_COLS} FROM products WHERE id = :id LIMIT 1`,
		{ id },
	);
	const row = (rows as ProductRow[])[0];
	return row ? mapRow(row) : null;
}

export async function resolvePdpLayout(slug: string): Promise<PdpLayout> {
	const product = await getProductBySlug(slug);
	return product?.pdpLayout ?? "outfit";
}

export async function listProductSlugs(): Promise<string[]> {
	const products = await listProducts();
	return products.map((p) => p.slug);
}
