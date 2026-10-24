import type { Metadata } from "next";
import LegalPageShell from "@/components/LegalPageShell";

export const metadata: Metadata = {
  title: "Terms of Sale | HIM",
  description: "Terms of sale for purchases from HIM.",
};

export default function TermsOfSalePage() {
  return (
    <LegalPageShell
      title="Terms of Sale"
      showDisclaimer={false}
      sections={[
        {
          heading: "1. Introduction",
          body: [
            "These Terms of Sale govern the purchase of products from HIM through our website and other authorised sales channels. By placing an order, you agree to the terms outlined below.",
            "HIM reserves the right to update these terms from time to time. Any changes will apply to orders placed after the revised terms are published.",
          ],
        },
        {
          heading: "2. Products and Availability",
          body: [
            "We strive to ensure that all product descriptions, images, colours, sizes, and other details displayed on our website are accurate. However, slight variations may occur due to lighting, screen settings, materials, or the nature of the manufacturing process.",
            "All products are subject to availability. HIM reserves the right to discontinue products, limit quantities, or correct errors in product information where necessary.",
          ],
        },
        {
          heading: "3. Pricing and Payment",
          body: [
            "All prices are displayed in the currency specified on our website and are subject to applicable taxes, duties, and delivery charges, as indicated at checkout.",
            "HIM reserves the right to revise prices at any time. Price changes will not affect orders that have already been confirmed, except where a correction is necessary due to an evident pricing error.",
            "Payments must be completed using the payment methods available at checkout. Orders may be subject to verification before confirmation or dispatch.",
          ],
        },
        {
          heading: "4. Order Placement and Confirmation",
          body: [
            "Placing an order constitutes an offer to purchase the selected products under these Terms of Sale.",
            "An order confirmation email acknowledges receipt of your order but does not necessarily constitute final acceptance. HIM reserves the right to decline or cancel an order in cases involving product unavailability, pricing errors, suspected fraudulent activity, or other legitimate reasons.",
            "If payment has been received for an order that is subsequently cancelled, the applicable refund will be processed in accordance with our refund policy.",
          ],
        },
        {
          heading: "5. Shipping and Delivery",
          body: [
            "HIM aims to process and dispatch orders within the estimated timelines communicated at checkout or in the order confirmation.",
            "Delivery timelines are estimates and may vary due to location, courier operations, customs procedures, public holidays, or circumstances beyond our reasonable control.",
            "Customers are responsible for providing accurate delivery information. Any additional costs arising from incorrect addresses or failed delivery attempts may be charged where permitted by applicable law.",
            "Risk and responsibility for products during delivery will be governed by applicable law and the delivery arrangements specified by HIM.",
          ],
        },
        {
          heading: "6. Returns, Exchanges, and Refunds",
          body: [
            "We want every purchase to meet your expectations. Eligible products may be returned or exchanged in accordance with our published Return and Refund Policy.",
            "To qualify for a return or exchange, products should generally be unused, unworn, unwashed, and returned with their original tags, packaging, and proof of purchase.",
            "Certain products may be excluded from returns or exchanges where clearly disclosed and permitted by applicable law.",
            "Refunds for approved returns will be processed through the original payment method, where possible, within the timelines specified in our Return and Refund Policy.",
            "Nothing in this section limits any consumer rights that cannot legally be excluded.",
          ],
        },
        {
          heading: "7. Product Care and Authenticity",
          body: [
            "At HIM, we place importance on quality, design, and craftsmanship. Customers are encouraged to follow the care instructions provided with each product to maintain its appearance and longevity.",
            "All products sold through HIM's official sales channels are represented as genuine HIM merchandise. Customers are encouraged to purchase through authorised channels to ensure product authenticity.",
          ],
        },
        {
          heading: "8. Promotional Offers and Gift Cards",
          body: [
            "Promotional offers, discounts, gift cards, and other benefits may be subject to additional terms and conditions.",
            "Unless expressly stated otherwise, promotional offers cannot be combined with other offers, exchanged for cash, or applied retrospectively to completed purchases.",
            "HIM reserves the right to withdraw or modify promotional offers in accordance with applicable law and the terms communicated for each offer.",
          ],
        },
        {
          heading: "9. Intellectual Property",
          body: [
            "All content displayed on HIM's website, including brand names, logos, product images, designs, text, graphics, and other materials, is owned by or licensed to HIM and is protected by applicable intellectual property laws.",
            "No content may be reproduced, distributed, modified, or commercially used without prior written permission from the relevant rights holder.",
          ],
        },
        {
          heading: "10. Limitation of Liability",
          body: [
            "To the extent permitted by applicable law, HIM shall not be liable for indirect or consequential losses arising from the use of our website or the purchase of our products.",
            "Nothing in these Terms of Sale excludes or limits liability where such exclusion or limitation is prohibited by law, including applicable consumer protection rights.",
          ],
        },
        {
          heading: "11. Privacy and Personal Information",
          body: [
            "Personal information collected during the purchasing process will be handled in accordance with HIM's Privacy Policy and applicable data protection laws.",
            "We use relevant customer information to process orders, facilitate deliveries, provide customer support, and meet applicable legal obligations.",
          ],
        },
        {
          heading: "12. Governing Law and Dispute Resolution",
          body: [
            "These Terms of Sale shall be governed by the laws applicable in the relevant jurisdiction, subject to any mandatory consumer protection laws that apply to the customer.",
            "Any disputes arising from a purchase will be addressed in accordance with applicable law and the dispute resolution procedures available in the relevant jurisdiction.",
          ],
        },
        {
          heading: "13. Contact Information",
          body: [
            "For questions regarding these Terms of Sale, orders, or purchases, please contact us through the official contact details provided on HIM's website.",
            "By completing a purchase, you acknowledge that you have read and understood these Terms of Sale.",
          ],
        },
      ]}
    />
  );
}
