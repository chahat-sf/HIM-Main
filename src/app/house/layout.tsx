import type { ReactNode } from "react";
import { buildPageMetadata, HOUSE_INTRO, PAGE_SEO } from "@/lib/seo";

export const metadata = buildPageMetadata(PAGE_SEO.house);

export default function HouseLayout({ children }: { children: ReactNode }) {
	return (
		<>
			<p
				style={{
					position: "absolute",
					width: 1,
					height: 1,
					padding: 0,
					margin: -1,
					overflow: "hidden",
					clip: "rect(0, 0, 0, 0)",
					whiteSpace: "nowrap",
					border: 0,
				}}
			>
				{HOUSE_INTRO}
			</p>
			{children}
		</>
	);
}
