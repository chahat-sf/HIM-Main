import { NextResponse } from "next/server";
import { listProducts } from "@/lib/catalog";

export async function GET() {
  try {
    const items = await listProducts();
    return NextResponse.json({ items });
  } catch (error) {
    console.error("products GET error", error);
    return NextResponse.json(
      { error: "Unable to load products." },
      { status: 500 },
    );
  }
}
