import type { NextConfig } from "next";

/** Keep in sync with src/lib/product-seo.ts PRODUCT_SLUG_REDIRECTS */
const PRODUCT_SLUG_REDIRECTS: Record<string, string> = {
	"textured-thermal-white-9": "the-nocturne-black-velvet-jacket",
	"textured-thermal-white-12": "the-last-word-black-evening-tuxedo",
	"textured-thermal-white-11": "the-composure-black-cotton-velvet-jacket",
	"textured-thermal-white-10": "the-archivist-houndstooth-wool-overcoat",
	"textured-thermal-white-8": "the-exception-double-breasted-denim-suit",
	"textured-thermal-white-7": "the-attache-double-breasted-blazer",
};

const nextConfig: NextConfig = {
	images: {
		qualities: [75, 80, 85, 90, 95],
	},
	async redirects() {
		const productRedirects = Object.entries(PRODUCT_SLUG_REDIRECTS).map(
			([from, to]) => ({
				source: `/collection/${from}`,
				destination: `/collection/${to}`,
				permanent: true,
			}),
		);
		return [
			...productRedirects,
			{
				source: "/collection",
				has: [{ type: "query", key: "category", value: "SUITS" }],
				destination: "/collection/suits",
				permanent: true,
			},
			{
				source: "/collection",
				has: [{ type: "query", key: "category", value: "JACKETS" }],
				destination: "/collection/jackets",
				permanent: true,
			},
			{
				source: "/collection",
				has: [{ type: "query", key: "category", value: "BLAZERS" }],
				destination: "/collection/blazers",
				permanent: true,
			},
			{
				source: "/collection",
				has: [{ type: "query", key: "category", value: "OUTERWEAR" }],
				destination: "/collection/outerwear",
				permanent: true,
			},
		];
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
