import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Collection — HIM",
	description: "Shop the HIM collection — luxury menswear essentials.",
	openGraph: {
		title: "Collection — HIM",
		description: "Shop the HIM collection — luxury menswear essentials.",
	},
};

export default function CollectionLayout({ children }: { children: React.ReactNode }) {
	return children;
}
