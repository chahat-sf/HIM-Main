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
							// PostHog + Razorpay Checkout.js
							"script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.i.posthog.com https://*.posthog.com https://checkout.razorpay.com https://*.razorpay.com",
							"style-src 'self' 'unsafe-inline'",
							"img-src 'self' data: blob: https://*.i.posthog.com https://*.posthog.com https://*.razorpay.com",
							"font-src 'self' data:",
							"media-src 'self' blob:",
							"connect-src 'self' https://*.i.posthog.com https://*.posthog.com https://api.razorpay.com https://lumberjack.razorpay.com https://*.razorpay.com",
							"frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://*.razorpay.com",
							"child-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://*.razorpay.com",
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
