"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { WishlistItem, WishlistItemInput } from "@/lib/wishlist-types";
import {
	addLocalWishlistItem,
	notifyWishlistChanged,
	readLocalWishlist,
	removeLocalWishlistItem,
	toggleLocalWishlistItem,
	WISHLIST_CHANGED_EVENT,
} from "@/lib/wishlist-local";
import { useSession } from "@/hooks/useSession";
import { toast } from "@/components/Toast";
import { track } from "@/lib/analytics";

async function fetchServerWishlist(): Promise<WishlistItem[]> {
	const res = await fetch("/api/wishlist", { credentials: "include" });
	if (res.status === 401) return [];
	if (!res.ok) throw new Error("Unable to load wishlist");
	const body = (await res.json()) as { items?: WishlistItem[] };
	return body.items ?? [];
}

export function useWishlist() {
	const { isAuthenticated, loading: sessionLoading } = useSession();
	const [items, setItems] = useState<WishlistItem[]>([]);
	const [loading, setLoading] = useState(true);

	const refresh = useCallback(async () => {
		if (sessionLoading) return;
		setLoading(true);
		try {
			if (isAuthenticated) {
				setItems(await fetchServerWishlist());
			} else {
				setItems(readLocalWishlist());
			}
		} catch {
			setItems(isAuthenticated ? [] : readLocalWishlist());
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
				void fetchServerWishlist()
					.then(setItems)
					.catch(() => setItems([]));
			} else {
				setItems(readLocalWishlist());
			}
		};
		window.addEventListener(WISHLIST_CHANGED_EVENT, softRefresh);
		window.addEventListener("storage", softRefresh);
		return () => {
			window.removeEventListener(WISHLIST_CHANGED_EVENT, softRefresh);
			window.removeEventListener("storage", softRefresh);
		};
	}, [isAuthenticated, sessionLoading]);

	const add = useCallback(
		async (input: WishlistItemInput) => {
			if (isAuthenticated) {
				const res = await fetch("/api/wishlist", {
					method: "POST",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(input),
				});
				if (!res.ok) throw new Error("Unable to add to wishlist");
				const body = (await res.json()) as { items?: WishlistItem[] };
				setItems(body.items ?? []);
				notifyWishlistChanged();
				toast("Added to wishlist");
				return;
			}
			setItems(addLocalWishlistItem(input));
			toast("Added to wishlist");
		},
		[isAuthenticated],
	);

	const remove = useCallback(
		async (slug: string) => {
			if (isAuthenticated) {
				const res = await fetch(
					`/api/wishlist?slug=${encodeURIComponent(slug)}`,
					{ method: "DELETE", credentials: "include" },
				);
				if (!res.ok) throw new Error("Unable to remove from wishlist");
				const body = (await res.json()) as { items?: WishlistItem[] };
				setItems(body.items ?? []);
				notifyWishlistChanged();
				return;
			}
			setItems(removeLocalWishlistItem(slug));
		},
		[isAuthenticated],
	);

	const toggle = useCallback(
		async (input: WishlistItemInput) => {
			// Optimistic instant feedback
			const prevItems = items;
			const local = toggleLocalWishlistItem(input);
			setItems(local.items);
			notifyWishlistChanged();

			if (isAuthenticated) {
				try {
					const res = await fetch("/api/wishlist", {
						method: "POST",
						credentials: "include",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ ...input, toggle: true }),
					});
					if (!res.ok) throw new Error("Unable to update wishlist");
					const body = (await res.json()) as {
						items?: WishlistItem[];
						added?: boolean;
					};
					if (body.items) setItems(body.items);
					notifyWishlistChanged();
					const added = body.added ?? false;
					if (added) toast("Added to wishlist");
					track("wishlist_toggled", {
						slug: input.slug,
						name: input.name,
						added,
						authenticated: true,
					});
					return added;
				} catch (err) {
					setItems(prevItems);
					notifyWishlistChanged();
					throw err;
				}
			}
			if (local.added) toast("Added to wishlist");
			track("wishlist_toggled", {
				slug: input.slug,
				name: input.name,
				added: local.added,
				authenticated: false,
			});
			return local.added;
		},
		[isAuthenticated, items],
	);

	const slugSet = useMemo(
		() => new Set(items.map((item) => item.slug)),
		[items],
	);

	const has = useCallback((slug: string) => slugSet.has(slug), [slugSet]);

	const itemCount = items.length;

	return {
		items,
		itemCount,
		loading: loading || sessionLoading,
		isAuthenticated,
		has,
		add,
		remove,
		toggle,
		refresh,
	};
}
