import type { RowDataPacket } from "mysql2";
import { getDb } from "@/lib/db";
import type { CartItem, CartItemInput } from "@/lib/cart-types";

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

function rowToItem(row: RowDataPacket): CartItem {
  return {
    id: String(row.id),
    productId: row.product_id == null ? null : Number(row.product_id),
    slug: String(row.product_slug),
    name: String(row.product_name),
    size: String(row.size ?? ""),
    color: String(row.color ?? ""),
    price: Math.round(Number(row.price_cents) / 100),
    qty: Number(row.qty),
    image: String(row.image_url),
    swatches: parseSwatches(row.swatches_json),
  };
}

async function resolveProduct(
  input: CartItemInput,
): Promise<{
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
      priceCents:
        input.price != null && Number.isFinite(Number(input.price))
          ? Math.max(0, Math.round(Number(input.price) * 100))
          : Number(row.price_cents),
      swatches:
        input.swatches && input.swatches.length > 0
          ? input.swatches
          : catalogSwatches,
    };
  }

  return {
    productId: null,
    slug: input.slug.trim(),
    name: input.name.trim(),
    image: input.image.trim(),
    priceCents: Math.max(0, Math.round(Number(input.price) * 100) || 0),
    swatches: input.swatches ?? [],
  };
}

export async function listCartItems(userId: number): Promise<CartItem[]> {
  const db = getDb();
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT id, product_id, product_slug, product_name, size, color, price_cents, qty, image_url, swatches_json
     FROM cart_items WHERE user_id = :userId
     ORDER BY updated_at DESC, id DESC`,
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

  const qty = Math.max(1, input.qty ?? 1);
  const size = (input.size ?? "").trim();
  const color = (input.color ?? "").trim();
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
  const nextQty = Math.max(1, Math.floor(qty));
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

export async function mergeCartItems(
  userId: number,
  items: CartItemInput[],
): Promise<CartItem[]> {
  for (const item of items) {
    if (!item.slug?.trim() || !item.name?.trim() || !item.image?.trim()) {
      continue;
    }
    await upsertCartItem(userId, {
      ...item,
      qty: Math.max(1, item.qty ?? 1),
    });
  }
  return listCartItems(userId);
}
