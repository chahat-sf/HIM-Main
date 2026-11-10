import type { CatalogProduct } from "@/lib/catalog-types";

export const PDP_360_FOLDERS = [
	"nocturne",
	"last-word",
	"composure",
	"archivist",
	"encore",
] as const;

export type Pdp360Folder = (typeof PDP_360_FOLDERS)[number];

export const PDP_360_FRAME_COUNT = 61;

const FOLDER_SET = new Set<string>(PDP_360_FOLDERS);

/** Matches house outfit names → product folder ids with extracted rings. */
const NAME_TO_FOLDER = new Map<string, Pdp360Folder>([
	["the nocturne", "nocturne"],
	["the last word", "last-word"],
	["the composure", "composure"],
	["the archivist", "archivist"],
	["the encore", "encore"],
]);

export type Pdp360Assets = {
	folder: Pdp360Folder;
	count: number;
	frameUrl: (index: number) => string;
};

function folderFromImagePath(image: string): string | null {
	const match = image.trim().match(/\/products\/([^/]+)\//i);
	return match?.[1] ?? null;
}

function asFolder(value: string | null | undefined): Pdp360Folder | null {
	if (!value) return null;
	return FOLDER_SET.has(value) ? (value as Pdp360Folder) : null;
}

export function pdp360FrameUrl(folder: string, index: number): string {
	const i =
		((index % PDP_360_FRAME_COUNT) + PDP_360_FRAME_COUNT) % PDP_360_FRAME_COUNT;
	return `/products/${folder}/frames/frame_${String(i + 1).padStart(4, "0")}.webp`;
}

/** Resolve a product's 360 frame ring, or null when assets are missing. */
export function resolvePdp360(product: CatalogProduct): Pdp360Assets | null {
	const fromImage = asFolder(folderFromImagePath(product.image));
	const fromName =
		NAME_TO_FOLDER.get(product.name.trim().toLowerCase()) ?? null;
	const folder = fromImage ?? fromName;
	if (!folder) return null;

	return {
		folder,
		count: PDP_360_FRAME_COUNT,
		frameUrl: (index: number) => pdp360FrameUrl(folder, index),
	};
}
