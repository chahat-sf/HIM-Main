import type { Metadata } from "next";
import { getProductSeo } from "@/lib/product-seo";

/**
 * HIM World SEO copy. OG JPG assets under /og/ are preferred when present;
 * until then we fall back to existing public campaign/product stills.
 */

export const BRAND_NAME = "HIM World";
export const TITLE_JOIN = " | HIM World";

/** Working share images until SEO JPG pack lands in public/og/ */
export const SEO_IMAGES = {
	default: "/products/pdp-hero.webp",
	home: "/products/pdp-hero.webp",
	collection: "/products/man-image-100.webp",
	house: "/lookbook/man-on-car.webp",
	contact: "/products/man-image-103.webp",
	legal: "/products/man-image-102.webp",
} as const;

/** Preferred filenames from SEO asset request (add files under public/og/) */
export const SEO_OG_PREFERRED = {
	default: "/og/og-default.jpg",
	home: "/og/og-home.jpg",
	collection: "/og/og-collection.jpg",
	house: "/og/og-house.jpg",
	contact: "/og/og-contact.jpg",
} as const;

export const COLLECTION_INTRO =
	"Tailoring that speaks through presence, not performance. The HIM World collection brings together evening tuxedos, embellished velvet, double-breasted blazers and heritage overcoats, each cut with sharp structure and finished with understated detail.";

export const HOUSE_INTRO =
	"The House of HIM World is where our collection comes to life. Walk through the rooms, open the windows and discover complete looks, from midnight velvet to sharp evening tailoring. Every outfit is styled in our Gurgaon studio for the man who prefers presence over performance.";

export const HOME_SUBHEADING = "Luxury Menswear by HIM World";

/** Path segment → DB category value */
export const COLLECTION_CATEGORY_PATHS = {
	suits: "SUITS",
	jackets: "JACKETS",
	blazers: "BLAZERS",
	outerwear: "OUTERWEAR",
} as const;

export type CollectionCategoryPath = keyof typeof COLLECTION_CATEGORY_PATHS;

export function isCollectionCategoryPath(
	slug: string,
): slug is CollectionCategoryPath {
	return Object.prototype.hasOwnProperty.call(COLLECTION_CATEGORY_PATHS, slug);
}

export function categoryPathFromFilter(filter: string): string | null {
	const entry = Object.entries(COLLECTION_CATEGORY_PATHS).find(
		([, value]) => value === filter,
	);
	return entry ? entry[0] : null;
}

export function categoryHref(filter: string): string {
	if (filter === "ALL") return "/collection";
	const path = categoryPathFromFilter(filter);
	return path
		? `/collection/${path}`
		: `/collection?category=${encodeURIComponent(filter)}`;
}

type OgImageInput = {
	url: string;
	alt: string;
	width?: number;
	height?: number;
};

type PageSeoInput = {
	title: string;
	description: string;
	path: string;
	image: OgImageInput;
	absoluteTitle?: boolean;
	noIndex?: boolean;
	ogTitle?: string;
	ogDescription?: string;
	omitCanonical?: boolean;
};

export function buildPageMetadata({
	title,
	description,
	path,
	image,
	absoluteTitle = false,
	noIndex = true,
	ogTitle,
	ogDescription,
	omitCanonical = false,
}: PageSeoInput): Metadata {
	void noIndex; // reserved for launch flip; sitewide noindex forced for now
	const resolvedOgTitle =
		ogTitle ?? (absoluteTitle ? title : `${title}${TITLE_JOIN}`);
	const resolvedOgDescription = ogDescription ?? description;
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
		alternates: omitCanonical ? undefined : { canonical: path },
		robots: { index: false, follow: false },
		openGraph: {
			title: resolvedOgTitle,
			description: resolvedOgDescription,
			url: path,
			type: "website",
			siteName: BRAND_NAME,
			images,
		},
		twitter: {
			card: "summary_large_image",
			title: resolvedOgTitle,
			description: resolvedOgDescription,
			images: [image.url],
		},
	};
}

