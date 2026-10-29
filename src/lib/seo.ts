import type { Metadata } from "next";

/**
 * Dummy-but-precise SEO copy + existing public assets for share previews.
 * Replace copy with SEO-team finals when available; keep image paths or swap files in place.
 */

export const SEO_IMAGES = {
	/** Default site share — strong product hero already in public/ */
	default: "/products/pdp-hero.webp",
	home: "/products/pdp-hero.webp",
	collection: "/products/man-image-100.webp",
	house: "/lookbook/man-on-car.webp",
	contact: "/products/man-image-103.webp",
	legal: "/products/man-image-102.webp",
} as const;

type OgImageInput = {
	url: string;
	alt: string;
	width?: number;
	height?: number;
};

export function buildPageMetadata({
	title,
	description,
	path,
	image,
	absoluteTitle = false,
	noIndex = false,
}: {
	title: string;
	description: string;
	path: string;
	image: OgImageInput;
	absoluteTitle?: boolean;
	noIndex?: boolean;
}): Metadata {
	const ogTitle = absoluteTitle ? title : `${title} — HIM`;
	const images = [
		{
			url: image.url,
			width: image.width ?? 1200,
			height: image.height ?? 630,
			alt: image.alt,
		},
	];

	return {
		title: absoluteTitle ? { absolute: title } : title,
		description,
		alternates: {
			canonical: path,
		},
		robots: noIndex ? { index: false, follow: false } : undefined,
		openGraph: {
			title: ogTitle,
			description,
			url: path,
			type: "website",
			siteName: "HIM",
			images,
		},
		twitter: {
			card: "summary_large_image",
			title: ogTitle,
			description,
			images: [image.url],
		},
	};
}

export const PAGE_SEO = {
	home: {
		title: "HIM — Luxury Menswear",
		description:
			"Discover HIM luxury menswear: refined essentials, seasonal collections, and studio craftsmanship from Gurgaon.",
		path: "/",
		image: {
			url: SEO_IMAGES.home,
			alt: "HIM luxury menswear campaign",
		},
		absoluteTitle: true,
	},
	collection: {
		title: "Collection",
		description:
			"Shop the HIM collection — tailored shirts, elevated essentials, and limited seasonal drops for modern menswear.",
		path: "/collection",
		image: {
			url: SEO_IMAGES.collection,
			alt: "HIM collection product lineup",
		},
	},
	house: {
		title: "The House",
		description:
			"Step into The House by HIM — an immersive look through the windows into rooms of form, fabric, and atmosphere.",
		path: "/house",
		image: {
			url: SEO_IMAGES.house,
			alt: "Inside The House by HIM",
		},
	},
	contact: {
		title: "Contact",
		description:
			"Contact HIM for styling advice, order support, returns, press, or a studio visit at Sector-43, Gurgaon.",
		path: "/contact",
		image: {
			url: SEO_IMAGES.contact,
			alt: "Contact HIM customer care",
		},
	},
	legals: {
		title: "Legal",
		description:
			"Legal information for HIM — website terms, intellectual property, and policies governing use of him.world.",
		path: "/legals",
		image: {
			url: SEO_IMAGES.legal,
			alt: "HIM legal information",
		},
	},
	privacy: {
		title: "Privacy Policy",
		description:
			"How HIM collects, uses, stores, and protects personal data when you browse, shop, or contact the studio.",
		path: "/privacy-policy",
		image: {
			url: SEO_IMAGES.legal,
			alt: "HIM privacy policy",
		},
	},
	termsOfSale: {
		title: "Terms of Sale",
		description:
			"Terms of sale for HIM purchases — orders, pricing, shipping, returns, and refunds through official channels.",
		path: "/terms-of-sale",
		image: {
			url: SEO_IMAGES.legal,
			alt: "HIM terms of sale",
		},
	},
} as const;

export function productShareMetadata(input: {
	name: string;
	slug: string;
	description: string;
	image?: string | null;
}): Metadata {
	const description =
		input.description.slice(0, 160) ||
		`${input.name} by HIM — luxury menswear.`;
	const imageUrl = input.image?.trim() || SEO_IMAGES.default;
	const path = `/collection/${input.slug}`;
	const title = input.name;

	return {
		title,
		description,
		alternates: { canonical: path },
		openGraph: {
			title: `${title} — HIM`,
			description,
			url: path,
			type: "website",
			siteName: "HIM",
			images: [
				{
					url: imageUrl,
					alt: title,
				},
			],
		},
		twitter: {
			card: "summary_large_image",
			title: `${title} — HIM`,
			description,
			images: [imageUrl],
		},
	};
}
