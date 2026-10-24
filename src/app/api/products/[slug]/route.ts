import { NextResponse } from "next/server";
import { getProductBySlug } from "@/lib/catalog";

type RouteContext = {
  params: Promise<{ slug: string }> | { slug: string };
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const resolved = await Promise.resolve(context.params);
    const slug = typeof resolved?.slug === "string" ? resolved.slug : "";
    const product = await getProductBySlug(slug);
    if (!product) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ product });
  } catch (error) {
    console.error("product GET error", error);
    return NextResponse.json(
      { error: "Unable to load product." },
      { status: 500 },
    );
  }
}
