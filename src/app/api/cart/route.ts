import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
	listCartItems,
	removeCartItem,
	setCartItemQty,
	upsertCartItem,
} from "@/lib/cart";
import type { CartItemInput } from "@/lib/cart-types";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import {
	FIELD_LIMITS,
	parseJsonBody,
	tooManyRequests,
} from "@/lib/validation";

function allowCartMutation(ip: string, userId: number): boolean {
	return (
		rateLimit(`cart:${ip}`, { limit: 60, windowMs: 60_000 }) &&
		rateLimit(`cart:user:${userId}`, { limit: 60, windowMs: 60_000 })
	);
}

export async function GET() {
	try {
		const user = await getSessionUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		const items = await listCartItems(user.id);
		return NextResponse.json({ items });
	} catch (error) {
		console.error("cart GET error", error);
		return NextResponse.json(
			{ error: "Unable to load cart." },
			{ status: 500 },
		);
	}
}

export async function POST(request: Request) {
	try {
		const user = await getSessionUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const ip = clientIp(request);
		if (!allowCartMutation(ip, user.id)) {
			return tooManyRequests();
		}

		const parsed = await parseJsonBody<CartItemInput>(request);
		if (!parsed.ok) return parsed.response;
		const body = parsed.data;

		if (!body.slug?.trim() && body.productId == null) {
			return NextResponse.json(
				{ error: "productId or slug is required." },
				{ status: 400 },
			);
		}
		if (!body.name?.trim() || !body.image?.trim()) {
			return NextResponse.json(
				{ error: "name and image are required." },
				{ status: 400 },
			);
		}
		if (
			(body.slug && body.slug.length > FIELD_LIMITS.productSlug) ||
			body.name.length > FIELD_LIMITS.productName ||
			body.image.length > FIELD_LIMITS.productImage ||
			(body.size != null && String(body.size).length > FIELD_LIMITS.size) ||
			(body.color != null && String(body.color).length > FIELD_LIMITS.color)
		) {
			return NextResponse.json(
				{ error: "Cart item fields are too long." },
				{ status: 400 },
			);
		}

		const items = await upsertCartItem(user.id, {
			productId: body.productId ?? null,
			slug: body.slug ?? "",
			name: body.name,
			size: body.size ?? "",
			color: body.color ?? "",
			price: Number(body.price) || 0,
			qty: body.qty ?? 1,
			image: body.image,
			swatches: body.swatches,
		});

		return NextResponse.json({ items });
	} catch (error) {
		console.error("cart POST error", error);
		const message = error instanceof Error ? error.message : "";
		if (message === "Unknown product") {
			return NextResponse.json({ error: "Unknown product." }, { status: 400 });
		}
		return NextResponse.json(
			{ error: "Unable to add to cart." },
			{ status: 500 },
		);
	}
}

export async function PATCH(request: Request) {
	try {
		const user = await getSessionUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const ip = clientIp(request);
		if (!allowCartMutation(ip, user.id)) {
			return tooManyRequests();
		}

		const parsed = await parseJsonBody<{
			id?: string | number;
			qty?: number;
		}>(request);
		if (!parsed.ok) return parsed.response;
		const body = parsed.data;

		const itemId = Number(body.id);
		const qty = Number(body.qty);
		if (!Number.isFinite(itemId) || itemId <= 0) {
			return NextResponse.json(
				{ error: "Valid id is required." },
				{ status: 400 },
			);
		}
		if (!Number.isFinite(qty) || qty < 1) {
			return NextResponse.json(
				{ error: "qty must be at least 1." },
				{ status: 400 },
			);
		}
		if (qty > FIELD_LIMITS.cartQty) {
			return NextResponse.json(
				{ error: `qty must be at most ${FIELD_LIMITS.cartQty}.` },
				{ status: 400 },
			);
		}

		const items = await setCartItemQty(user.id, itemId, qty);
		return NextResponse.json({ items });
	} catch (error) {
		console.error("cart PATCH error", error);
		return NextResponse.json(
			{ error: "Unable to update cart." },
			{ status: 500 },
		);
	}
}

export async function DELETE(request: Request) {
	try {
		const user = await getSessionUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const ip = clientIp(request);
		if (!allowCartMutation(ip, user.id)) {
			return tooManyRequests();
		}

		const { searchParams } = new URL(request.url);
		const itemId = Number(searchParams.get("id"));
		if (!Number.isFinite(itemId) || itemId <= 0) {
			return NextResponse.json(
				{ error: "Valid id is required." },
				{ status: 400 },
			);
		}

		const items = await removeCartItem(user.id, itemId);
		return NextResponse.json({ items });
	} catch (error) {
		console.error("cart DELETE error", error);
		return NextResponse.json(
			{ error: "Unable to remove cart item." },
			{ status: 500 },
		);
	}
}
