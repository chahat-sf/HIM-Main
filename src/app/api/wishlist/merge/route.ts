import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { mergeWishlistItems } from "@/lib/wishlist";
import type { WishlistItemInput } from "@/lib/wishlist-types";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import {
	MAX_MERGE_JSON_BYTES,
	parseJsonBody,
	tooManyRequests,
} from "@/lib/validation";

type MergeBody = {
	items?: WishlistItemInput[];
};

export async function POST(request: Request) {
	try {
		const user = await getSessionUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const ip = clientIp(request);
		if (
			!rateLimit(`wishlist-merge:${ip}`, { limit: 20, windowMs: 60_000 }) ||
			!rateLimit(`wishlist-merge:user:${user.id}`, {
				limit: 20,
				windowMs: 60_000,
			})
		) {
			return tooManyRequests();
		}

		const parsed = await parseJsonBody<MergeBody>(
			request,
			MAX_MERGE_JSON_BYTES,
		);
		if (!parsed.ok) return parsed.response;

		const items = Array.isArray(parsed.data.items) ? parsed.data.items : [];
		const merged = await mergeWishlistItems(user.id, items);
		return NextResponse.json({ items: merged });
	} catch (error) {
		console.error("wishlist merge error", error);
		return NextResponse.json(
			{ error: "Unable to merge wishlist." },
			{ status: 500 },
		);
	}
}
