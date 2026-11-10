"use client";

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
	type ReactNode,
} from "react";
import type { CartItem, CartItemInput } from "@/lib/cart-types";
import {
	addLocalCartItem,
	CART_CHANGED_EVENT,
	CART_STORAGE_KEY,
	mergeLocalCartToServer,
	readLocalCart,
	removeLocalCartItem,
	updateLocalCartQty,
} from "@/lib/cart-local";
import { useSession } from "@/hooks/useSession";
import { toast } from "@/components/Toast";
import { track } from "@/lib/analytics";

type CartContextValue = {
	items: CartItem[];
	itemCount: number;
	loading: boolean;
	isAuthenticated: boolean;
	addItem: (input: CartItemInput) => Promise<void>;
	updateQty: (id: string, qty: number) => Promise<void>;
	removeItem: (id: string) => Promise<void>;
	refresh: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

async function fetchServerCart(): Promise<CartItem[]> {
	const res = await fetch("/api/cart", { credentials: "include" });
	if (res.status === 401) return [];
	if (!res.ok) throw new Error("Unable to load cart");
	const body = (await res.json()) as { items?: CartItem[] };
	return body.items ?? [];
}

export function CartProvider({ children }: { children: ReactNode }) {
	const { isAuthenticated, loading: sessionLoading } = useSession();
	const [items, setItems] = useState<CartItem[]>([]);
	const [loading, setLoading] = useState(true);
	const recoveringRef = useRef(false);

	const refresh = useCallback(async () => {
		if (sessionLoading) return;
		setLoading(true);
		try {
			if (isAuthenticated) {
				const local = readLocalCart();
				if (local.length > 0 && !recoveringRef.current) {
					recoveringRef.current = true;
					try {
						const merged = await mergeLocalCartToServer();
						setItems(merged);
						return;
					} catch {
						/* fall through */
					} finally {
						recoveringRef.current = false;
					}
				}
				setItems(await fetchServerCart());
			} else {
				setItems(readLocalCart());
			}
		} catch {
			setItems(isAuthenticated ? [] : readLocalCart());
		} finally {
			setLoading(false);
		}
	}, [isAuthenticated, sessionLoading]);

	useEffect(() => {
		void refresh();
	}, [refresh]);

	useEffect(() => {
		const softRefresh = (event?: Event) => {
			if (sessionLoading) return;
			if (event?.type === "storage") {
				const storageEvent = event as StorageEvent;
				if (
					storageEvent.key != null &&
					storageEvent.key !== CART_STORAGE_KEY
				) {
					return;
				}
			}
			if (isAuthenticated) {
				void fetchServerCart()
					.then(setItems)
					.catch(() => setItems([]));
			} else {
				setItems(readLocalCart());
			}
		};
		window.addEventListener(CART_CHANGED_EVENT, softRefresh);
		window.addEventListener("storage", softRefresh);
		return () => {
			window.removeEventListener(CART_CHANGED_EVENT, softRefresh);
			window.removeEventListener("storage", softRefresh);
		};
	}, [isAuthenticated, sessionLoading]);

	const addItem = useCallback(
		async (input: CartItemInput) => {
			let usedServer = false;
			if (isAuthenticated) {
				const res = await fetch("/api/cart", {
					method: "POST",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(input),
				});
				// Stale client session after logout → fall back to guest cart.
				if (res.status === 401) {
					setItems(addLocalCartItem(input));
				} else if (!res.ok) {
					throw new Error("Unable to add to cart");
				} else {
					const body = (await res.json()) as { items?: CartItem[] };
					setItems(body.items ?? []);
					usedServer = true;
				}
			} else {
				setItems(addLocalCartItem(input));
			}
			toast("Added to bag");
			track("add_to_cart", {
				slug: input.slug,
				product_id: input.productId ?? undefined,
				name: input.name,
				price: input.price,
				qty: input.qty ?? 1,
				size: input.size,
				color: input.color,
				authenticated: usedServer,
			});
		},
		[isAuthenticated],
	);

	const updateQty = useCallback(
		async (id: string, qty: number) => {
			let usedServer = false;
			if (isAuthenticated) {
				const res = await fetch("/api/cart", {
					method: "PATCH",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ id, qty }),
				});
				if (res.status === 401) {
					setItems(updateLocalCartQty(id, qty));
				} else if (!res.ok) {
					throw new Error("Unable to update cart");
				} else {
					const body = (await res.json()) as { items?: CartItem[] };
					setItems(body.items ?? []);
					usedServer = true;
				}
			} else {
				setItems(updateLocalCartQty(id, qty));
			}
			track("cart_updated", {
				item_id: id,
				qty,
				authenticated: usedServer,
			});
		},
		[isAuthenticated],
	);

	const removeItem = useCallback(
		async (id: string) => {
			let usedServer = false;
			if (isAuthenticated) {
				const res = await fetch(`/api/cart?id=${encodeURIComponent(id)}`, {
					method: "DELETE",
					credentials: "include",
				});
				if (res.status === 401) {
					setItems(removeLocalCartItem(id));
				} else if (!res.ok) {
					throw new Error("Unable to remove cart item");
				} else {
					const body = (await res.json()) as { items?: CartItem[] };
					setItems(body.items ?? []);
					usedServer = true;
				}
			} else {
				setItems(removeLocalCartItem(id));
			}
			track("remove_from_cart", {
				item_id: id,
				authenticated: usedServer,
			});
		},
		[isAuthenticated],
	);

	const itemCount = useMemo(
		() => items.reduce((sum, item) => sum + item.qty, 0),
		[items],
	);

	const value = useMemo(
		() => ({
			items,
			itemCount,
			loading: loading || sessionLoading,
			isAuthenticated,
			addItem,
			updateQty,
			removeItem,
			refresh,
		}),
		[
			items,
			itemCount,
			loading,
			sessionLoading,
			isAuthenticated,
			addItem,
			updateQty,
			removeItem,
			refresh,
		],
	);

	return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCartContext() {
	return useContext(CartContext);
}
