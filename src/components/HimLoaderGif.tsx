"use client";

import { useEffect } from "react";

export const HIM_LOADER_SRC = "/brand/him-loader.gif";

let preloaded = false;

function preloadOnce() {
	if (preloaded || typeof window === "undefined") return;
	preloaded = true;
	const img = new Image();
	img.src = HIM_LOADER_SRC;
}

type HimLoaderGifProps = {
	/** When false, unmount the img so the next show remounts and restarts the GIF. */
	active: boolean;
	className?: string;
	style?: React.CSSProperties;
};

/**
 * Branded HIM loader GIF. Remounts on each `active` edge so browsers restart
 * the animation (opacity-hidden imgs often freeze on the full "him" frame).
 */
export default function HimLoaderGif({ active, className = "", style }: HimLoaderGifProps) {
	useEffect(() => {
		preloadOnce();
	}, []);

	if (!active) return null;

	return (
		// Native <img> so animated GIF frames play (next/image can flatten).
		// eslint-disable-next-line @next/next/no-img-element
		<img
			src={HIM_LOADER_SRC}
			alt=""
			width={160}
			height={284}
			aria-hidden
			draggable={false}
			className={className}
			style={{
				width: "min(160px, 28vw)",
				height: "auto",
				objectFit: "contain",
				...style,
			}}
		/>
	);
}
