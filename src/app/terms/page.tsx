import LegalPageShell from "@/components/LegalPageShell";
import { buildPageMetadata, PAGE_SEO } from "@/lib/seo";

export const metadata = buildPageMetadata(PAGE_SEO.terms);

export default function TermsPage() {
  return (
    <LegalPageShell
      title="Terms & Conditions"
      lead="Last updated: 10 November 2026"
      showDisclaimer={false}
      sections={[
        {
          heading: "1. Agreement",
          body: 'These Terms form a binding electronic contract under the Information Technology Act, 2000 between you and HIM.CLOTHING LLP, GSTIN 06AATFH7402G1ZA, registered at F-17, First Floor, Royal Residency, Sushant Lok Phase 2, Gurugram, Haryana 122003 ("HIM World", "we", "us"). By browsing the Site, creating an account or placing an order, you accept these Terms, our Privacy Policy and all policies published on the Site.',
        },
        {
          heading: "2. Account eligibility",
          items: [
            "You must be at least 18 years old, or shop with the consent and supervision of a parent or legal guardian.",
            "You must give accurate, current information and keep your login details confidential. You are responsible for all activity on your account.",
            "We may suspend or close accounts involved in fraud, abuse or breach of these Terms.",
          ],
        },
        {
          heading: "3. Products",
          body: "Product images, descriptions and measurements are as accurate as we can make them. HIM World pieces are made to order; lead times are stated on each product page. Minor variations in colour, fabric and handcrafted details are described in our Authenticity, Product & Care Disclaimer.",
        },
        {
          heading: "4. Order acceptance",
          items: [
            "Submitting an order is an offer to buy, not a confirmed sale.",
            "A contract is formed only when we send an order confirmation email or dispatch the item.",
            "We reserve the right to refuse or cancel any order, before or after confirmation, in case of stock or availability errors; pricing, typographical or technical glitches; suspected fraud, unauthorised payment or suspicious activity; orders placed for resale; or inability to deliver to your address.",
            "If we cancel a paid order, we refund the full amount to your original payment method.",
          ],
        },
        {
          heading: "5. Pricing and payment",
          items: [
            "Prices are shown in Indian Rupees (INR) and include GST for Indian orders. Prices in other currencies, where shown, are indicative.",
            "International prices exclude customs duties and import taxes of the destination country (see Shipping Policy).",
            "We may change prices without notice. The price confirmed at checkout applies to your order.",
            "Payments are processed securely by third-party payment gateways. We may run additional verification on high-value orders.",
          ],
        },
        {
          heading: "6. Brand discretion",
          items: [
            "HIM World's decision on quality-check outcomes, return eligibility, defect claims and fraud reviews is final and binding.",
            "We may refuse service, cancel orders, limit quantities, or suspend or close any account at our sole discretion, including for suspected resale, abuse of returns, or chargeback history.",
            "We may change products, prices, policies and these Terms at any time without prior notice. Continued use of the Site means acceptance of the updated version.",
          ],
        },
        {
          heading: "7. Intellectual property",
          body: "All content on the Site, including high-resolution imagery, product photography, lookbooks, videos, the HIM World name, logos and brand identity, product descriptions, copy, graphics, UI design and code, is the exclusive property of HIM World or its licensors and is protected by Indian and international copyright and trademark laws. You may not copy, reproduce, download, modify, distribute, scrape or use any of it, including for resale listings, advertising or AI training, without our prior written permission.",
        },
        {
          heading: "8. Prohibited use",
          body: "You agree not to misuse the Site, including by hacking or probing it, uploading malware, scraping content, placing fraudulent orders or chargebacks, impersonating others, or selling counterfeit products using our brand.",
        },
        {
          heading: "9. Chargebacks and payment disputes",
          items: [
            "You agree to contact HIM World and follow our policies before raising a chargeback or payment dispute.",
            "Raising a chargeback for a delivered order, or for a reason not permitted under our policies, is a breach of these Terms. We will contest it with delivery proof (OTP, signature, tracking) and may suspend your account and recover the amount, plus reasonable costs.",
          ],
        },
        {
          heading: "10. Indemnity",
          body: "You agree to indemnify and hold harmless HIM.CLOTHING LLP, its partners, employees and agents from any claims, losses, liabilities, costs and legal fees arising from your breach of these Terms, misuse of the Site, false information, fraudulent orders or chargebacks, or violation of any law or third-party right.",
        },
        {
          heading: "11. No warranties",
          body: 'The Site and products are provided "as is" and "as available". To the maximum extent permitted by law, we disclaim all implied warranties, including merchantability and fitness for a particular purpose, beyond those stated in our policies.',
        },
        {
          heading: "12. Limitation of liability",
          items: [
            "To the maximum extent permitted by law, our total liability for any claim arising from an order is limited to the amount you paid for that order.",
            "We are not liable for indirect, incidental, special or consequential losses, including loss of profits or data.",
            "We are not liable for delays or failures caused by events beyond our reasonable control (force majeure), such as natural disasters, strikes, pandemics, customs holds or courier disruptions.",
            "Nothing in these Terms limits rights you have under the Consumer Protection Act, 2019 or other mandatory consumer law.",
          ],
        },
        {
          heading: "13. Governing law, disputes and arbitration",
          items: [
            "These Terms are governed by the laws of India, for customers worldwide.",
            "Any dispute must first be raised with our Grievance Officer and given 30 days to resolve.",
            "Unresolved disputes will be settled by binding arbitration under the Arbitration and Conciliation Act, 1996, by a sole arbitrator appointed by HIM World. The seat and venue will be Gurugram, Haryana, and proceedings will be in English. Courts at Gurugram, Haryana have exclusive jurisdiction for related matters.",
            "Claims must be brought individually, not as part of a class or representative action.",
            "Any claim must be raised within 6 months of the order date, or it is waived, to the extent permitted by law.",
          ],
        },
        {
          heading: "14. General",
          items: [
            "Entire agreement: these Terms and our policies are the entire agreement between you and HIM World about your use of the Site and purchases.",
            "Severability: if any clause is found unenforceable, it will be enforced to the maximum extent allowed and the rest remains in full effect.",
            "No waiver: our failure to enforce any right is not a waiver of that right.",
            "Assignment: we may assign or transfer our rights and obligations; you may not without our written consent.",
            "Electronic records: these Terms are an electronic record under the Information Technology Act, 2000 and require no physical or digital signature. Placing an order is your acceptance.",
            "Language: if these Terms are translated, the English version prevails.",
          ],
        },
        {
          heading: "15. Contact",
          body: "HIM.CLOTHING LLP, F-17, First Floor, Royal Residency, Sushant Lok Phase 2, Gurugram, Haryana 122003 · support@thehim.in",
        },
      ]}
    />
  );
}
