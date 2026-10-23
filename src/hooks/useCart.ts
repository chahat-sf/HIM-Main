"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CartItem, CartItemInput } from "@/lib/cart-types";
import {
	addLocalCartItem,
	CART_CHANGED_EVENT,
	notifyCartChanged,
	readLocalCart,
	removeLocalCartItem,
	updateLocalCartQty,
} from "@/lib/cart-local";
import { useSession } from "@/hooks/useSession";

async function fetchServerCart(): Promise<CartItem[]> {
	const res = await fetch("/api/cart", { credentials: "include" });
	if (res.status === 401) return [];
	if (!res.ok) throw new Error("Unable to load cart");
	const body = (await res.json()) as { items?: CartItem[] };
	return body.items ?? [];
}

export function useCart() {
	const { isAuthenticated, loading: sessionLoading } = useSession();
	const [items, setItems] = useState<CartItem[]>([]);
	const [loading, setLoading] = useState(true);

	const refresh = useCallback(async () => {
		if (sessionLoading) return;
		setLoading(true);
		try {
			if (isAuthenticated) {
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
		const softRefresh = () => {
			if (sessionLoading) return;
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
			if (isAuthenticated) {
				const res = await fetch("/api/cart", {
					method: "POST",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(input),
				});
				if (!res.ok) throw new Error("Unable to add to cart");
				const body = (await res.json()) as { items?: CartItem[] };
				setItems(body.items ?? []);
				notifyCartChanged();
				return;
			}
			setItems(addLocalCartItem(input));
		},
		[isAuthenticated],
	);

	const updateQty = useCallback(
		async (id: string, qty: number) => {
			if (isAuthenticated) {
				const res = await fetch("/api/cart", {
					method: "PATCH",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ id, qty }),
				});
				if (!res.ok) throw new Error("Unable to update cart");
				const body = (await res.json()) as { items?: CartItem[] };
				setItems(body.items ?? []);
				notifyCartChanged();
				return;
			}
			setItems(updateLocalCartQty(id, qty));
		},
		[isAuthenticated],
	);

	const removeItem = useCallback(
		async (id: string) => {
			if (isAuthenticated) {
				const res = await fetch(`/api/cart?id=${encodeURIComponent(id)}`, {
					method: "DELETE",
					credentials: "include",
				});
				if (!res.ok) throw new Error("Unable to remove cart item");
				const body = (await res.json()) as { items?: CartItem[] };
				setItems(body.items ?? []);
				notifyCartChanged();
				return;
			}
			setItems(removeLocalCartItem(id));
		},
		[isAuthenticated],
	);

	const itemCount = useMemo(
		() => items.reduce((sum, item) => sum + item.qty, 0),
		[items],
	);

	return {
		items,
		itemCount,
		loading: loading || sessionLoading,
		isAuthenticated,
		addItem,
		updateQty,
		removeItem,
		refresh,
	};
}
