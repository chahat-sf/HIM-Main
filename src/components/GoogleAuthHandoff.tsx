"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import { mergeLocalCartToServer, readLocalCart } from "@/lib/cart-local";
import {
	mergeLocalWishlistToServer,
	readLocalWishlist,
} from "@/lib/wishlist-local";

/** After Google returns, merge a guest cart and wishlist and record the auth event once. */
export default function GoogleAuthHandoff() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { user, loading } = useSession();
	const handled = useRef(false);

	useEffect(() => {
		if (loading || handled.current) return;
		if (searchParams.get("auth") !== "google") return;
		if (!user) return;
		handled.current = true;
		const created = searchParams.get("signup") === "1";

		void (async () => {
			if (readLocalCart().length > 0) {
				try {
					await mergeLocalCartToServer();
				} catch {
					/* guest cart merge is best-effort */
				}
			}
			if (readLocalWishlist().length > 0) {
				try {
					await mergeLocalWishlistToServer();
				} catch {
					/* guest wishlist merge is best-effort */
				}
			}
			const { track } = await import("@/lib/analytics");
			track(created ? "signed_up" : "logged_in", { method: "google" });

			const url = new URL(window.location.href);
			url.searchParams.delete("auth");
			url.searchParams.delete("signup");
			const next = `${url.pathname}${url.search}${url.hash}`;
			router.replace(next);
		})();
	}, [loading, router, searchParams, user]);

	return null;
}
