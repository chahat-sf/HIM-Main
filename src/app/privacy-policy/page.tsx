import LegalPageShell from "@/components/LegalPageShell";
import { buildPageMetadata, PAGE_SEO } from "@/lib/seo";

export const metadata = buildPageMetadata(PAGE_SEO.privacy);

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell
      title="Privacy Policy"
      showDisclaimer={false}
      sections={[
        {
          heading: "1. Introduction",
          body: [
            "At HIM, we value your privacy and are committed to handling your personal information responsibly. This Privacy Policy explains how we collect, use, store, and protect your information when you visit our website, place an order, or interact with our services.",
            "By using our website, you acknowledge the practices described in this Privacy Policy, subject to applicable data protection laws.",
          ],
        },
        {
          heading: "2. Information We Collect",
          body: "HIM may collect the following categories of information when you use our website or services:",
          labeled: [
            {
              label: "Personal Information",
              text: "Your name, email address, phone number, billing address, shipping address, and other details you provide when placing an order or contacting us.",
            },
            {
              label: "Order and Transaction Information",
              text: "Details relating to your purchases, order history, delivery preferences, returns, exchanges, and refunds.",
            },
            {
              label: "Payment Information",
              text: "Payments are processed through the payment methods and service providers available at checkout. We may receive transaction references, payment status, and related information necessary to process and manage your orders. Full payment card details are generally handled by the relevant payment service provider.",
            },
            {
              label: "Technical Information",
              text: "Information such as your IP address, browser type, device information, operating system, website interactions, and usage data may be collected when you access our website.",
            },
            {
              label: "Communication Preferences",
              text: "Information you provide when subscribing to updates, participating in promotions, responding to surveys, or communicating with our customer support team.",
            },
          ],
        },
        {
          heading: "3. How We Use Your Information",
          body: "We use your information for legitimate business purposes, including:",
          items: [
            "Processing and fulfilling orders, payments, deliveries, returns, and refunds.",
            "Providing customer support and responding to enquiries.",
            "Sending order confirmations, shipping updates, and other service-related communications.",
            "Improving our website, products, services, and shopping experience.",
            "Sharing relevant brand updates, promotional offers, and product announcements where permitted and, where required, with your consent.",
            "Detecting and preventing fraudulent transactions, unauthorised activities, and security risks.",
            "Complying with applicable legal, regulatory, accounting, and tax obligations.",
          ],
        },
        {
          heading: "4. Cookies and Similar Technologies",
          body: [
            "Our website may use cookies and similar technologies to support website functionality, remember preferences, understand website usage, and improve the overall shopping experience.",
            "Where applicable, these technologies may also be used for analytics and personalised advertising, subject to your preferences and applicable law.",
            "You may manage or disable certain cookies through your browser settings or any cookie preference tools made available on our website. Disabling essential cookies may affect some website features.",
          ],
        },
        {
          heading: "5. Sharing of Information",
          body: [
            "HIM does not sell customers' personal information as part of its ordinary business operations.",
            "We may share relevant information with trusted third parties when necessary to provide our services, including:",
          ],
          items: [
            "Payment processors and financial service providers.",
            "Shipping, courier, and logistics partners.",
            "Website hosting, technology, analytics, and customer support providers.",
            "Marketing and communication service providers, where permitted.",
            "Professional advisers, auditors, and legal representatives.",
            "Government authorities or other parties where disclosure is required or permitted by law.",
          ],
          after:
            "Such sharing is limited to what is reasonably necessary for the relevant purpose, subject to applicable law and appropriate safeguards.",
        },
        {
          heading: "6. Data Security",
          body: [
            "HIM takes reasonable technical and organisational measures to protect personal information against unauthorised access, loss, misuse, alteration, or disclosure.",
            "However, no method of electronic transmission or storage can be guaranteed to be completely secure. While we take appropriate precautions, we cannot guarantee absolute security.",
          ],
        },
        {
          heading: "7. Data Retention",
          body: [
            "We retain personal information only for as long as reasonably necessary to fulfil the purposes described in this Privacy Policy, including order processing, customer service, dispute resolution, recordkeeping, and compliance with legal obligations.",
            "When information is no longer required, it will be deleted, anonymised, or securely disposed of, as appropriate and as permitted by applicable law.",
          ],
        },
        {
          heading: "8. Your Privacy Rights",
          body: "Depending on the laws applicable to you, you may have the right to:",
          items: [
            "Request access to your personal information.",
            "Request correction of inaccurate or incomplete information.",
            "Request deletion of personal information where legally applicable.",
            "Withdraw consent for processing activities based on consent.",
            "Opt out of promotional emails or marketing communications.",
            "Raise concerns or submit a complaint regarding the handling of your personal information.",
          ],
          after:
            "To exercise any applicable rights, please contact HIM through the official contact details provided on our website. We may need to verify your identity before processing certain requests.",
        },
        {
          heading: "9. Marketing Communications",
          body: [
            "If you choose to receive updates from HIM, we may send you information about new collections, product launches, special offers, and brand announcements.",
            "You may unsubscribe from promotional emails by using the unsubscribe link provided in the communication or by contacting us directly.",
            "Even if you opt out of marketing communications, we may continue to send essential messages relating to your purchases, deliveries, account, or other service-related matters.",
          ],
        },
        {
          heading: "10. Third-Party Websites",
          body: [
            "Our website may contain links to third-party websites, platforms, or services. These external websites operate independently and may have their own privacy policies and data handling practices.",
            "HIM is not responsible for the privacy practices of third-party websites. We encourage you to review their privacy policies before sharing personal information with them.",
          ],
        },
        {
          heading: "11. Children's Privacy",
          body: [
            "HIM's website and products are intended for a general audience, and our services are not knowingly directed towards children where restricted by applicable law.",
            "We do not knowingly collect personal information from children in circumstances where such collection is prohibited. If we become aware that personal information has been collected unlawfully from a child, we will take appropriate steps to address the matter in accordance with applicable law.",
          ],
        },
        {
          heading: "12. International Data Transfers",
          body: [
            "Where HIM uses service providers or operates across multiple countries, personal information may be processed or transferred outside your country of residence.",
            "Any such transfer will be carried out in accordance with applicable data protection laws and any required safeguards.",
          ],
        },
        {
          heading: "13. Changes to This Privacy Policy",
          body: [
            "HIM may update this Privacy Policy to reflect changes in our business practices, website functionality, service providers, or applicable legal requirements.",
            "Any revised policy will be published on this page. We encourage you to review this page periodically to remain informed about how your information is handled.",
          ],
        },
        {
          heading: "14. Contact Us",
          body: "If you have questions, concerns, or requests relating to this Privacy Policy or the handling of your personal information, please contact us through our official channels.",
          labeled: [
            {
              label: "Brand",
              text: "HIM",
            },
            {
              label: "Email",
              text: "support@thehim.in",
            },
            {
              label: "Mobile number",
              text: "+91 99111 67778",
            },
          ],
        },
      ]}
    />
  );
}
