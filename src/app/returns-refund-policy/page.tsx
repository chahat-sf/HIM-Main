import LegalPageShell from "@/components/LegalPageShell";
import { buildPageMetadata, PAGE_SEO } from "@/lib/seo";

export const metadata = buildPageMetadata(PAGE_SEO.returnsRefund);

export default function ReturnsRefundPolicyPage() {
  return (
    <LegalPageShell
      title="Returns, Exchanges & Refund Policy"
      lead="Last updated: 10 November 2026"
      showDisclaimer={false}
      sections={[
        {
          heading: "1. Made-to-order pieces",
          body: "Every HIM World piece is made to order. Made-to-order, customised, bespoke or monogrammed garments, and pieces made to your measurements, cannot be returned or exchanged except when damaged, defective or incorrect on arrival (Section 5).",
        },
        {
          heading: "2. Return window",
          body: "Where an item is eligible, you may request a return or exchange within 7 days of delivery. Requests after this window cannot be accepted.",
        },
        {
          heading: "3. Condition criteria",
          body: "To pass our quality check (QC), items must be:",
          items: [
            "Unworn, unwashed, unaltered and free of perfume, makeup, stains or odour.",
            "With all original tags, labels and security tags intact.",
            "In the original HIM World packaging (box, dust bag, tissue) with the authenticity card and invoice.",
          ],
          after:
            "Items that fail QC will be shipped back to you at your cost, and no refund will be issued. HIM World's QC decision is final.",
        },
        {
          heading: "4. Non-returnable items",
          items: [
            "Made-to-order, customised, bespoke or monogrammed garments, and pieces made to your measurements.",
            "Items altered at your request or by a third party.",
            "Delicate accessories, innerwear, undergarments, socks and pocket squares, for hygiene reasons.",
            "Gift cards and final-sale or clearance items.",
            "International orders, except items damaged, defective or incorrect on arrival.",
          ],
        },
        {
          heading: "5. Damaged, defective or wrong items",
          body: "If you receive an item that is damaged, defective, the wrong product or size, or not made to the measurements you gave (beyond ±2 cm), email support@thehim.in within 48 hours of delivery with your order number, photos and an unboxing video. If approved, we will repair, remake, replace or refund it at no extra cost, including return shipping.",
        },
        {
          heading: "6. How to return or exchange",
          items: [
            "Email support@thehim.in with your order number and reason.",
            "We will confirm eligibility within 2 business days and schedule a reverse pickup where serviceable, or share the return address.",
            "Pack the item securely in its original packaging and ship it via a tracked service as instructed.",
            "After it reaches us, we complete a QC inspection within 3 business days.",
          ],
          after:
            "Exchanges are subject to availability. If your requested option is unavailable, we will issue store credit.",
        },
        {
          heading: "7. Refund method and timeline",
          items: [
            "Change-of-mind returns (where eligible) are refunded as HIM World store credit only. Store credit is non-transferable, cannot be exchanged for cash, and expires 12 months from issue.",
            "Refunds to the original payment source are issued only for orders cancelled by us, items damaged or defective on arrival, or wrong items sent by us.",
            "Approved refunds and credits are processed within 5–7 business days after passing QC. Banks may take an additional 5–10 business days to reflect the amount.",
            "Return shipping, payment gateway charges, customs duties and taxes on change-of-mind returns are borne by the customer and deducted from any credit.",
            "A restocking and QC fee of up to 10% may be deducted from returns that are accepted but not in perfect resale condition.",
            "Customers flagged for excessive returns may be refused future returns or orders.",
          ],
        },
        {
          heading: "8. Cancellations",
          body: "Orders can be cancelled within 24 hours of purchase, before production begins, for a full refund. After production starts, orders cannot be cancelled.",
        },
        {
          heading: "9. Contact",
          body: "support@thehim.in",
        },
      ]}
    />
  );
}
