"use client";

import { useCartContext } from "@/components/CartProvider";

/**
 * Shared cart — prefers CartProvider when mounted (one /api/cart).
 */
export function useCart() {
	const ctx = useCartContext();
	if (ctx) return ctx;

	return {
		items: [],
		itemCount: 0,
		loading: true,
		isAuthenticated: false,
		addItem: async () => {},
		updateQty: async () => {},
		removeItem: async () => {},
		refresh: async () => {},
	};
}
