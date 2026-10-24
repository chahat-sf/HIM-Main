import type { Metadata } from "next";
import LegalPageShell from "@/components/LegalPageShell";

export const metadata: Metadata = {
  title: "Legals | HIM",
  description: "Legal information for HIM.",
};

export default function LegalsPage() {
  return (
    <LegalPageShell
      title="Legals"
      lead="General legal information about HIM, this website, and how our materials may be used."
      sections={[
        {
          heading: "About HIM",
          body: "Placeholder. Introduce the brand entity, registered address, and the purpose of this site. Replace with final company particulars before launch.",
        },
        {
          heading: "Intellectual property",
          body: "Placeholder. State ownership of trademarks, product imagery, copy, and design. Note that content may not be copied or reused without permission unless expressly allowed.",
        },
        {
          heading: "Site use",
          body: "Placeholder. Outline acceptable use of the website, account responsibilities, and that access may be suspended for misuse or security reasons.",
        },
        {
          heading: "Governing law",
          body: "Placeholder. Specify the governing law and venue for disputes relating to this site and these legal pages.",
        },
        {
          heading: "Contact",
          body: "Placeholder. Provide the official contact channel for legal notices and enquiries (email and/or postal address).",
        },
      ]}
    />
  );
}
