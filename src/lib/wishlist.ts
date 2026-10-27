import type { RowDataPacket } from "mysql2";
import { getDb } from "@/lib/db";
import type { WishlistItem, WishlistItemInput } from "@/lib/wishlist-types";

function parseSwatches(raw: unknown): string[] {
	if (Array.isArray(raw)) return raw.map(String);
	if (typeof raw === "string") {
		try {
			const parsed = JSON.parse(raw) as unknown;
			if (Array.isArray(parsed)) return parsed.map(String);
		} catch {
			return [];
		}
	}
	return [];
}

function rowToItem(row: RowDataPacket): WishlistItem {
	return {
		id: String(row.id),
		productId: row.product_id == null ? null : Number(row.product_id),
		slug: String(row.product_slug),
		name: String(row.product_name),
		price: Math.round(Number(row.price_cents) / 100),
		image: String(row.image_url),
		swatches: parseSwatches(row.swatches_json),
	};
}

async function resolveProduct(input: WishlistItemInput): Promise<{
	productId: number | null;
	slug: string;
	name: string;
	image: string;
	priceCents: number;
	swatches: string[];
}> {
	const db = getDb();
	let row: RowDataPacket | undefined;

	if (input.productId != null && Number.isFinite(Number(input.productId))) {
		const [rows] = await db.query<RowDataPacket[]>(
			`SELECT id, slug, name, image_url, price_cents, swatches_json
       FROM products WHERE id = :id LIMIT 1`,
			{ id: Number(input.productId) },
		);
		row = rows?.[0];
	}

	if (!row && input.slug?.trim()) {
		const [rows] = await db.query<RowDataPacket[]>(
			`SELECT id, slug, name, image_url, price_cents, swatches_json
       FROM products WHERE slug = :slug LIMIT 1`,
			{ slug: input.slug.trim() },
		);
		row = rows?.[0];
	}

	if (row) {
		const catalogSwatches = parseSwatches(row.swatches_json);
		return {
			productId: Number(row.id),
			slug: String(row.slug),
			name: input.name?.trim() || String(row.name),
			image: input.image?.trim() || String(row.image_url),
			// Always trust catalog price for known products.
			priceCents: Number(row.price_cents) || 0,
			swatches:
				input.swatches && input.swatches.length > 0
					? input.swatches
					: catalogSwatches,
		};
	}

	throw new Error("Unknown product");
}

export async function listWishlistItems(
	userId: number,
): Promise<WishlistItem[]> {
	const db = getDb();
	const [rows] = await db.query<RowDataPacket[]>(
		`SELECT id, product_id, product_slug, product_name, price_cents, image_url, swatches_json
     FROM saved_items WHERE user_id = :userId
     ORDER BY created_at DESC, id DESC`,
		{ userId },
	);
	return (rows ?? []).map(rowToItem);
}

export async function addWishlistItem(
	userId: number,
	input: WishlistItemInput,
): Promise<WishlistItem[]> {
	const db = getDb();
	const resolved = await resolveProduct(input);
	if (!resolved.slug || !resolved.name || !resolved.image) {
		throw new Error("Invalid wishlist item");
	}

	await db.execute(
		`INSERT INTO saved_items
      (user_id, product_id, product_slug, product_name, price_cents, image_url, swatches_json)
     VALUES
      (:userId, :productId, :slug, :name, :priceCents, :image, CAST(:swatches AS JSON))
     ON DUPLICATE KEY UPDATE
      product_id = COALESCE(VALUES(product_id), product_id),
      product_name = VALUES(product_name),
      price_cents = VALUES(price_cents),
      image_url = VALUES(image_url),
      swatches_json = VALUES(swatches_json)`,
		{
			userId,
			productId: resolved.productId,
			slug: resolved.slug,
			name: resolved.name,
			priceCents: resolved.priceCents,
			image: resolved.image,
			swatches: JSON.stringify(resolved.swatches),
		},
	);

	return listWishlistItems(userId);
}

export async function removeWishlistItem(
	userId: number,
	slug: string,
): Promise<WishlistItem[]> {
	const db = getDb();
	await db.execute(
		`DELETE FROM saved_items WHERE user_id = :userId AND product_slug = :slug`,
		{ userId, slug: slug.trim() },
	);
	return listWishlistItems(userId);
}

export async function toggleWishlistItem(
	userId: number,
	input: WishlistItemInput,
): Promise<{ items: WishlistItem[]; added: boolean }> {
	const db = getDb();
	const slug = input.slug.trim();
	const [existing] = await db.query<RowDataPacket[]>(
		`SELECT id FROM saved_items
     WHERE user_id = :userId AND product_slug = :slug LIMIT 1`,
		{ userId, slug },
	);

	if (existing?.[0]) {
		const items = await removeWishlistItem(userId, slug);
		return { items, added: false };
	}

	const items = await addWishlistItem(userId, input);
	return { items, added: true };
}

const MERGE_MAX_ITEMS = 50;

export async function mergeWishlistItems(
	userId: number,
	items: WishlistItemInput[],
): Promise<WishlistItem[]> {
	const capped = items.slice(0, MERGE_MAX_ITEMS);
	for (const item of capped) {
		if (!item.slug?.trim() || !item.name?.trim() || !item.image?.trim()) {
			continue;
		}
		try {
			await addWishlistItem(userId, item);
		} catch {
			/* skip unknown / invalid lines */
		}
	}
	return listWishlistItems(userId);
}

/** Back-compat wrappers used by account saved API */
export async function addSavedItem(
	userId: number,
	input: {
		slug: string;
		name: string;
		priceCents: number;
		imageUrl: string;
		swatches?: string[];
		productId?: number | null;
	},
): Promise<void> {
	await addWishlistItem(userId, {
		productId: input.productId ?? null,
		slug: input.slug,
		name: input.name,
		price: Math.round(input.priceCents / 100),
		image: input.imageUrl,
		swatches: input.swatches,
	});
}

export async function removeSavedItem(
	userId: number,
	slug: string,
): Promise<void> {
	await removeWishlistItem(userId, slug);
}
