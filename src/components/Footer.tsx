"use client";

import { useMemo, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import { buildLoginHref } from "@/lib/auth-redirect";
import { useSession } from "@/hooks/useSession";

type FooterLink = { label: string; href: string };

const HELP_LINKS: FooterLink[] = [
  { label: "CONTACT", href: "/collection" },
];

const LINKS_BASE: FooterLink[] = [
  { label: "ACCOUNT", href: "/login" },
];

const SOCIAL_LINKS: FooterLink[] = [
  { label: "INSTAGRAM", href: "#" },
  { label: "YOUTUBE", href: "#" },
];

const LEGAL_LINKS: FooterLink[] = [
  { label: "LEGALS", href: "/legals" },
  { label: "TERMS OF SALE", href: "/terms-of-sale" },
  { label: "PRIVACY POLICY", href: "/privacy-policy" },
];

type AccordionKey = "help" | "links" | "social" | "legal" | null;

function AccordionChevron({ open }: { open: boolean }) {
  return (
    <ChevronRight
      size={12}
      strokeWidth={1.25}
      aria-hidden
      style={{
        transform: open ? "rotate(90deg)" : "rotate(0deg)",
        transition: "transform 180ms ease",
      }}
    />
  );
}

export default function Footer() {
  const [email, setEmail] = useState("");
  const [open, setOpen] = useState<AccordionKey>(null);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const { isAuthenticated } = useSession();

  const LINKS = useMemo(
    () =>
      LINKS_BASE.map((link) =>
        link.label === "ACCOUNT"
          ? {
            ...link,
            href: isAuthenticated ? "/account" : buildLoginHref("/account"),
          }
          : link,
      ),
    [isAuthenticated],
  );

  const toggle = (key: AccordionKey) => {
    setOpen((prev) => (prev === key ? null : key));
  };

  const onNewsletterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setStatus("idle");
    setStatusMessage("");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "footer" }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        alreadySubscribed?: boolean;
      };

      if (!res.ok) {
        setStatus("error");
        setStatusMessage(data.error || "Unable to subscribe. Please try again.");
        return;
      }

      setStatus("success");
      setStatusMessage(
        data.alreadySubscribed
          ? "You're already on the list."
          : "Thanks — you're subscribed.",
      );
      setEmail("");
    } catch {
      setStatus("error");
      setStatusMessage("Unable to subscribe. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="him-footer">
      {/* Centered logo */}
      <div className="him-footer-logo-wrap">
        <Link href="/" aria-label="HIM home">
          <Image
            src="/homepage/him-logo.webp"
            alt="HIM"
            width={100}
            height={35}
            className="him-footer-logo-img"
          />
        </Link>
      </div>

      {/* Main grid */}
      <div className="him-footer-grid" role="contentinfo" aria-label="Main footer">
        {/* HELP */}
        <nav className="him-footer-col him-footer-col--help" aria-label="Help">
          <button
            type="button"
            className="him-footer-col-toggle"
            aria-expanded={open === "help"}
            onClick={() => toggle("help")}
          >
            <span className="him-footer-col-title">HELP</span>
            <AccordionChevron open={open === "help"} />
          </button>
          <p className="him-footer-col-title him-footer-col-title--desktop">
            HELP
          </p>
          <div
            className={`him-footer-col-panel${open === "help" ? " is-open" : ""}`}
          >
            <div className="him-footer-col-panel-inner">
              <ul className="him-footer-col-list">
                {HELP_LINKS.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </nav>

        {/* LINKS */}
        <nav className="him-footer-col him-footer-col--links" aria-label="Links">
          <button
            type="button"
            className="him-footer-col-toggle"
            aria-expanded={open === "links"}
            onClick={() => toggle("links")}
          >
            <span className="him-footer-col-title">LINKS</span>
            <AccordionChevron open={open === "links"} />
          </button>
          <p className="him-footer-col-title him-footer-col-title--desktop">
            LINKS
          </p>
          <div
            className={`him-footer-col-panel${open === "links" ? " is-open" : ""}`}
          >
            <div className="him-footer-col-panel-inner">
              <ul className="him-footer-col-list">
                {LINKS.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </nav>

        {/* NEWSLETTER (center) */}
        <div className="him-footer-newsletter">
          <form
            className="him-footer-newsletter-form"
            onSubmit={onNewsletterSubmit}
          >
            <label
              className="him-footer-col-title him-footer-newsletter-label"
              htmlFor="NewsletterForm--footer"
            >
              SIGN UP TO OUR NEWSLETTER
            </label>
            <div className="him-footer-newsletter-field">
              <input
                id="NewsletterForm--footer"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.currentTarget.value);
                  if (status !== "idle") {
                    setStatus("idle");
                    setStatusMessage("");
                  }
                }}
                placeholder="Email address"
                aria-label="Email address"
                autoComplete="email"
                required
                disabled={submitting}
              />
              <button
                type="submit"
                aria-label="Subscribe"
                disabled={submitting}
              >
                <ArrowRight size={14} strokeWidth={1.25} aria-hidden />
              </button>
            </div>
            <p className="him-footer-newsletter-copy">
              For tailored offers and news on our latest collections.
            </p>
            {statusMessage ? (
              <p
                className={`him-footer-newsletter-status${status === "error" ? " is-error" : " is-success"
                  }`}
                role="status"
              >
                {statusMessage}
              </p>
            ) : null}
          </form>
        </div>

        {/* LEGAL AND COOKIES */}
        <nav
          className="him-footer-col him-footer-col--legal"
          aria-label="Legal and cookies"
        >
          <button
            type="button"
            className="him-footer-col-toggle"
            aria-expanded={open === "legal"}
            onClick={() => toggle("legal")}
          >
            <span className="him-footer-col-title">LEGAL AND COOKIES</span>
            <AccordionChevron open={open === "legal"} />
          </button>
          <p className="him-footer-col-title him-footer-col-title--desktop">
            LEGAL AND COOKIES
          </p>
          <div
            className={`him-footer-col-panel${open === "legal" ? " is-open" : ""}`}
          >
            <div className="him-footer-col-panel-inner">
              <ul className="him-footer-col-list">
                {LEGAL_LINKS.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </nav>

        {/* SOCIAL */}
        <nav
          className="him-footer-col him-footer-col--social"
          aria-label="Social"
        >
          <button
            type="button"
            className="him-footer-col-toggle"
            aria-expanded={open === "social"}
            onClick={() => toggle("social")}
          >
            <span className="him-footer-col-title">SOCIAL</span>
            <AccordionChevron open={open === "social"} />
          </button>
          <p className="him-footer-col-title him-footer-col-title--desktop">
            SOCIAL
          </p>
          <div
            className={`him-footer-col-panel${open === "social" ? " is-open" : ""}`}
          >
            <div className="him-footer-col-panel-inner">
              <ul className="him-footer-col-list">
                {SOCIAL_LINKS.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </nav>
      </div>

      <hr className="him-footer-rule" />

      <div className="him-footer-bottom">
        <p className="him-footer-copyright">
          © HIM. ALL RIGHTS RESERVED.
        </p>
        <p className="him-footer-locale">INDIA</p>
      </div>

      <style jsx>{`
        .him-footer {
          width: 100%;
          color: #f5f1e9;
          background: #100b08;
          border-top: 1px solid rgba(245, 241, 233, 0.28);
          font-family: Arial, Helvetica, sans-serif;
          padding: 48px clamp(20px, 4vw, 48px) 28px;
          box-sizing: border-box;
        }

        .him-footer-logo-wrap {
          display: flex;
          justify-content: center;
          margin-bottom: 40px;
        }

        .him-footer-logo-wrap :global(.him-footer-logo-img) {
          display: block;
          width: 72px;
          height: auto;
          object-fit: contain;
        }

        .him-footer-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 32px 16px;
          align-items: start;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }

        .him-footer-col {
          text-align: center;
        }

        .him-footer-col-title {
          margin: 0 0 18px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1.4px;
          text-transform: uppercase;
          color: #f5f1e9;
          line-height: 1.2;
          text-align: center;
        }

        .him-footer-col-toggle {
          display: none;
          width: 100%;
          align-items: center;
          justify-content: space-between;
          padding: 14px 0;
          border: none;
          border-bottom: 1px solid rgba(245, 241, 233, 0.2);
          background: transparent;
          color: #f5f1e9;
          cursor: pointer;
          font-family: inherit;
        }

        .him-footer-col-toggle .him-footer-col-title {
          margin: 0;
        }

        .him-footer-col-panel {
          display: grid;
          grid-template-rows: 1fr;
        }

        .him-footer-col-panel-inner {
          min-height: 0;
          overflow: hidden;
        }

        .him-footer-col-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          text-align: center;
        }

        .him-footer-col-list :global(a) {
          color: rgba(245, 241, 233, 0.78);
          font-size: 10px;
          letter-spacing: 0.8px;
          text-decoration: none;
          text-transform: uppercase;
          transition: color 160ms ease;
        }

        .him-footer-col-list :global(a):hover {
          color: #ffffff;
        }

        /* Newsletter — true center column */
        .him-footer-newsletter {
          display: flex;
          justify-content: center;
          align-items: flex-start;
          text-align: center;
          padding: 0 8px;
          grid-column: 3;
        }

        .him-footer-newsletter-form {
          width: 100%;
          max-width: 260px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .him-footer-newsletter-label {
          margin-bottom: 14px;
          text-align: center;
          width: 100%;
        }

        .him-footer-newsletter-field {
          display: flex;
          align-items: center;
          width: 100%;
          border-bottom: 1px solid rgba(245, 241, 233, 0.55);
          margin-bottom: 14px;
        }

        .him-footer-newsletter-field input {
          flex: 1;
          min-width: 0;
          height: 36px;
          border: none;
          outline: none;
          background: transparent;
          color: #f5f1e9;
          font-family: inherit;
          font-size: 11px;
          padding: 0 8px 0 0;
          text-align: center;
        }

        .him-footer-newsletter-field input::placeholder {
          color: rgba(245, 241, 233, 0.45);
          text-align: center;
        }

        .him-footer-newsletter-field input:disabled,
        .him-footer-newsletter-field button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .him-footer-newsletter-field button {
          flex-shrink: 0;
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          border: none;
          background: transparent;
          color: #f5f1e9;
          cursor: pointer;
          padding: 0;
        }

        .him-footer-newsletter-field button:hover:not(:disabled) {
          opacity: 0.75;
        }

        .him-footer-newsletter-copy {
          margin: 0;
          font-size: 10px;
          line-height: 1.55;
          color: rgba(245, 241, 233, 0.55);
          max-width: 240px;
          text-align: center;
        }

        .him-footer-newsletter-status {
          margin: 10px 0 0;
          font-size: 10px;
          line-height: 1.4;
          letter-spacing: 0.4px;
          max-width: 240px;
        }

        .him-footer-newsletter-status.is-success {
          color: rgba(245, 241, 233, 0.85);
        }

        .him-footer-newsletter-status.is-error {
          color: #e8b4a0;
        }

        /* Rule + bottom */
        .him-footer-rule {
          border: none;
          border-top: 1px solid rgba(245, 241, 233, 0.28);
          margin: 40px 0 20px;
        }

        .him-footer-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .him-footer-copyright,
        .him-footer-locale {
          margin: 0;
          font-size: 9px;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: rgba(245, 241, 233, 0.65);
        }

        /* ── Mobile / tablet ── */
        @media (max-width: 1023px) {
          .him-footer {
            padding: 36px 20px 24px;
          }

          .him-footer-logo-wrap {
            margin-bottom: 28px;
          }

          .him-footer-grid {
            grid-template-columns: 1fr;
            gap: 0;
          }

          .him-footer-newsletter {
            grid-column: auto;
            order: -1;
            margin-bottom: 36px;
            padding: 0;
          }

          .him-footer-col-list {
            align-items: flex-start;
            text-align: left;
            padding: 12px 0 18px;
          }

          .him-footer-col {
            text-align: left;
          }

          .him-footer-col-title--desktop {
            display: none;
          }

          .him-footer-col-toggle {
            display: flex;
          }

          .him-footer-col-panel {
            grid-template-rows: 0fr;
            transition: grid-template-rows 0.4s cubic-bezier(0.22, 1, 0.36, 1);
          }

          .him-footer-col-panel.is-open {
            grid-template-rows: 1fr;
          }

          .him-footer-rule {
            margin: 28px 0 18px;
          }

          .him-footer-bottom {
            flex-direction: column;
            text-align: center;
            gap: 10px;
          }
        }

        @media (max-width: 1023px) and (prefers-reduced-motion: reduce) {
          .him-footer-col-panel {
            transition: none;
          }
        }
      `}</style>
    </footer>
  );
}
