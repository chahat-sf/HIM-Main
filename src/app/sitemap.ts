import type { MetadataRoute } from "next";
import { listProductSlugs } from "@/lib/catalog";
import { CATEGORY_SEO } from "@/lib/seo";
import { getSiteUrl, isSeoIndexingEnabled } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	if (!isSeoIndexingEnabled()) return [];

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

	const categories = Object.values(CATEGORY_SEO).map((cat) => ({
		url: `${base}${cat.path}`,
		lastModified: new Date(),
		changeFrequency: "weekly" as const,
		priority: 0.8,
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
		...categories,
		{
			url: `${base}/contact`,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.5,
		},
		{
			url: `${base}/privacy-policy`,
			lastModified: new Date(),
			changeFrequency: "yearly",
			priority: 0.3,
		},
		{
			url: `${base}/terms`,
			lastModified: new Date(),
			changeFrequency: "yearly",
			priority: 0.3,
		},
		{
			url: `${base}/shipping-policy`,
			lastModified: new Date(),
			changeFrequency: "yearly",
			priority: 0.3,
		},
		{
			url: `${base}/returns-refund-policy`,
			lastModified: new Date(),
			changeFrequency: "yearly",
			priority: 0.3,
		},
		{
			url: `${base}/authenticity-care`,
			lastModified: new Date(),
			changeFrequency: "yearly",
			priority: 0.3,
		},
		{
			url: `${base}/grievance-contact`,
			lastModified: new Date(),
			changeFrequency: "yearly",
			priority: 0.3,
		},
		...products,
	];
}
