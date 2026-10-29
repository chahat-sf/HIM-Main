/** Standard Indian men’s jacket body chart (inches) — reference guide. */
export type JacketSizeRow = {
	size: string;
	chest: string;
	shoulder: string;
	sleeve: string;
	length: string;
};

export const JACKET_SIZE_CHART: JacketSizeRow[] = [
	{ size: "XS", chest: "36", shoulder: "16.5", sleeve: "24", length: "27" },
	{ size: "S", chest: "38", shoulder: "17", sleeve: "24.5", length: "28" },
	{ size: "M", chest: "40", shoulder: "17.5", sleeve: "25", length: "28.5" },
	{ size: "L", chest: "42", shoulder: "18", sleeve: "25.5", length: "29" },
	{ size: "XL", chest: "44", shoulder: "18.5", sleeve: "26", length: "29.5" },
	{ size: "XXL", chest: "46", shoulder: "19", sleeve: "26.5", length: "30" },
];

export const SIZE_FIT_NOTE =
	"Don’t worry about picking the perfect size. Every HIM piece is personally tailored and stitched to you. After you order, our team will call to guide you through fit.";

export const SIZE_CHART_FOOTER =
	"Measurements are a starting guide. Final fit is confirmed on your post-order call.";
