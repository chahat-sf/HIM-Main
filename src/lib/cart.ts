import type { RowDataPacket } from "mysql2";
import { getDb } from "@/lib/db";
import type { CartItem, CartItemInput } from "@/lib/cart-types";
import type { CatalogColor } from "@/lib/catalog-types";
import { resolveCartColor, selectedColorSwatches } from "@/lib/color-swatch";
import { FIELD_LIMITS } from "@/lib/validation";

function clampCartQty(qty: number): number {
	const n = Math.max(1, Math.floor(Number(qty) || 1));
	return Math.min(n, FIELD_LIMITS.cartQty);
}

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

function parseColors(raw: unknown): CatalogColor[] {
	if (Array.isArray(raw)) {
		return raw
			.map((row) => {
				if (!row || typeof row !== "object") return null;
				const r = row as { name?: unknown; hex?: unknown };
				const name = typeof r.name === "string" ? r.name.trim() : "";
				const hex = typeof r.hex === "string" ? r.hex.trim() : "";
				if (!name || !hex) return null;
				return { name, hex };
			})
			.filter((c): c is CatalogColor => c != null);
	}
	if (typeof raw === "string") {
		try {
			return parseColors(JSON.parse(raw) as unknown);
		} catch {
			return [];
		}
	}
	return [];
}

function rowToItem(row: RowDataPacket): CartItem {
	const catalogColors = parseColors(row.product_colors_json);
	const rawColor = String(row.color ?? "");
	const hasCatalog = "product_colors_json" in row;

	let color = rawColor;
	let swatches = parseSwatches(row.swatches_json);
	const catalogImage =
		typeof row.product_image_url === "string"
			? row.product_image_url.trim()
			: "";
	const image = catalogImage || String(row.image_url ?? "");

	if (hasCatalog) {
		color = resolveCartColor(catalogColors, rawColor);
		swatches = selectedColorSwatches(catalogColors, color);
	}

	return {
		id: String(row.id),
		productId: row.product_id == null ? null : Number(row.product_id),
		slug: String(row.product_slug),
		name: String(row.product_name),
		size: String(row.size ?? ""),
		color,
		price: Math.round(Number(row.price_cents) / 100),
		qty: Number(row.qty),
		image,
		swatches,
	};
}

async function resolveProduct(input: CartItemInput): Promise<{
	productId: number | null;
	slug: string;
	name: string;
	image: string;
	priceCents: number;
	color: string;
	swatches: string[];
}> {
	const db = getDb();
	let row: RowDataPacket | undefined;

	if (input.productId != null && Number.isFinite(Number(input.productId))) {
		const [rows] = await db.query<RowDataPacket[]>(
			`SELECT id, slug, name, image_url, price_cents, colors_json
       FROM products WHERE id = :id LIMIT 1`,
			{ id: Number(input.productId) },
		);
		row = rows?.[0];
	}

	if (!row && input.slug?.trim()) {
		const [rows] = await db.query<RowDataPacket[]>(
			`SELECT id, slug, name, image_url, price_cents, colors_json
       FROM products WHERE slug = :slug LIMIT 1`,
			{ slug: input.slug.trim() },
		);
		row = rows?.[0];
	}

	if (row) {
		const colors = parseColors(row.colors_json);
		const color = resolveCartColor(colors, input.color);
		return {
			productId: Number(row.id),
			slug: String(row.slug),
			name: input.name?.trim() || String(row.name),
			// Always trust catalog image for known products (avoids stale/missing paths).
			image: String(row.image_url),
			// Always trust catalog price for known products.
			priceCents: Number(row.price_cents) || 0,
			color,
			swatches: selectedColorSwatches(colors, color),
		};
	}

	// Reject unknown catalog lines for authenticated cart writes.
	throw new Error("Unknown product");
}

