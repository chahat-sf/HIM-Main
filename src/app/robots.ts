import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

/** Site-wide crawl block — nothing should be indexed while this is active. */
export default function robots(): MetadataRoute.Robots {
	const base = getSiteUrl();
	return {
		rules: {
			userAgent: "*",
			disallow: "/",
		},
		sitemap: `${base}/sitemap.xml`,
	};
}
