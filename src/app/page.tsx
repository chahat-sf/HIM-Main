import HomeGate from "@/components/HomeGate";
import HeroSection from "@/components/HeroSection";
import FlythroughLazy from "@/components/house/FlythroughLazy";
import ProductsSection from "@/components/ProductsSection";
import Lookbook from "@/components/Lookbook";
import Footer from "@/components/Footer";
import DeferredMount from "@/components/DeferredMount";
import { listProducts } from "@/lib/catalog";
import { buildPageMetadata, PAGE_SEO } from "@/lib/seo";

export const revalidate = 60;

export const metadata = buildPageMetadata(PAGE_SEO.home);

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
