import type { Metadata } from "next";
import HomeGate from "@/components/HomeGate";
import HeroSection from "@/components/HeroSection";
import FlythroughLazy from "@/components/house/FlythroughLazy";
import ProductsSection from "@/components/ProductsSection";
import Lookbook from "@/components/Lookbook";
import Footer from "@/components/Footer";
import DeferredMount from "@/components/DeferredMount";
import { listProducts } from "@/lib/catalog";

export const revalidate = 60;

export const metadata: Metadata = {
	title: "HIM — Luxury Menswear",
	description:
		"Discover HIM luxury menswear — refined essentials, seasonal collections, and studio craftsmanship.",
	openGraph: {
		title: "HIM — Luxury Menswear",
		description:
			"Discover HIM luxury menswear — refined essentials, seasonal collections, and studio craftsmanship.",
	},
	twitter: {
		title: "HIM — Luxury Menswear",
		description:
			"Discover HIM luxury menswear — refined essentials, seasonal collections, and studio craftsmanship.",
	},
};

export default async function Home() {
	const products = await listProducts();

	return (
		<HomeGate>
			<main>
				<HeroSection />
				<div data-music-trigger>
					<FlythroughLazy embedded />
				</div>
				{/* Bestsellers stay in the SSR tree for SEO — do not DeferredMount. */}
				<ProductsSection products={products} />
				<DeferredMount minHeight="60vh">
					<Lookbook />
				</DeferredMount>
				<DeferredMount minHeight="40vh">
					<Footer />
				</DeferredMount>
			</main>
		</HomeGate>
	);
}
