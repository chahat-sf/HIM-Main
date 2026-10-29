import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	images: {
		qualities: [75, 80, 85, 90, 95],
	},
	async headers() {
		return [
			{
				source: "/:path*",
				headers: [
					{ key: "X-Content-Type-Options", value: "nosniff" },
					{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
					{ key: "X-Frame-Options", value: "SAMEORIGIN" },
					{
						key: "Content-Security-Policy",
						value: [
							"default-src 'self'",
							// PostHog loads config.js + captures from *.i.posthog.com (Cloud US/EU)
							"script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.i.posthog.com https://*.posthog.com",
							"style-src 'self' 'unsafe-inline'",
							"img-src 'self' data: blob: https://*.i.posthog.com https://*.posthog.com",
							"font-src 'self' data:",
							"media-src 'self' blob:",
							"connect-src 'self' https://*.i.posthog.com https://*.posthog.com",
							"worker-src 'self' blob:",
							"frame-ancestors 'self'",
						].join("; "),
					},
				],
			},
		];
	},
};

export default nextConfig;
