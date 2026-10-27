import HomeGate from "@/components/HomeGate";
import HeroSection from "@/components/HeroSection";
import FlythroughLazy from "@/components/house/FlythroughLazy";
import ProductsSection from "@/components/ProductsSection";
import Lookbook from "@/components/Lookbook";
import Footer from "@/components/Footer";
import DeferredMount from "@/components/DeferredMount";

export default function Home() {
  return (
    <HomeGate>
      <main>
        <HeroSection />
        <div data-music-trigger>
          <FlythroughLazy embedded />
        </div>
        <DeferredMount minHeight="80vh">
          <ProductsSection />
        </DeferredMount>
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
