import type { CartItem, CartItemInput } from "@/lib/cart-types";

export const CART_STORAGE_KEY = "him_cart";
export const CART_CHANGED_EVENT = "him-cart-changed";

export function notifyCartChanged(): void {
	if (typeof window === "undefined") return;
	window.dispatchEvent(new Event(CART_CHANGED_EVENT));
}

function newLocalId(): string {
	if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
		return crypto.randomUUID();
	}
	return `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function readLocalCart(): CartItem[] {
	if (typeof window === "undefined") return [];
	try {
		const raw = window.localStorage.getItem(CART_STORAGE_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw) as unknown;
		if (!Array.isArray(parsed)) return [];
		return parsed
			.map((row) => normalizeLocalItem(row))
			.filter((row): row is CartItem => row != null);
	} catch {
		return [];
	}
}

function normalizeLocalItem(row: unknown): CartItem | null {
	if (!row || typeof row !== "object") return null;
	const r = row as Record<string, unknown>;
	const slug = String(r.slug ?? "").trim();
	const name = String(r.name ?? "").trim();
	const image = String(r.image ?? "").trim();
	if (!slug || !name || !image) return null;
	const productIdRaw = r.productId ?? r.product_id;
	const productId =
		productIdRaw == null || productIdRaw === "" ? null : Number(productIdRaw);

	return {
		id: String(r.id ?? newLocalId()),
		productId: Number.isFinite(productId as number)
			? (productId as number)
			: null,
		slug,
		name,
		size: String(r.size ?? ""),
		color: String(r.color ?? ""),
		price: Number(r.price) || 0,
		qty: Math.max(1, Number(r.qty) || 1),
		image,
		swatches: Array.isArray(r.swatches) ? r.swatches.map(String) : [],
	};
}

export function writeLocalCart(items: CartItem[]): void {
	if (typeof window === "undefined") return;
	window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
	notifyCartChanged();
}

export function clearLocalCart(): void {
	if (typeof window === "undefined") return;
	window.localStorage.removeItem(CART_STORAGE_KEY);
	notifyCartChanged();
}

function lineKey(item: {
	productId?: number | null;
	slug: string;
	size: string;
	color: string;
}) {
	const pid = item.productId != null ? String(item.productId) : item.slug;
	return `${pid}::${item.size}::${item.color}`;
}

export function addLocalCartItem(input: CartItemInput): CartItem[] {
	const items = readLocalCart();
	const key = lineKey({
		slug: input.slug.trim(),
		size: (input.size ?? "").trim(),
		color: (input.color ?? "").trim(),
	});
	const existing = items.find((item) => lineKey(item) === key);
	const qty = Math.max(1, input.qty ?? 1);
	const productId =
		input.productId != null && Number.isFinite(Number(input.productId))
			? Number(input.productId)
			: null;

	let next: CartItem[];
	if (existing) {
		next = items.map((item) =>
			item.id === existing.id
				? {
						...item,
						productId: productId ?? item.productId,
						name: input.name.trim(),
						price: Number(input.price) || 0,
						qty: item.qty + qty,
						image: input.image.trim(),
						swatches: input.swatches ?? item.swatches,
					}
				: item,
		);
	} else {
		next = [
			{
				id: newLocalId(),
				productId,
				slug: input.slug.trim(),
				name: input.name.trim(),
				size: (input.size ?? "").trim(),
				color: (input.color ?? "").trim(),
				price: Number(input.price) || 0,
				qty,
				image: input.image.trim(),
				swatches: input.swatches ?? [],
			},
			...items,
		];
	}

	writeLocalCart(next);
	return next;
}

export function updateLocalCartQty(id: string, qty: number): CartItem[] {
	const nextQty = Math.max(1, Math.floor(qty));
	const next = readLocalCart().map((item) =>
		item.id === id ? { ...item, qty: nextQty } : item,
	);
	writeLocalCart(next);
	return next;
}

export function removeLocalCartItem(id: string): CartItem[] {
	const next = readLocalCart().filter((item) => item.id !== id);
	writeLocalCart(next);
	return next;
}

export async function mergeLocalCartToServer(): Promise<CartItem[]> {
	const items = readLocalCart();
	if (items.length === 0) return [];

	const res = await fetch("/api/cart/merge", {
		method: "POST",
		credentials: "include",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			items: items.map((item) => ({
				productId: item.productId,
				slug: item.slug,
				name: item.name,
				size: item.size,
				color: item.color,
				price: item.price,
				qty: item.qty,
				image: item.image,
				swatches: item.swatches,
			})),
		}),
	});

	if (!res.ok) {
		throw new Error("Unable to merge cart");
	}

	const body = (await res.json()) as { items?: CartItem[] };
	const merged = body.items ?? [];
	clearLocalCart();
	return merged;
}
