import type { WishlistItem, WishlistItemInput } from "@/lib/wishlist-types";

export const WISHLIST_STORAGE_KEY = "him_wishlist";
export const WISHLIST_CHANGED_EVENT = "him-wishlist-changed";

export function notifyWishlistChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(WISHLIST_CHANGED_EVENT));
}

function newLocalId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `wish-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function readLocalWishlist(): WishlistItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((row) => normalizeLocalItem(row))
      .filter((row): row is WishlistItem => row != null);
  } catch {
    return [];
  }
}

function normalizeLocalItem(row: unknown): WishlistItem | null {
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;
  const slug = String(r.slug ?? "").trim();
  const name = String(r.name ?? "").trim();
  const image = String(r.image ?? "").trim();
  if (!slug || !name || !image) return null;
  const productIdRaw = r.productId ?? r.product_id;
  const productId =
    productIdRaw == null || productIdRaw === ""
      ? null
      : Number(productIdRaw);

  return {
    id: String(r.id ?? newLocalId()),
    productId: Number.isFinite(productId as number) ? (productId as number) : null,
    slug,
    name,
    price: Number(r.price) || 0,
    image,
    swatches: Array.isArray(r.swatches) ? r.swatches.map(String) : [],
  };
}

export function writeLocalWishlist(items: WishlistItem[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
  notifyWishlistChanged();
}

export function clearLocalWishlist(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(WISHLIST_STORAGE_KEY);
  notifyWishlistChanged();
}

export function addLocalWishlistItem(input: WishlistItemInput): WishlistItem[] {
  const items = readLocalWishlist();
  const slug = input.slug.trim();
  if (items.some((item) => item.slug === slug)) {
    return items;
  }

  const productId =
    input.productId != null && Number.isFinite(Number(input.productId))
      ? Number(input.productId)
      : null;

  const next: WishlistItem[] = [
    {
      id: newLocalId(),
      productId,
      slug,
      name: input.name.trim(),
      price: Number(input.price) || 0,
      image: input.image.trim(),
      swatches: input.swatches ?? [],
    },
    ...items,
  ];
  writeLocalWishlist(next);
  return next;
}

export function removeLocalWishlistItem(slug: string): WishlistItem[] {
  const next = readLocalWishlist().filter((item) => item.slug !== slug.trim());
  writeLocalWishlist(next);
  return next;
}

export function toggleLocalWishlistItem(
  input: WishlistItemInput,
): { items: WishlistItem[]; added: boolean } {
  const slug = input.slug.trim();
  const items = readLocalWishlist();
  if (items.some((item) => item.slug === slug)) {
    return { items: removeLocalWishlistItem(slug), added: false };
  }
  return { items: addLocalWishlistItem(input), added: true };
}

export async function mergeLocalWishlistToServer(): Promise<void> {
  const items = readLocalWishlist();
  if (items.length === 0) return;

  const res = await fetch("/api/wishlist/merge", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items: items.map((item) => ({
        productId: item.productId,
        slug: item.slug,
        name: item.name,
        price: item.price,
        image: item.image,
        swatches: item.swatches,
      })),
    }),
  });

  if (!res.ok) {
    throw new Error("Unable to merge wishlist");
  }

  clearLocalWishlist();
}
