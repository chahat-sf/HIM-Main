"use client";

import dynamic from "next/dynamic";

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

export default function FlythroughLazy({ embedded = false }: { embedded?: boolean }) {
	return <Flythrough embedded={embedded} />;
}
