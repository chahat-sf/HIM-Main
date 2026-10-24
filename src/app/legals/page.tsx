import type { Metadata } from "next";
import LegalPageShell from "@/components/LegalPageShell";

export const metadata: Metadata = {
  title: "Legals | HIM",
  description: "Legal information for HIM.",
};

export default function LegalsPage() {
  return (
    <LegalPageShell
      title="Legal"
      showDisclaimer={false}
      sections={[
        {
          heading: "1. General Information",
          body: [
            "This website is owned and operated by HIM. All content on this website is provided for general informational and commercial purposes relating to HIM and its products.",
            "By accessing or using this website, you agree to comply with the applicable terms, policies, and conditions governing its use.",
          ],
        },
        {
          heading: "2. Intellectual Property Rights",
          body: [
            "All content on this website, including brand names, logos, photographs, product images, designs, graphics, text, and other visual or written materials, is owned by or licensed to HIM and is protected under applicable intellectual property laws.",
            "No material from this website may be copied, reproduced, distributed, modified, published, or used for commercial purposes without prior written permission from the relevant rights holder.",
          ],
        },
        {
          heading: "3. Website Accuracy",
          body: [
            "HIM endeavours to ensure that the information presented on this website is accurate and up to date. However, errors, omissions, or changes in product details, pricing, availability, and other information may occasionally occur.",
            "HIM reserves the right to correct such errors and update website content where necessary, subject to applicable law and any obligations relating to confirmed orders.",
          ],
        },
        {
          heading: "4. Product Representation",
          body: [
            "Product images, colours, descriptions, and other visual representations are intended to provide an accurate impression of our products. Actual products may vary slightly due to lighting, photography, screen settings, materials, and manufacturing characteristics.",
            "Such variations do not affect any rights or remedies available to customers under applicable law.",
          ],
        },
        {
          heading: "5. Third-Party Links",
          body: [
            "This website may contain links to third-party websites or services for convenience. HIM does not control and is not responsible for the content, security, privacy practices, or policies of external websites.",
            "Accessing third-party websites is at the user's discretion and subject to the relevant third party's terms and conditions.",
          ],
        },
        {
          heading: "6. Website Use",
          body: [
            "Users agree not to misuse this website, interfere with its operation, attempt unauthorised access, introduce malicious software, or engage in activities that violate applicable laws or the rights of others.",
            "HIM reserves the right to take appropriate action against misuse of its website, subject to applicable law.",
          ],
        },
        {
          heading: "7. Limitation of Liability",
          body: [
            "To the extent permitted by applicable law, HIM shall not be responsible for losses arising from temporary website unavailability, technical interruptions, or reliance on information that has become outdated.",
            "Nothing in this section excludes or limits any liability that cannot legally be excluded or limited.",
          ],
        },
        {
          heading: "8. Privacy and Data Protection",
          body: [
            "HIM respects the privacy of its customers and website visitors. Personal information collected through this website will be handled in accordance with our Privacy Policy and applicable data protection laws.",
            "Please refer to our Privacy Policy for further information about how personal information is collected, used, stored, and protected.",
          ],
        },
        {
          heading: "9. Applicable Law",
          body: "The use of this website and matters relating to its legal notices shall be governed by applicable laws, subject to mandatory legal protections available to users and consumers in their jurisdiction.",
        },
        {
          heading: "10. Contact Information",
          body: "For legal enquiries, intellectual property concerns, or questions regarding this website, please contact HIM through the official contact details provided on our website.",
        },
      ]}
    />
  );
}
