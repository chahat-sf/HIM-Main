"use client";

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from "react";
import type { WishlistItem, WishlistItemInput } from "@/lib/wishlist-types";
import {
	addLocalWishlistItem,
	readLocalWishlist,
	removeLocalWishlistItem,
	toggleLocalWishlistItem,
	WISHLIST_CHANGED_EVENT,
	WISHLIST_STORAGE_KEY,
} from "@/lib/wishlist-local";
import { useSession } from "@/hooks/useSession";
import { toast } from "@/components/Toast";
import { track } from "@/lib/analytics";

type WishlistContextValue = {
	items: WishlistItem[];
	itemCount: number;
	loading: boolean;
	isAuthenticated: boolean;
	has: (slug: string) => boolean;
	add: (input: WishlistItemInput) => Promise<void>;
	remove: (slug: string) => Promise<void>;
	toggle: (input: WishlistItemInput) => Promise<boolean>;
	refresh: () => Promise<void>;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

async function fetchServerWishlist(): Promise<WishlistItem[]> {
	const res = await fetch("/api/wishlist", { credentials: "include" });
	if (res.status === 401) return [];
	if (!res.ok) throw new Error("Unable to load wishlist");
	const body = (await res.json()) as { items?: WishlistItem[] };
	return body.items ?? [];
}

function optimisticToggle(
	items: WishlistItem[],
	input: WishlistItemInput,
): { items: WishlistItem[]; added: boolean } {
	const slug = input.slug.trim();
	const exists = items.some((item) => item.slug === slug);
	if (exists) {
		return {
			items: items.filter((item) => item.slug !== slug),
			added: false,
		};
	}
	const productId =
		input.productId != null && Number.isFinite(Number(input.productId))
			? Number(input.productId)
			: null;
	return {
		items: [
			{
				id: `opt-${slug}`,
				productId,
				slug,
				name: input.name.trim(),
				price: Number(input.price) || 0,
				image: input.image.trim(),
				swatches: input.swatches ?? [],
			},
			...items,
		],
		added: true,
	};
}

export function WishlistProvider({ children }: { children: ReactNode }) {
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
		const softRefresh = (event?: Event) => {
			if (sessionLoading) return;
			if (event?.type === "storage") {
				const storageEvent = event as StorageEvent;
				if (
					storageEvent.key != null &&
					storageEvent.key !== WISHLIST_STORAGE_KEY
				) {
					return;
				}
			}
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
				return;
			}
			setItems(removeLocalWishlistItem(slug));
		},
		[isAuthenticated],
	);

	const toggle = useCallback(
		async (input: WishlistItemInput) => {
			if (!isAuthenticated) {
				const local = toggleLocalWishlistItem(input);
				setItems(local.items);
				if (local.added) toast("Added to wishlist");
				track("wishlist_toggled", {
					slug: input.slug,
					name: input.name,
					added: local.added,
					authenticated: false,
				});
				return local.added;
			}

			const prevItems = items;
			const optimistic = optimisticToggle(items, input);
			setItems(optimistic.items);

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
				const added = body.added ?? optimistic.added;
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
				throw err;
			}
		},
		[isAuthenticated, items],
	);

	const slugSet = useMemo(
		() => new Set(items.map((item) => item.slug)),
		[items],
	);

	const has = useCallback((slug: string) => slugSet.has(slug), [slugSet]);

	const value = useMemo(
		() => ({
			items,
			itemCount: items.length,
			loading: loading || sessionLoading,
			isAuthenticated,
			has,
			add,
			remove,
			toggle,
			refresh,
		}),
		[
			items,
			loading,
			sessionLoading,
			isAuthenticated,
			has,
			add,
			remove,
			toggle,
			refresh,
		],
	);

	return (
		<WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
	);
}

export function useWishlistContext() {
	return useContext(WishlistContext);
}
