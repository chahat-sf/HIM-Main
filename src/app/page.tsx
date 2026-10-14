import HeroSection from "@/components/HeroSection";
import ScrollSection from "@/components/ScrollSection";
import ProductsSection from "@/components/ProductsSection";
import Lookbook from "@/components/Lookbook";
import Footer from "@/components/Footer";


export default function Home() {
  return (
    <main>
      <HeroSection />
      <ScrollSection />
      <ProductsSection/>
      <Lookbook/>
      <Footer/>
    </main>
  );
}
