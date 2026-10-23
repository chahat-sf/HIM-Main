import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  addWishlistItem,
  listWishlistItems,
  removeWishlistItem,
  toggleWishlistItem,
} from "@/lib/wishlist";
import type { WishlistItemInput } from "@/lib/wishlist-types";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const items = await listWishlistItems(user.id);
    return NextResponse.json({ items });
  } catch (error) {
    console.error("wishlist GET error", error);
    return NextResponse.json(
      { error: "Unable to load wishlist." },
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

    const body = (await request.json()) as WishlistItemInput & {
      toggle?: boolean;
    };

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

    const input: WishlistItemInput = {
      productId: body.productId ?? null,
      slug: body.slug ?? "",
      name: body.name,
      price: Number(body.price) || 0,
      image: body.image,
      swatches: body.swatches,
    };

    if (body.toggle) {
      const result = await toggleWishlistItem(user.id, input);
      return NextResponse.json(result);
    }

    const items = await addWishlistItem(user.id, input);
    return NextResponse.json({ items, added: true });
  } catch (error) {
    console.error("wishlist POST error", error);
    return NextResponse.json(
      { error: "Unable to update wishlist." },
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
    const slug = searchParams.get("slug")?.trim() ?? "";
    if (!slug) {
      return NextResponse.json({ error: "slug is required." }, { status: 400 });
    }

    const items = await removeWishlistItem(user.id, slug);
    return NextResponse.json({ items });
  } catch (error) {
    console.error("wishlist DELETE error", error);
    return NextResponse.json(
      { error: "Unable to remove wishlist item." },
      { status: 500 },
    );
  }
}
