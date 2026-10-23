import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { mergeWishlistItems } from "@/lib/wishlist";
import type { WishlistItemInput } from "@/lib/wishlist-types";

type MergeBody = {
  items?: WishlistItemInput[];
};

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as MergeBody;
    const items = Array.isArray(body.items) ? body.items : [];
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