export const PAGE_SEO = {
	home: {
		title: "HIM World | Luxury Menswear, Suits, Jackets & Tailoring",
		description:
			"Discover HIM World luxury menswear: tailored suits, velvet jackets, blazers and overcoats, crafted in our Gurgaon studio for the man who stands out.",
		path: "/",
		image: {
			url: SEO_IMAGES.home,
			alt: "HIM World luxury menswear campaign",
		},
		absoluteTitle: true,
		ogTitle: "HIM World | Made for the Man Who Stands Out",
		ogDescription:
			"Luxury tailoring, velvet and eveningwear from our Gurgaon studio.",
	},
	collection: {
		title: "Luxury Suits, Jackets & Blazers",
		description:
			"Shop the HIM World collection: evening tuxedos, velvet jackets, double-breasted blazers, denim suits and wool overcoats. Luxury menswear, Gurgaon.",
		path: "/collection",
		image: {
			url: SEO_IMAGES.collection,
			alt: "HIM World collection product lineup",
		},
		ogTitle: "The HIM World Collection",
		ogDescription: "Tailoring with quiet authority.",
	},
	house: {
		title: "The House of HIM World | Step Inside",
		description:
			"Step inside the House of HIM World. Explore signature looks, from The Nocturne velvet jacket to evening tailoring, in an interactive space.",
		path: "/house",
		image: {
			url: SEO_IMAGES.house,
			alt: "Inside The House of HIM World",
		},
		absoluteTitle: true,
		ogTitle: "The House of HIM World",
		ogDescription: "Click the window. Find your look.",
	},
	contact: {
		title: "Contact HIM World | Customer Care & Gurgaon Studio",
		description:
			"Contact HIM World for order support, styling advice or returns. Visit our studio at Sector-43, Gurgaon, Mon-Sat 11am-7pm, or call +91 99111 67778.",
		path: "/contact",
		image: {
			url: SEO_IMAGES.contact,
			alt: "Contact HIM World customer care",
		},
		absoluteTitle: true,
		ogTitle: "Visit the HIM World Studio, Gurgaon",
		ogDescription: "Styling advice, order support and fittings.",
	},
	legals: {
		title: "Legal Information",
		description:
			"Legal information for HIM World luxury menswear, covering website use, intellectual property, product representation and liability.",
		path: "/legals",
		image: {
			url: SEO_IMAGES.legal,
			alt: "HIM World legal information",
		},
		noIndex: true,
	},
	privacy: {
		title: "Privacy Policy",
		description:
			"How HIM World collects, uses and protects your personal data when you shop or browse with us at our online store and Gurgaon studio.",
		path: "/privacy-policy",
		image: {
			url: SEO_IMAGES.legal,
			alt: "HIM World privacy policy",
		},
	},
	termsOfSale: {
		title: "Terms of Sale",
		description:
			"HIM World terms of sale covering orders, payment, delivery, 14-day exchanges and worldwide returns for all luxury menswear purchases.",
		path: "/terms-of-sale",
		image: {
			url: SEO_IMAGES.legal,
			alt: "HIM World terms of sale",
		},
	},
} as const;

export const CATEGORY_SEO: Record<
	CollectionCategoryPath,
	{
		title: string;
		description: string;
		path: string;
		image: OgImageInput;
		filter: string;
	}
> = {
	suits: {
		title: "Men's Luxury Suits & Tuxedos",
		description:
			"Shop luxury men's suits by HIM World, from black evening tuxedos to double-breasted denim suits. Sharp tailoring, made in our Gurgaon studio.",
		path: "/collection/suits",
		filter: "SUITS",
		image: {
			url: SEO_IMAGES.collection,
			alt: "HIM World men's luxury suits and tuxedos",
		},
	},
	jackets: {
		title: "Men's Velvet Jackets",
		description:
			"Discover HIM World velvet jackets for men: embellished and structured styles in rich black velvet. Evening elegance with quiet confidence.",
		path: "/collection/jackets",
		filter: "JACKETS",
		image: {
			url: SEO_IMAGES.collection,
			alt: "HIM World men's velvet jackets",
		},
	},
	blazers: {
		title: "Men's Double-Breasted Blazers",
		description:
			"Shop HIM World blazers for men: dark double-breasted tailoring with a structured, commanding silhouette. Luxury menswear from Gurgaon.",
		path: "/collection/blazers",
		filter: "BLAZERS",
		image: {
			url: SEO_IMAGES.collection,
			alt: "HIM World men's double-breasted blazers",
		},
	},
	outerwear: {
		title: "Men's Wool Overcoats",
		description:
			"Shop HIM World men's outerwear: heritage houndstooth wool overcoats with refined, structured tailoring. Timeless layering for every season.",
		path: "/collection/outerwear",
		filter: "OUTERWEAR",
		image: {
			url: SEO_IMAGES.collection,
			alt: "HIM World men's wool overcoats",
		},
	},
};

export function productShareMetadata(input: {
	name: string;
	slug: string;
	title?: string;
	description: string;
	image?: string | null;
}): Metadata {
	const seo = getProductSeo(input.slug);
	const absoluteTitle =
		seo?.metaTitle ??
		`${input.name}${input.title ? ` ${input.title}` : ""}${TITLE_JOIN}`;
	const description =
		seo?.metaDescription ??
		(input.description.slice(0, 160) || `${input.name} by HIM World.`);
	const imageUrl = input.image?.trim() || SEO_IMAGES.default;
	const path = `/collection/${input.slug}`;
	const alt = seo?.mainImageAlt ?? `${input.name} by HIM World`;

	return {
		title: { absolute: absoluteTitle },
		description,
		alternates: { canonical: path },
		robots: { index: false, follow: false },
		openGraph: {
			title: absoluteTitle,
			description,
			url: path,
			type: "website",
			siteName: BRAND_NAME,
			images: [
				{
					url: imageUrl,
					alt,
					width: 1200,
					height: 630,
				},
			],
		},
		twitter: {
			card: "summary_large_image",
			title: absoluteTitle,
			description,
			images: [imageUrl],
		},
	};
}
