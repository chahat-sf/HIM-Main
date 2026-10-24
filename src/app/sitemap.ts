import type { MetadataRoute } from "next";
import { listProductSlugs } from "@/lib/catalog";

const BASE = "https://him.world";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	let slugs: string[] = [];
	try {
		slugs = await listProductSlugs();
	} catch {
		slugs = [];
	}

	const products = slugs.map((slug) => ({
		url: `${BASE}/collection/${slug}`,
		lastModified: new Date(),
		changeFrequency: "weekly" as const,
		priority: 0.7,
	}));

	return [
		{
			url: BASE,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 1,
		},
		{
			url: `${BASE}/house`,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.8,
		},
		{
			url: `${BASE}/collection`,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 0.9,
		},
		...products,
	];
}
