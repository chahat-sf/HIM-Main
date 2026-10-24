import type { Metadata } from "next";
import LegalPageShell from "@/components/LegalPageShell";

export const metadata: Metadata = {
  title: "Privacy Policy | HIM",
  description: "How HIM collects, uses, and protects personal data.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell
      title="Privacy Policy"
      lead="How HIM collects, uses, stores, and shares personal information when you browse or shop with us."
      sections={[
        {
          heading: "Data we collect",
          body: "Placeholder. List categories such as account details, order information, device/usage data, and newsletter preferences.",
        },
        {
          heading: "How we use data",
          body: "Placeholder. Describe purposes including fulfilling orders, customer support, security, analytics, and marketing where consented.",
        },
        {
          heading: "Cookies",
          body: "Placeholder. Explain essential vs optional cookies, similar technologies, and how preferences can be managed.",
        },
        {
          heading: "Sharing",
          body: "Placeholder. Note processors (payments, logistics, hosting) and that data is not sold. Describe any international transfers at a high level.",
        },
        {
          heading: "Your rights",
          body: "Placeholder. Summarize access, correction, deletion, and opt-out rights available under applicable privacy laws.",
        },
        {
          heading: "Contact",
          body: "Placeholder. Provide the privacy contact channel for requests and questions about this policy.",
        },
      ]}
    />
  );
}
