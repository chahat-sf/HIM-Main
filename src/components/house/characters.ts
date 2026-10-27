/** House window outfit plates (idle auto-spin reels). */
export const OUTFITS = [
	{
		id: "nocturne",
		name: "THE NOCTURNE",
		slug: "textured-thermal-white-9",
		video: "/products/videos/nocturne-reel.mp4",
	},
	{
		id: "last-word",
		name: "THE LAST WORD",
		slug: "textured-thermal-white-12",
		video: "/products/videos/last-word-reel.mp4",
	},
	{
		id: "composure",
		name: "THE COMPOSURE",
		slug: "textured-thermal-white-11",
		video: "/products/videos/composure-reel.mp4",
	},
	{
		id: "archivist",
		name: "THE ARCHIVIST",
		slug: "textured-thermal-white-10",
		video: "/products/videos/archivist-reel.mp4",
	},
	{
		id: "encore",
		name: "THE ENCORE",
		slug: "the-encore",
		video: "/products/videos/encore-reel.mp4",
	},
] as const;

export type Outfit = (typeof OUTFITS)[number];

export const OUTFIT_COUNT = OUTFITS.length;

export const OUTFIT_NAMES = OUTFITS.map((outfit) => outfit.name);
