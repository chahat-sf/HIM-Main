import Image from "next/image";
import type { CSSProperties } from "react";
import { toHighImage } from "@/lib/product-image";

type PageHeroImageProps = {
	src: string;
	alt?: string;
	className?: string;
	style?: CSSProperties;
	sizes?: string;
	priority?: boolean;
	quality?: number;
};

/**
 * Full-bleed page banner image. Always upgrades to the high-tier master so
 * accidental /products/low/ paths cannot ship as soft stretched heroes.
 */
export default function PageHeroImage({
	src,
	alt = "",
	className = "object-cover",
	style,
	sizes = "100vw",
	priority = true,
	quality = 80,
}: PageHeroImageProps) {
	return (
		<Image
			src={toHighImage(src)}
			alt={alt}
			fill
			priority={priority}
			quality={quality}
			sizes={sizes}
			className={className}
			style={style}
		/>
	);
}
