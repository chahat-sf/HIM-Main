import LegalPageShell from "@/components/LegalPageShell";
import { buildPageMetadata, PAGE_SEO } from "@/lib/seo";

export const metadata = buildPageMetadata(PAGE_SEO.shipping);

export default function ShippingPolicyPage() {
  return (
    <LegalPageShell
      title="Shipping, Logistics & Delivery Policy"
      lead="Last updated: 10 November 2026"
      showDisclaimer={false}
      sections={[
        {
          heading: "1. Free shipping",
          body: "Shipping is free on all orders, within India and internationally. International orders may still attract customs duties and import taxes in the destination country (see Section 5).",
        },
        {
          heading: "2. Fulfilment timelines",
          labeled: [
            {
              label: "Made-to-order production",
              text: "India: 10–15 business days. International: 10–15 business days.",
            },
            {
              label: "Transit after dispatch",
              text: "India: 4–7 business days. International: 7–14 business days.",
            },
          ],
          after:
            "Timelines are estimates from order confirmation and exclude Sundays and public holidays. You will receive tracking details by email or SMS once your order ships.",
        },
        {
          heading: "3. Insured shipping and delivery security",
          items: [
            "Every order is shipped fully insured in tamper-evident HIM World packaging.",
            "High-value deliveries require OTP verification at the door. The courier will hand over the parcel only after you share the OTP sent to your registered phone number.",
            "International and select orders may require a physical signature on delivery. We do not deliver insured shipments to PO boxes.",
            "Please inspect the outer packaging before accepting. If it appears tampered or damaged, refuse delivery or note it on the courier's record, and email support@thehim.in within 24 hours with photos.",
          ],
        },
        {
          heading: "4. Address accuracy and failed delivery",
          body: "Please check your address and phone number at checkout. We are not responsible for loss due to incorrect details. After 3 failed delivery attempts, the parcel returns to us and re-shipping charges will apply. Address changes are possible only before dispatch.",
        },
        {
          heading: "5. International orders",
          items: [
            "Destinations: we ship worldwide, except to restricted destinations.",
            'Customer is the importer of record. You are responsible for complying with the import laws of your country and for all customs duties, import taxes (VAT/GST), brokerage and clearance fees, unless checkout explicitly states "Duties Paid".',
            "Risk of loss: for international orders, risk of loss passes to you once the parcel is handed to the carrier. Insured parcels are covered only up to the declared value; claims are handled under the carrier's terms.",
            "Customs declarations: we declare the true transaction value on all customs documents and will not under-declare or mark orders as gifts.",
            "Customs delays and seizures: we are not responsible for delays, holds, inspections, damage or confiscation by customs authorities.",
            "Refused or unclaimed parcels: if a parcel is refused, unclaimed, or returned because duties were not paid, no refund is due for return shipping, duties or taxes. Any balance may be refunded as store credit after deducting all such costs.",
            "Restricted destinations: we do not ship to countries or persons subject to Indian, UN or other applicable sanctions, or to destinations where our products are restricted, and may cancel any such order.",
            "Currency: prices shown in foreign currencies are indicative. Your card issuer's exchange rate and foreign-transaction fees apply and are non-refundable. Refunds are made in the original charged currency; we are not responsible for exchange-rate differences.",
            "Taxes: Indian GST is charged as applicable under Indian law. Any taxes of the destination country are the customer's responsibility.",
          ],
        },
        {
          heading: "6. Lost or delayed parcels",
          body: "If your order has not arrived within 7 days of its estimated delivery date, email support@thehim.in. We will trace it with the courier and, if it is confirmed lost, reship or refund it in full.",
        },
      ]}
    />
  );
}
