import type { ReactNode } from "react";
import { buildPageMetadata, PAGE_SEO } from "@/lib/seo";

export const metadata = buildPageMetadata(PAGE_SEO.house);

export default function HouseLayout({ children }: { children: ReactNode }) {
	return children;
}
