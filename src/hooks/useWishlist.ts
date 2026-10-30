"use client";

import { useWishlistContext } from "@/components/WishlistProvider";

/**
 * Shared wishlist — prefers WishlistProvider when mounted (one /api/wishlist).
 */
export function useWishlist() {
	const ctx = useWishlistContext();
	if (ctx) return ctx;

	return {
		items: [],
		itemCount: 0,
		loading: true,
		isAuthenticated: false,
		has: () => false,
		add: async () => {},
		remove: async () => {},
		toggle: async () => false,
		refresh: async () => {},
	};
}
