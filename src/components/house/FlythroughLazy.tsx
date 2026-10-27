"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const Flythrough = dynamic(() => import("./Flythrough"), {
	ssr: false,
	loading: () => (
		<section
			id="house"
			className="relative h-svh w-full overflow-hidden bg-[#1a120c]"
			aria-label="The House"
		/>
	),
});

/**
 * Defer WebGL until after home enter and when the house section is near the viewport.
 */
export default function FlythroughLazy({ embedded = false }: { embedded?: boolean }) {
	const mountRef = useRef<HTMLDivElement>(null);
	const [entered, setEntered] = useState(false);
	const [near, setNear] = useState(false);

	useEffect(() => {
		const onStart = () => setEntered(true);
		window.addEventListener("him-start", onStart);
		return () => window.removeEventListener("him-start", onStart);
	}, []);

	useEffect(() => {
		if (!entered) return;
		const el = mountRef.current;
		if (!el) return;
		const io = new IntersectionObserver(
			([entry]) => {
				if (entry?.isIntersecting) {
					setNear(true);
					io.disconnect();
				}
			},
			{ rootMargin: "200px 0px", threshold: 0.01 },
		);
		io.observe(el);
		return () => io.disconnect();
	}, [entered]);

	const mount = entered && near;

	return (
		<div ref={mountRef} className="relative min-h-svh w-full">
			{mount ? (
				<Flythrough embedded={embedded} />
			) : (
				<section
					id="house"
					className="relative h-svh w-full overflow-hidden bg-[#1a120c]"
					aria-label="The House"
				/>
			)}
		</div>
	);
}
