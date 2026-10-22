import type { MetadataRoute } from "next";
import { PRODUCT_SLUGS } from "@/lib/products";

const BASE = "https://him.world";

export default function sitemap(): MetadataRoute.Sitemap {
	const products = PRODUCT_SLUGS.map((slug) => ({
		url: `${BASE}/collection/${slug}`,
		lastModified: new Date(),
		changeFrequency: "weekly" as const,
		priority: 0.7,
	}));

	return [
		{ url: BASE, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
		{ url: `${BASE}/house`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
		{ url: `${BASE}/collection`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
		...products,
	];
}
