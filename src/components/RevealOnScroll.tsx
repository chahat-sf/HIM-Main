"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type RevealOnScrollProps = {
	children: ReactNode;
	className?: string;
};

function prefersReducedMotion() {
	return (
		typeof window !== "undefined" &&
		window.matchMedia("(prefers-reduced-motion: reduce)").matches
	);
}

/** Fade/slide a block in once when it enters the viewport. */
export default function RevealOnScroll({
	children,
	className,
}: RevealOnScrollProps) {
	const ref = useRef<HTMLDivElement>(null);

	useGSAP(
		() => {
			const el = ref.current;
			if (!el || prefersReducedMotion()) return;

			gsap.from(el, {
				autoAlpha: 0,
				y: 40,
				duration: 0.8,
				ease: "power2.out",
				scrollTrigger: {
					trigger: el,
					// Fire once the section is well into view, not just peeking at the bottom.
					start: "top 70%",
					once: true,
				},
			});
		},
		{ scope: ref },
	);

	return (
		<div ref={ref} className={className} style={{ width: "100%" }}>
			{children}
		</div>
	);
}
