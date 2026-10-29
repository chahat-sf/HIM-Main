import { buildPageMetadata, PAGE_SEO } from "@/lib/seo";

export const metadata = buildPageMetadata(PAGE_SEO.collection);

export default function CollectionLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return children;
}
