import HomeGate from "@/components/HomeGate";
import HeroSection from "@/components/HeroSection";
import Flythrough from "@/components/house/Flythrough";
import ProductsSection from "@/components/ProductsSection";
import Lookbook from "@/components/Lookbook";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <HomeGate>
      <main>
        <HeroSection />
        <Flythrough embedded />
        <ProductsSection />
        <Lookbook />
        <Footer />
      </main>
    </HomeGate>
  );
}
