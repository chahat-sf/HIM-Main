import LegalPageShell from "@/components/LegalPageShell";
import { buildPageMetadata, PAGE_SEO } from "@/lib/seo";

export const metadata = buildPageMetadata(PAGE_SEO.privacy);

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell
      title="Privacy & Cookie Policy"
      lead="Last updated: 10 November 2026"
      showDisclaimer={false}
      sections={[
        {
          heading: "1. Who we are",
          body: 'This Privacy Policy explains how HIM.CLOTHING LLP ("HIM World", "we", "us") collects, uses and protects your personal data when you use our website (the "Site"). It is drafted in line with India\'s Digital Personal Data Protection Act, 2023, the Information Technology Act, 2000 and its rules, and reflects GDPR principles for customers in the EU and UK.',
        },
        {
          heading: "2. Data we collect",
          labeled: [
            {
              label: "Identity & contact",
              text: "Name, phone number, email address — for order confirmation, delivery updates and support.",
            },
            {
              label: "Delivery details",
              text: "Shipping and billing address, delivery instructions — for shipping your order.",
            },
            {
              label: "Fit data",
              text: "Size selections and body measurements — for making your made-to-order garment.",
            },
            {
              label: "Order history",
              text: "Products bought, order value, returns — for service, after-care and records.",
            },
            {
              label: "Payment data",
              text: "Payment tokens and transaction IDs from our gateway, never your full card number or CVV — for processing payments and refunds.",
            },
            {
              label: "Technical data",
              text: "IP address, device, browser, pages visited — for security, fraud prevention and site improvement.",
            },
            {
              label: "Communications",
              text: "Emails, chats, messages, marketing preferences — for support and consented marketing.",
            },
          ],
        },
        {
          heading: "3. How we use your data",
          items: [
            "To process, make, ship and deliver your orders.",
            "To verify payments, prevent fraud and secure high-value deliveries.",
            "To handle returns, exchanges, refunds and alterations.",
            "To send transactional updates (order, dispatch, delivery).",
            "To send marketing by email, SMS or WhatsApp, only with your consent. You can unsubscribe at any time.",
            "To analyse and improve the Site and personalise your experience.",
            "To meet legal, tax (GST) and accounting obligations.",
          ],
        },
        {
          heading: "4. How we protect your data",
          items: [
            "All pages are served over SSL/TLS (HTTPS) encryption.",
            "Card payments are processed by PCI-DSS compliant payment gateways. We store only payment tokens, never full card numbers or CVV.",
            "Passwords are stored as one-way hashes.",
            "Access to customer data is limited to staff and partners who need it to fulfil your order.",
            "We review the security practices of our service providers regularly.",
          ],
        },
        {
          heading: "5. Third-party sharing",
          body: "We never sell or rent your personal data. We share it only with:",
          items: [
            "Logistics and courier partners: name, phone and address for delivery.",
            "Payment gateways: to process payments and refunds.",
            "Analytics and advertising platforms: Google Analytics and Meta Pixel receive device and browsing data to measure site usage and ad performance, only with your cookie consent.",
            "Hosting and IT providers, email and customer-support tools.",
            "Our production team: order and measurement details to make your garment.",
            "Government or law enforcement: where required by law.",
          ],
          after:
            "Some providers may process data outside India. We use reputable providers with appropriate safeguards.",
        },
        {
          heading: "6. Your rights",
          body: "You may at any time:",
          items: [
            "Access a copy of the personal data we hold about you.",
            "Correct inaccurate or incomplete data.",
            "Erase your data, subject to records we must keep by law, such as invoices.",
            "Withdraw consent for marketing or optional cookies.",
            "Nominate a person to exercise your rights in case of death or incapacity.",
            "EU/UK customers may also object to or restrict processing, request portability, and complain to their local data authority.",
          ],
          after:
            'How to make a request: email support@thehim.in from your registered email address with the subject "Data Request", stating what you want. We will verify your identity and respond within 30 days.',
        },
        {
          heading: "7. Data retention",
          labeled: [
            {
              label: "Account and contact details",
              text: "While your account is active, plus 2 years.",
            },
            {
              label: "Measurements",
              text: "Until you delete them or close your account.",
            },
            {
              label: "Invoices and order records",
              text: "8 years (tax law).",
            },
            {
              label: "Marketing data",
              text: "Until you unsubscribe.",
            },
            {
              label: "Analytics and cookie data",
              text: "Up to 13 months.",
            },
          ],
        },
        {
          heading: "8. Cookie Policy",
          body: "Cookies are small files stored on your device. We use:",
          labeled: [
            {
              label: "Essential / session cookies",
              text: "Keep you logged in, keep items in your cart (cart persistence), secure checkout. Consent not needed — the Site cannot work without them.",
            },
            {
              label: "Preference cookies",
              text: "Remember your currency, region and size choices. Consent needed.",
            },
            {
              label: "Analytics cookies",
              text: "Google Analytics, to understand how visitors use the Site. Consent needed.",
            },
            {
              label: "Marketing / tracking cookies",
              text: "Meta Pixel and similar, for personalised recommendations and relevant ads. Consent needed.",
            },
          ],
          after:
            "You can accept, reject or customise optional cookies through our cookie banner, and change your choice at any time through the Cookie Settings link in the website footer or your browser settings. Blocking essential cookies may stop the cart and checkout from working.",
        },
        {
          heading: "9. Children",
          body: "The Site is not intended for anyone under 18. We do not knowingly collect children's data without verifiable parental consent.",
        },
        {
          heading: "10. Data breaches",
          body: "If a breach affects your data, we will notify you and the relevant authorities, including the Data Protection Board of India and CERT-In where required, and act to limit the impact.",
        },
        {
          heading: "11. Changes and contact",
          body: 'We may update this policy and will show the new "Last updated" date here. For questions, email support@thehim.in or contact our Grievance Officer (see Grievance Redressal & Contact).',
        },
      ]}
    />
  );
}
