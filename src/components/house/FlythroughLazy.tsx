"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

function HouseLoaderShell() {
	return (
		<section
			id="house"
			className="relative h-svh w-full overflow-hidden bg-[#1a120c]"
			aria-label="The House"
			aria-busy
		>
			<div
				role="status"
				aria-live="polite"
				aria-label="Loading"
				style={{
					position: "absolute",
					inset: 0,
					zIndex: 25,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					background:
						"radial-gradient(ellipse 70% 55% at 50% 45%, #1a120c 0%, #0a0604 55%, #050302 100%)",
				}}
			>
				{/* Native <img> so animated GIF frames play (next/image can flatten). */}
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img
					src="/brand/him-loader.gif"
					alt=""
					width={160}
					height={284}
					aria-hidden
					draggable={false}
					style={{
						width: "min(160px, 28vw)",
						height: "auto",
						objectFit: "contain",
					}}
				/>
			</div>
		</section>
	);
}

const Flythrough = dynamic(() => import("./Flythrough"), {
	ssr: false,
	loading: () => <HouseLoaderShell />,
});

/**
 * Mount the house after home enter so WebGL/video can warm while the user
 * is still on the hero — not deferred until the section is near the viewport.
 */
export default function FlythroughLazy({ embedded = false }: { embedded?: boolean }) {
	const [entered, setEntered] = useState(false);

	useEffect(() => {
		const onStart = () => setEntered(true);
		window.addEventListener("him-start", onStart);
		return () => window.removeEventListener("him-start", onStart);
	}, []);

	if (!entered) {
		return <HouseLoaderShell />;
	}

	return <Flythrough embedded={embedded} />;
}
