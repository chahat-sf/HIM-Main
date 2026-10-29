import type { MetadataRoute } from "next";
import { listProductSlugs } from "@/lib/catalog";
import { getSiteUrl } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const base = getSiteUrl();
	let slugs: string[] = [];
	try {
		slugs = await listProductSlugs();
	} catch {
		slugs = [];
	}

	const products = slugs.map((slug) => ({
		url: `${base}/collection/${slug}`,
		lastModified: new Date(),
		changeFrequency: "weekly" as const,
		priority: 0.7,
	}));

	return [
		{
			url: base,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 1,
		},
		{
			url: `${base}/house`,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.8,
		},
		{
			url: `${base}/collection`,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 0.9,
		},
		{
			url: `${base}/contact`,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.5,
		},
		{
			url: `${base}/legals`,
			lastModified: new Date(),
			changeFrequency: "yearly",
			priority: 0.3,
		},
		{
			url: `${base}/privacy-policy`,
			lastModified: new Date(),
			changeFrequency: "yearly",
			priority: 0.3,
		},
		{
			url: `${base}/terms-of-sale`,
			lastModified: new Date(),
			changeFrequency: "yearly",
			priority: 0.3,
		},
		...products,
	];
}
