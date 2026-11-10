import LegalPageShell from "@/components/LegalPageShell";
import { buildPageMetadata, PAGE_SEO } from "@/lib/seo";

export const metadata = buildPageMetadata(PAGE_SEO.grievanceContact);

export default function GrievanceContactPage() {
  return (
    <LegalPageShell
      title="Grievance Redressal & Contact Details"
      lead="Last updated: 10 November 2026"
      showDisclaimer={false}
      sections={[
        {
          heading: "1. Business information",
          items: [
            "Legal business name: HIM.CLOTHING LLP (trading as HIM World)",
            "Entity type: Limited Liability Partnership (LLP)",
            "GSTIN: 06AATFH7402G1ZA",
            "Registered address: F-17, First Floor, Royal Residency, Sushant Lok Phase 2, Gurugram, Haryana 122003, India",
            "Customer care: support@thehim.in (Monday to Saturday, 10:00 to 18:00 IST)",
          ],
        },
        {
          heading: "2. Grievance Officer",
          body: "As required under the Consumer Protection (E-Commerce) Rules, 2020 and the Information Technology Act, 2000:",
          items: [
            "Designation: Grievance Officer, HIM.CLOTHING LLP",
            'Email: support@thehim.in (subject: "Grievance")',
            "Address: F-17, First Floor, Royal Residency, Sushant Lok Phase 2, Gurugram, Haryana 122003",
          ],
        },
        {
          heading: "3. Response timelines",
          items: [
            "Acknowledgement: within 48 hours of receiving your complaint, with a ticket number.",
            "Resolution: within 15 days of acknowledgement. Complex cases may take up to one month, and we will keep you updated.",
          ],
        },
        {
          heading: "4. How to raise a grievance",
          body: [
            "Email the Grievance Officer with your name, order number, contact details, a clear description of the issue and any supporting photos or documents.",
            "If you are not satisfied with our resolution, you may approach the National Consumer Helpline (1915 or consumerhelpline.gov.in) or the appropriate consumer commission.",
          ],
        },
      ]}
    />
  );
}