export async function listCartItems(userId: number): Promise<CartItem[]> {
	const db = getDb();
	const [rows] = await db.query<RowDataPacket[]>(
		`SELECT
       c.id, c.product_id, c.product_slug, c.product_name, c.size, c.color,
       c.price_cents, c.qty, c.image_url, c.swatches_json,
       p.colors_json AS product_colors_json,
       p.image_url AS product_image_url
     FROM cart_items c
     LEFT JOIN products p ON (
       (c.product_id IS NOT NULL AND p.id = c.product_id)
       OR (c.product_id IS NULL AND p.slug = c.product_slug)
     )
     WHERE c.user_id = :userId
     ORDER BY c.updated_at DESC, c.id DESC`,
		{ userId },
	);
	return (rows ?? []).map(rowToItem);
}

export async function upsertCartItem(
	userId: number,
	input: CartItemInput,
): Promise<CartItem[]> {
	const db = getDb();
	const resolved = await resolveProduct(input);
	if (!resolved.slug || !resolved.name || !resolved.image) {
		throw new Error("Invalid cart item");
	}

	const qty = clampCartQty(input.qty ?? 1);
	const size = (input.size ?? "").trim();
	const color = resolved.color;
	const swatches = JSON.stringify(resolved.swatches);

	if (resolved.productId != null) {
		await db.execute(
			`INSERT INTO cart_items
        (user_id, product_id, product_slug, product_name, size, color, price_cents, qty, image_url, swatches_json)
       VALUES
        (:userId, :productId, :slug, :name, :size, :color, :priceCents, :qty, :image, CAST(:swatches AS JSON))
       ON DUPLICATE KEY UPDATE
         product_slug = VALUES(product_slug),
         product_name = VALUES(product_name),
         price_cents = VALUES(price_cents),
         qty = qty + VALUES(qty),
         image_url = VALUES(image_url),
         color = VALUES(color),
         swatches_json = VALUES(swatches_json)`,
			{
				userId,
				productId: resolved.productId,
				slug: resolved.slug,
				name: resolved.name,
				size,
				color,
				priceCents: resolved.priceCents,
				qty,
				image: resolved.image,
				swatches,
			},
		);
	} else {
		// Guest-origin / non-catalog lines without product_id: match by slug+size+color
		const [existing] = await db.query<RowDataPacket[]>(
			`SELECT id, qty FROM cart_items
       WHERE user_id = :userId AND product_id IS NULL
         AND product_slug = :slug AND size = :size AND color = :color
       LIMIT 1`,
			{ userId, slug: resolved.slug, size, color },
		);
		if (existing?.[0]) {
			await db.execute(
				`UPDATE cart_items
         SET product_name = :name, price_cents = :priceCents, qty = qty + :qty,
             image_url = :image, swatches_json = CAST(:swatches AS JSON)
         WHERE id = :id AND user_id = :userId`,
				{
					id: existing[0].id,
					userId,
					name: resolved.name,
					priceCents: resolved.priceCents,
					qty,
					image: resolved.image,
					swatches,
				},
			);
		} else {
			await db.execute(
				`INSERT INTO cart_items
          (user_id, product_id, product_slug, product_name, size, color, price_cents, qty, image_url, swatches_json)
         VALUES
          (:userId, NULL, :slug, :name, :size, :color, :priceCents, :qty, :image, CAST(:swatches AS JSON))`,
				{
					userId,
					slug: resolved.slug,
					name: resolved.name,
					size,
					color,
					priceCents: resolved.priceCents,
					qty,
					image: resolved.image,
					swatches,
				},
			);
		}
	}

	return listCartItems(userId);
}

export async function setCartItemQty(
	userId: number,
	itemId: number,
	qty: number,
): Promise<CartItem[]> {
	const db = getDb();
	const nextQty = clampCartQty(qty);
	await db.execute(
		`UPDATE cart_items SET qty = :qty
     WHERE id = :itemId AND user_id = :userId`,
		{ userId, itemId, qty: nextQty },
	);
	return listCartItems(userId);
}

