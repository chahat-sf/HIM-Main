"use client";

import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const AUTH_SERIF = '"Cormorant Garamond", Georgia, serif';
export const AUTH_SANS = '"Helvetica Neue", Helvetica, Arial, sans-serif';
export const AUTH_BG = "#0a0a0a";
export const AUTH_INK = "#ffffff";
export const AUTH_MUTED = "rgba(255,255,255,0.45)";
export const AUTH_MUTED_SOFT = "rgba(255,255,255,0.55)";
export const AUTH_BORDER = "rgba(255,255,255,0.28)";
export const AUTH_GOLD = "#c4a574";
export const AUTH_GOLD_HOVER = "#d4b888";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  imageSrc?: string;
  children: React.ReactNode;
};

export default function AuthShell({
  eyebrow,
  title,
  subtitle,
  imageSrc = "/products/man-image-103.webp",
  children,
}: AuthShellProps) {
  return (
    <>
      <Navbar />
      <main className="auth-page">
        <div className="auth-split">
          <section className="auth-media him-hero-media" aria-hidden="true">
            <Image
              src={imageSrc}
              alt=""
              fill
              priority
              quality={80}
              sizes="(max-width: 900px) 100vw, 50vw"
              className="object-cover object-top"
              style={{ objectFit: "cover", objectPosition: "top center" }}
            />
            <div className="auth-media-overlay" />
            <div className="auth-media-copy">
              <p className="auth-eyebrow">{eyebrow}</p>
              <h1 className="auth-title">{title}</h1>
              {subtitle && <p className="auth-subtitle">{subtitle}</p>}
            </div>
          </section>

          <section className="auth-form-panel">
            <div className="auth-form-card">{children}</div>
          </section>
        </div>
      </main>
      <Footer />

      <style jsx global>{`
        .auth-page {
          background: ${AUTH_BG};
          min-height: 100vh;
          color: ${AUTH_INK};
        }

        .auth-split {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: calc(100vh - 72px);
        }

        .auth-media {
          position: relative;
          min-height: 420px;
          overflow: hidden;
          background: #000;
        }

        .auth-media-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(0, 0, 0, 0.15) 0%,
            rgba(0, 0, 0, 0.45) 45%,
            rgba(0, 0, 0, 0.82) 100%
          );
          pointer-events: none;
        }

        .auth-media-copy {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: clamp(28px, 5vw, 56px);
          z-index: 1;
        }

        .auth-eyebrow {
          margin: 0 0 10px;
          font-family: ${AUTH_SANS};
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: ${AUTH_MUTED};
        }

        .auth-title {
          margin: 0;
          font-family: ${AUTH_SERIF};
          font-size: clamp(36px, 5vw, 64px);
          font-weight: 400;
          letter-spacing: 0.02em;
          text-transform: uppercase;
          color: ${AUTH_INK};
          line-height: 0.95;
        }

        .auth-subtitle {
          margin: 14px 0 0;
          font-family: ${AUTH_SANS};
          font-size: clamp(10px, 1vw, 12px);
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: ${AUTH_MUTED_SOFT};
          line-height: 1.55;
          max-width: 280px;
        }

        .auth-form-panel {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: clamp(28px, 5vw, 64px) clamp(20px, 4vw, 56px);
          background: ${AUTH_BG};
        }

        .auth-form-card {
          width: 100%;
          max-width: 420px;
          border: 1px solid ${AUTH_BORDER};
          padding: clamp(24px, 3vw, 36px);
          box-sizing: border-box;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .auth-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .auth-field label {
          font-family: ${AUTH_SANS};
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 1.4px;
          text-transform: uppercase;
          color: ${AUTH_MUTED_SOFT};
        }

        .auth-field input[type="email"],
        .auth-field input[type="password"],
        .auth-field input[type="text"],
        .auth-field input[type="tel"] {
          width: 100%;
          height: 44px;
          padding: 0 14px;
          border: 1px solid ${AUTH_BORDER};
          outline: none;
          background: rgba(255, 255, 255, 0.03);
          color: ${AUTH_INK};
          font-family: ${AUTH_SANS};
          font-size: 13px;
          box-sizing: border-box;
        }

        .auth-field input::placeholder {
          color: ${AUTH_MUTED};
        }

        .auth-field input:focus {
          border-color: rgba(255, 255, 255, 0.55);
        }

        .auth-password-wrap {
          position: relative;
        }

        .auth-password-wrap input {
          padding-right: 52px;
        }

        .auth-password-toggle {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          border: none;
          background: transparent;
          color: ${AUTH_MUTED_SOFT};
          font-family: ${AUTH_SANS};
          font-size: 9px;
          letter-spacing: 1px;
          text-transform: uppercase;
          cursor: pointer;
          padding: 6px;
        }

        .auth-password-toggle:hover {
          color: ${AUTH_INK};
        }

        .auth-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .auth-check {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: ${AUTH_SANS};
          font-size: 11px;
          color: ${AUTH_MUTED_SOFT};
          cursor: pointer;
          user-select: none;
        }

        .auth-check input {
          width: 14px;
          height: 14px;
          accent-color: ${AUTH_GOLD};
          cursor: pointer;
        }

        .auth-link {
          font-family: ${AUTH_SANS};
          font-size: 10px;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          color: ${AUTH_MUTED_SOFT};
          text-decoration: none;
          border-bottom: 1px solid transparent;
        }

        .auth-link:hover {
          color: ${AUTH_INK};
          border-bottom-color: ${AUTH_INK};
        }

        .auth-submit {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 48px;
          margin-top: 6px;
          border: none;
          background: ${AUTH_GOLD};
          color: #111;
          font-family: ${AUTH_SANS};
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 180ms ease;
        }

        .auth-submit:hover:not(:disabled) {
          background: ${AUTH_GOLD_HOVER};
        }

        .auth-submit:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .auth-footer-note {
          margin: 18px 0 0;
          text-align: center;
          font-family: ${AUTH_SANS};
          font-size: 11px;
          color: ${AUTH_MUTED};
          line-height: 1.5;
        }

        .auth-footer-note a {
          color: ${AUTH_MUTED_SOFT};
          text-decoration: none;
          border-bottom: 1px solid ${AUTH_MUTED_SOFT};
          margin-left: 4px;
          text-transform: uppercase;
          font-size: 10px;
          letter-spacing: 0.8px;
        }

        .auth-footer-note a:hover {
          color: ${AUTH_INK};
          border-bottom-color: ${AUTH_INK};
        }

        .auth-error {
          margin: 0;
          font-family: ${AUTH_SANS};
          font-size: 11px;
          color: #e8a0a0;
          letter-spacing: 0.2px;
        }

        @media (max-width: 900px) {
          .auth-split {
            grid-template-columns: 1fr;
            min-height: auto;
          }

          .auth-media {
            min-height: clamp(200px, 42vw, 280px);
          }

          .auth-form-panel {
            padding: 28px 16px 56px;
          }

          .auth-form-card {
            max-width: none;
          }
        }
      `}</style>
    </>
  );
}

export function AuthCrossLink({
  prompt,
  href,
  label,
}: {
  prompt: string;
  href: string;
  label: string;
}) {
  return (
    <p className="auth-footer-note">
      {prompt}{" "}
      <Link href={href}>{label}</Link>
    </p>
  );
}
