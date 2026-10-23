import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { mergeCartItems } from "@/lib/cart";
import type { CartItemInput } from "@/lib/cart-types";

type MergeBody = {
  items?: CartItemInput[];
};

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as MergeBody;
    const items = Array.isArray(body.items) ? body.items : [];
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