export async function removeCartItem(
	userId: number,
	itemId: number,
): Promise<CartItem[]> {
	const db = getDb();
	await db.execute(
		`DELETE FROM cart_items WHERE id = :itemId AND user_id = :userId`,
		{ userId, itemId },
	);
	return listCartItems(userId);
}

const MERGE_MAX_ITEMS = 50;

/** Insert/replace a line with absolute qty (does not add to existing qty). */
async function putCartItem(
	userId: number,
	input: CartItemInput,
): Promise<void> {
	const db = getDb();
	const resolved = await resolveProduct(input);
	if (!resolved.slug || !resolved.name || !resolved.image) {
		throw new Error("Invalid cart item");
	}

	const qty = clampCartQty(input.qty ?? 1);
	const size = (input.size ?? "").trim();
	const color = resolved.color;
	const swatches = JSON.stringify(resolved.swatches);

	if (resolved.productId != null) {
		await db.execute(
			`INSERT INTO cart_items
        (user_id, product_id, product_slug, product_name, size, color, price_cents, qty, image_url, swatches_json)
       VALUES
        (:userId, :productId, :slug, :name, :size, :color, :priceCents, :qty, :image, CAST(:swatches AS JSON))
       ON DUPLICATE KEY UPDATE
         product_slug = VALUES(product_slug),
         product_name = VALUES(product_name),
         price_cents = VALUES(price_cents),
         qty = VALUES(qty),
         image_url = VALUES(image_url),
         color = VALUES(color),
         swatches_json = VALUES(swatches_json)`,
			{
				userId,
				productId: resolved.productId,
				slug: resolved.slug,
				name: resolved.name,
				size,
				color,
				priceCents: resolved.priceCents,
				qty,
				image: resolved.image,
				swatches,
			},
		);
		return;
	}

	const [existing] = await db.query<RowDataPacket[]>(
		`SELECT id FROM cart_items
     WHERE user_id = :userId AND product_id IS NULL
       AND product_slug = :slug AND size = :size AND color = :color
     LIMIT 1`,
		{ userId, slug: resolved.slug, size, color },
	);
	if (existing?.[0]) {
		await db.execute(
			`UPDATE cart_items
       SET product_name = :name, price_cents = :priceCents, qty = :qty,
           image_url = :image, swatches_json = CAST(:swatches AS JSON)
       WHERE id = :id AND user_id = :userId`,
			{
				id: existing[0].id,
				userId,
				name: resolved.name,
				priceCents: resolved.priceCents,
				qty,
				image: resolved.image,
				swatches,
			},
		);
		return;
	}

	await db.execute(
		`INSERT INTO cart_items
      (user_id, product_id, product_slug, product_name, size, color, price_cents, qty, image_url, swatches_json)
     VALUES
      (:userId, NULL, :slug, :name, :size, :color, :priceCents, :qty, :image, CAST(:swatches AS JSON))`,
		{
			userId,
			slug: resolved.slug,
			name: resolved.name,
			size,
			color,
			priceCents: resolved.priceCents,
			qty,
			image: resolved.image,
			swatches,
		},
	);
}

/**
 * Guest cart wins: when items are present, replace the server cart entirely.
 * Empty guest payload leaves the server cart unchanged.
 */
export async function mergeCartItems(
	userId: number,
	items: CartItemInput[],
): Promise<CartItem[]> {
	const capped = items
		.slice(0, MERGE_MAX_ITEMS)
		.filter(
			(item) =>
				Boolean(item.slug?.trim()) &&
				Boolean(item.name?.trim()) &&
				Boolean(item.image?.trim()),
		);

	if (capped.length === 0) {
		return listCartItems(userId);
	}

	const db = getDb();
	await db.execute(`DELETE FROM cart_items WHERE user_id = :userId`, {
		userId,
	});

	for (const item of capped) {
		try {
			await putCartItem(userId, {
				...item,
				qty: clampCartQty(item.qty ?? 1),
			});
		} catch {
			/* skip unknown / invalid lines */
		}
	}
	return listCartItems(userId);
}
