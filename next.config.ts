import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	images: {
		qualities: [75, 80, 90],
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
							"script-src 'self' 'unsafe-inline' 'unsafe-eval'",
							"style-src 'self' 'unsafe-inline'",
							"img-src 'self' data: blob:",
							"font-src 'self' data:",
							"media-src 'self' blob:",
							"connect-src 'self'",
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
