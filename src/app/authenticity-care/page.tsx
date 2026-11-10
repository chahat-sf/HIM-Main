import LegalPageShell from "@/components/LegalPageShell";
import { buildPageMetadata, PAGE_SEO } from "@/lib/seo";

export const metadata = buildPageMetadata(PAGE_SEO.authenticityCare);

export default function AuthenticityCarePage() {
  return (
    <LegalPageShell
      title="Authenticity, Product & Care Disclaimer"
      lead="Last updated: 10 November 2026"
      showDisclaimer={false}
      sections={[
        {
          heading: "1. Authenticity guarantee",
          body: "Every product sold on the HIM World website is 100% authentic and original, designed by HIM World and made by our own atelier or authorised production partners. Each piece ships with a HIM World authenticity card. We do not sell through unauthorised resellers, and products bought elsewhere are not covered by this guarantee. If you suspect a counterfeit using our brand, write to support@thehim.in.",
        },
        {
          heading: "2. Colour and fabric variance",
          body: "Our products are photographed under studio lighting, and screen settings vary between devices. The actual colour, shade, sheen and texture of a garment may differ slightly from what you see on screen. Such minor differences are not defects.",
        },
        {
          heading: "3. Handcrafted and artisan details",
          body: "HIM World pieces are cut, stitched and finished by hand. Slight irregularities in hand-stitching, embroidery, weaves, denim washes and distressing, and the natural grain, marks and creases of leather and suede, are hallmarks of genuine craftsmanship. They make each piece unique and are not defects.",
        },
        {
          heading: "4. Sizing",
          body: "Please consult the size guide on each product page. Fits vary by style. Email support@thehim.in before ordering if you need help choosing a size or taking measurements.",
        },
        {
          heading: "5. Care instructions",
          body: "Follow the care label on each garment. In general:",
          items: [
            "Dry clean tailoring, wool, silk and structured pieces.",
            "Wash denim inside out in cold water, sparingly, and line dry.",
            "Keep leather and suede away from water, heat and direct sunlight, and condition leather periodically.",
            "Store garments on padded hangers or folded in the dust bag provided.",
          ],
          after:
            "Damage from improper washing, ironing, care or normal wear is not covered by our returns policy.",
        },
      ]}
    />
  );
}
