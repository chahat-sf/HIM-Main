import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { listProducts } from "@/lib/catalog";

const getCachedProducts = unstable_cache(
	async () => listProducts(),
	["catalog-products"],
	{ revalidate: 60 },
);

export async function GET() {
	try {
		const items = await getCachedProducts();
		return NextResponse.json(
			{ items },
			{
				headers: {
					"Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
				},
			},
		);
	} catch (error) {
		console.error("products GET error", error);
		return NextResponse.json(
			{ error: "Unable to load products." },
			{ status: 500 },
		);
	}
}
