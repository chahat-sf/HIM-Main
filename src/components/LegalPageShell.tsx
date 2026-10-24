"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const SERIF = 'var(--font-room-serif, "Cormorant Garamond"), Georgia, serif';
const SANS = 'var(--font-room-sans, "Helvetica Neue"), Helvetica, Arial, sans-serif';
const BG = "#100b08";
const INK = "#f5f1e9";
const MUTED = "rgba(245, 241, 233, 0.62)";
const RULE = "rgba(245, 241, 233, 0.22)";

export type LegalSection = {
  heading: string;
  /** One or more paragraphs */
  body: string | string[];
};

const CROSS_LINKS = [
  { label: "Legals", href: "/legals" },
  { label: "Terms of Sale", href: "/terms-of-sale" },
  { label: "Privacy Policy", href: "/privacy-policy" },
] as const;

export default function LegalPageShell({
  title,
  lead,
  sections,
  showDisclaimer = true,
}: {
  title: string;
  lead: string;
  sections: LegalSection[];
  showDisclaimer?: boolean;
}) {
  return (
    <>
      <Navbar />
      <main className="legal-page">
        <header className="legal-hero">
          <p className="legal-eyebrow">LEGAL</p>
          <h1 className="legal-title">{title}</h1>
          <p className="legal-lead">{lead}</p>
        </header>

        <div className="legal-body">
          {sections.map((section) => {
            const paragraphs = Array.isArray(section.body)
              ? section.body
              : [section.body];
            return (
              <section key={section.heading} className="legal-section">
                <h2 className="legal-section-title">{section.heading}</h2>
                {paragraphs.map((paragraph, index) => (
                  <p key={index} className="legal-section-body">
                    {paragraph}
                  </p>
                ))}
              </section>
            );
          })}

          <nav className="legal-cross" aria-label="Related legal pages">
            <p className="legal-cross-label">Also see</p>
            <ul className="legal-cross-list">
              {CROSS_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          {showDisclaimer ? (
            <p className="legal-disclaimer">
              Placeholder copy for layout only. Replace with counsel-approved
              text before launch.
            </p>
          ) : null}
        </div>
      </main>
      <Footer />

      <style jsx>{`
        .legal-page {
          min-height: 100vh;
          background: ${BG};
          color: ${INK};
          font-family: ${SANS};
        }

        .legal-hero {
          padding: clamp(96px, 14vw, 140px) clamp(20px, 5vw, 48px) 48px;
          text-align: center;
          border-bottom: 1px solid ${RULE};
        }

        .legal-eyebrow {
          margin: 0 0 16px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: ${MUTED};
        }

        .legal-title {
          margin: 0;
          font-family: ${SERIF};
          font-size: clamp(32px, 6vw, 52px);
          font-weight: 500;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          line-height: 1.1;
          color: ${INK};
        }

        .legal-lead {
          margin: 18px auto 0;
          max-width: 42rem;
          font-size: 13px;
          line-height: 1.6;
          letter-spacing: 0.02em;
          color: ${MUTED};
        }

        .legal-body {
          max-width: 720px;
          margin: 0 auto;
          padding: 56px clamp(20px, 5vw, 48px) 96px;
        }

        .legal-section {
          padding: 28px 0;
          border-bottom: 1px solid ${RULE};
        }

        .legal-section:first-child {
          padding-top: 0;
        }

        .legal-section-title {
          margin: 0 0 12px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: ${INK};
        }

        .legal-section-body {
          margin: 0;
          font-size: 14px;
          line-height: 1.7;
          color: ${MUTED};
        }

        .legal-section-body + .legal-section-body {
          margin-top: 14px;
        }

        .legal-cross {
          margin-top: 48px;
          padding-top: 28px;
          border-top: 1px solid ${RULE};
          text-align: center;
        }

        .legal-cross-label {
          margin: 0 0 16px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: ${INK};
        }

        .legal-cross-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 12px 28px;
        }

        .legal-cross-list :global(a) {
          color: ${MUTED};
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          text-decoration: none;
          transition: color 160ms ease;
        }

        .legal-cross-list :global(a):hover {
          color: ${INK};
        }

        .legal-disclaimer {
          margin: 36px 0 0;
          font-size: 11px;
          line-height: 1.5;
          letter-spacing: 0.02em;
          color: rgba(245, 241, 233, 0.4);
          text-align: center;
        }
      `}</style>
    </>
  );
}
