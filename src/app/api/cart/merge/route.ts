import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { mergeCartItems } from "@/lib/cart";
import type { CartItemInput } from "@/lib/cart-types";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import {
	MAX_MERGE_JSON_BYTES,
	parseJsonBody,
	tooManyRequests,
} from "@/lib/validation";

type MergeBody = {
	items?: CartItemInput[];
};

export async function POST(request: Request) {
	try {
		const user = await getSessionUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const ip = clientIp(request);
		if (
			!rateLimit(`cart-merge:${ip}`, { limit: 20, windowMs: 60_000 }) ||
			!rateLimit(`cart-merge:user:${user.id}`, { limit: 20, windowMs: 60_000 })
		) {
			return tooManyRequests();
		}

		const parsed = await parseJsonBody<MergeBody>(
			request,
			MAX_MERGE_JSON_BYTES,
		);
		if (!parsed.ok) return parsed.response;

		const items = Array.isArray(parsed.data.items) ? parsed.data.items : [];
		const merged = await mergeCartItems(user.id, items);
		return NextResponse.json({ items: merged });
	} catch (error) {
		console.error("cart merge error", error);
		return NextResponse.json(
			{ error: "Unable to merge cart." },
			{ status: 500 },
		);
	}
}
