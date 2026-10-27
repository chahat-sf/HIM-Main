import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
	listCartItems,
	removeCartItem,
	setCartItemQty,
	upsertCartItem,
} from "@/lib/cart";
import type { CartItemInput } from "@/lib/cart-types";

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

		const body = (await request.json()) as CartItemInput;
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

		const body = (await request.json()) as {
			id?: string | number;
			qty?: number;
		};
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
