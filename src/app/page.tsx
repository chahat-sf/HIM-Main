import HomeGate from "@/components/HomeGate";
import HeroSection from "@/components/HeroSection";
import FlythroughLazy from "@/components/house/FlythroughLazy";
import ProductsSection from "@/components/ProductsSection";
import Lookbook from "@/components/Lookbook";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <HomeGate>
      <main>
        <HeroSection />
        <FlythroughLazy embedded />
        <ProductsSection />
        <Lookbook />
        <Footer />
      </main>
    </HomeGate>
  );
}
