import type { MetadataRoute } from "next";

/** Site-wide crawl block — nothing should be indexed until launch. */
export default function robots(): MetadataRoute.Robots {
	return {
		rules: {
			userAgent: "*",
			disallow: "/",
		},
	};
}
