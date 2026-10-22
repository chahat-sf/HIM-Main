export type Product = {
	slug: string;
	name: string;
	price: string;
	description: string;
	colors: { name: string; hex: string }[];
	sizes: string[];
	images: string[];
	details: string;
	sizeFit: string;
	shipping: string;
};

const DEFAULT: Omit<Product, "slug"> = {
	name: "Athletic Zip Hoodie",
	price: "45,000.00",
	description:
		"A refined take on the everyday essential. Cut from our signature brushed-cotton blend, this hoodie pairs relaxed structure with purposeful detailing — zip placket, tonal stitching, and a fit that works as hard as you do.",
	colors: [
		{ name: "Heather Grey", hex: "#a3a3a3" },
		{ name: "Burgundy", hex: "#7a1420" },
	],
	sizes: ["XS", "S", "M", "L", "XL", "XXL"],
	images: [
		"/products/pdp-hero.jpg",
		"/products/man-image-1.webp",
		"/products/man-image-2.webp",
	],
	details:
		"100% premium cotton. Brushed inner lining. Full-length zip with branded puller. Ribbed cuffs and hem. Machine washable at 30°C.",
	sizeFit:
		'True to size. Model is 6\'1" wearing size M. Relaxed through the chest and shoulders with a slightly tapered hem.',
	shipping:
		"Free standard shipping on orders above ₹3,000. Express delivery available at checkout. Hassle-free 30-day returns.",
};

/** Catalog keyed by URL slug. Unknown slugs fall back to DEFAULT. */
export const PRODUCTS: Record<string, Product> = {
	"athletic-zip-hoodie": { slug: "athletic-zip-hoodie", ...DEFAULT },
	"textured-crew-tshirt": {
		slug: "textured-crew-tshirt",
		...DEFAULT,
		name: "Textured Crew T-Shirt",
		price: "2,499.00",
		images: [
			"/bestseller/bs-image-1.webp",
			"/bestseller/bs-image-2.webp",
			"/bestseller/bs-image-3.webp",
		],
	},
	"textured-thermal-white": {
		slug: "textured-thermal-white",
		...DEFAULT,
		name: "Textured Thermal – White",
		price: "16,000.00",
		images: ["/products/item-4.webp", "/products/man-image-1.webp", "/products/man-image-2.webp"],
	},
	"textured-thermal-white-2": {
		slug: "textured-thermal-white-2",
		...DEFAULT,
		name: "Textured Thermal – White",
		price: "16,000.00",
		images: ["/products/item-4.webp"],
	},
	"textured-thermal-white-3": {
		slug: "textured-thermal-white-3",
		...DEFAULT,
		name: "Textured Thermal – White",
		price: "16,000.00",
		images: ["/products/item-4.webp"],
	},
	"textured-thermal-white-4": {
		slug: "textured-thermal-white-4",
		...DEFAULT,
		name: "Textured Thermal – White",
		price: "16,000.00",
		images: ["/products/item-4.webp"],
	},
	"textured-thermal-white-5": {
		slug: "textured-thermal-white-5",
		...DEFAULT,
		name: "Textured Thermal – White",
		price: "16,000.00",
		images: ["/products/item-4.webp"],
	},
	"textured-thermal-white-6": {
		slug: "textured-thermal-white-6",
		...DEFAULT,
		name: "Textured Thermal – White",
		price: "16,000.00",
		images: ["/products/item-4.webp"],
	},
};

export const PRODUCT_SLUGS = Object.keys(PRODUCTS);

export function getProduct(slug: string): Product {
	return PRODUCTS[slug] ?? { slug, ...DEFAULT, name: DEFAULT.name };
}
