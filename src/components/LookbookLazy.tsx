"use client";

import dynamic from "next/dynamic";

const Lookbook = dynamic(() => import("./Lookbook"), { ssr: false });

/** Code-split Lookbook; pair with DeferredMount so the chunk loads only when near-viewport. */
export default function LookbookLazy() {
	return <Lookbook />;
}
