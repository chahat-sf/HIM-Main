/** House window outfit plates (idle auto-spin reels). Optional `mask` = luminance matte. */
export const OUTFITS = [
	{
		id: "nocturne",
		name: "THE NOCTURNE",
		slug: "textured-thermal-white-9",
		video: "/house/masked/outfit-1-color.mp4",
		mask: "/house/masked/outfit-1-mask.mp4",
		background: "/house/masked/room-bg.png",
	},
	{
		id: "last-word",
		name: "THE LAST WORD",
		slug: "textured-thermal-white-12",
		video: "/products/videos/last-word-reel.mp4",
		mask: null,
		background: null,
	},
	{
		id: "composure",
		name: "THE COMPOSURE",
		slug: "textured-thermal-white-11",
		video: "/products/videos/composure-reel.mp4",
		mask: null,
		background: null,
	},
	{
		id: "archivist",
		name: "THE ARCHIVIST",
		slug: "textured-thermal-white-10",
		video: "/products/videos/archivist-reel.mp4",
		mask: null,
		background: null,
	},
	{
		id: "encore",
		name: "THE ENCORE",
		slug: "the-encore",
		video: "/products/videos/encore-reel.mp4",
		mask: null,
		background: null,
	},
] as const;

export type Outfit = (typeof OUTFITS)[number];

export const OUTFIT_COUNT = OUTFITS.length;

export const OUTFIT_NAMES = OUTFITS.map((outfit) => outfit.name);
