import type { MetadataRoute } from "next";
import { getSiteUrl, isSeoIndexingEnabled } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
	if (!isSeoIndexingEnabled()) {
		return {
			rules: {
				userAgent: "*",
				disallow: "/",
			},
		};
	}

	return {
		rules: {
			userAgent: "*",
			allow: "/",
			disallow: [
				"/account",
				"/cart",
				"/checkout",
				"/login",
				"/signup",
				"/wishlist",
				"/api",
			],
		},
		sitemap: `${getSiteUrl()}/sitemap.xml`,
	};
}
