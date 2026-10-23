"use client";

import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const SERIF = '"Cormorant Garamond", Georgia, serif';
const SANS = '"Helvetica Neue", Helvetica, Arial, sans-serif';

const BG = "#0a0a0a";
const INK = "#ffffff";
const MUTED = "rgba(255,255,255,0.45)";
const MUTED_SOFT = "rgba(255,255,255,0.55)";
const BORDER = "rgba(255,255,255,0.28)";
const RULE = "rgba(255,255,255,0.14)";
const GUTTER = "clamp(16px, 4vw, 60px)";
const CONTENT_MAX = "1120px";

// ─── Mock data (aligned to Figma) ─────────────────────────────────────────────

const USER = {
  name: "Aarav.",
  tagline: "A more considered wardrobe,\nfor wherever the day takes you.",
  details: {
    fullName: "Aarav Sharma",
    email: "aarav.sharma@email.com",
    phone: "+91 98765 43210",
    dob: "14 March 1995",
  },
  address: {
    label: "DEFAULT SHIPPING ADDRESS",
    lines: [
      "Aarav Sharma",
      "12, Palm Grove Apartments",
      "Bandra West",
      "Mumbai, Maharashtra 400050",
      "India",
    ],
  },
};

const ORDERS = [
  {
    id: "#HIM762309",
    date: "10 Apr 2024",
    items: 1,
    status: "Processing",
    statusColor: "#d4a017",
    total: "₹ 6,990",
  },
  {
    id: "#HIM717834",
    date: "24 May 2024",
    items: 3,
    status: "Shipped",
    statusColor: "#6ba3e8",
    total: "₹ 8,960",
  },
  {
    id: "#HIM714571",
    date: "12 Jun 2024",
    items: 2,
    status: "Delivered",
    statusColor: "#5aad6e",
    total: "₹ 14,913",
  },
];

const SAVED = [
  {
    slug: "textured-thermal-white-7",
    name: "LINEN SHIRT",
    price: "₹ 4,080",
    image: "/products/man-image-100.webp",
    swatches: ["#111", "#a3a3a3"],
  },
  {
    slug: "textured-thermal-white-8",
    name: "WIDE LEG TROUSERS",
    price: "₹ 5,840",
    image: "/products/man-image-101.webp",
    swatches: ["#a3a3a3", "#7a1420"],
  },
  {
    slug: "textured-thermal-white-9",
    name: "DENIM JACKET",
    price: "₹ 6,960",
    image: "/products/man-image-102.webp",
    swatches: ["#3a5aa8", "#111", "#a3a3a3"],
  },
];

const DETAIL_ROWS = [
  ["Full Name", USER.details.fullName],
  ["Email", USER.details.email],
  ["Phone", USER.details.phone],
  ["Date of Birth", USER.details.dob],
] as const;

// ─── Section helpers ──────────────────────────────────────────────────────────

function Card({ children }: { children: React.ReactNode }) {
  return <div className="acc-card">{children}</div>;
}

function SectionHeader({
  title,
  action,
  href,
}: {
  title: string;
  action?: string;
  href?: string;
}) {
  return (
    <div className="acc-section-header">
      <p className="acc-section-title">{title}</p>
      {action && (
        <Link href={href ?? "#"} className="acc-action-link">
          {action}
        </Link>
      )}
    </div>
  );
}

function Chevron() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0, opacity: 0.55 }}
    >
      <path
        d="M3.5 1.5L7 5L3.5 8.5"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AccountPage() {
  return (
    <>
      <Navbar />

      <main className="acc-page">
        {/* ── HERO ── */}
        <section className="acc-hero" aria-label="My Account">
          <Image
            src="/products/man-image-103.webp"
            alt=""
            fill
            priority
            quality={80}
            sizes="100vw"
            className="object-cover"
            style={{ objectPosition: "center 18%" }}
          />
          <div className="acc-hero-overlay" />
          <div className="acc-hero-content">
            <h1 className="acc-hero-title">MY ACCOUNT</h1>
            <p className="acc-hero-sub">
              A MORE CONSIDERED WARDROBE
              <br />
              BEGINS HERE.
            </p>
          </div>
        </section>

        {/* ── WELCOME BANNER ── */}
        <section className="acc-welcome" aria-label="Welcome">
          <Image
            src="/products/man-image-103.webp"
            alt=""
            fill
            quality={70}
            sizes="100vw"
            className="object-cover"
            style={{ objectPosition: "center 40%", opacity: 0.42 }}
          />
          <div className="acc-welcome-dim" />
          <div className="acc-welcome-inner">
            <p className="acc-welcome-label">WELCOME BACK</p>
            <h2 className="acc-welcome-name">{USER.name}</h2>
            <p className="acc-welcome-tagline">{USER.tagline}</p>
          </div>
        </section>

        {/* ── BODY ── */}
        <div className="acc-body">
          {/* Personal + Address */}
          <div className="acc-two-col">
            <Card>
              <SectionHeader title="PERSONAL DETAILS" action="EDIT" href="#" />
              <table className="acc-details-table">
                <tbody>
                  {DETAIL_ROWS.map(([label, value]) => (
                    <tr key={label}>
                      <td className="acc-detail-label">{label}</td>
                      <td className="acc-detail-value">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            <Card>
              <SectionHeader title="ADDRESSES" action="MANAGE" href="#" />
              <div className="acc-address-box">
                <p className="acc-address-label">{USER.address.label}</p>
                {USER.address.lines.map((line) => (
                  <p key={line} className="acc-address-line">
                    {line}
                  </p>
                ))}
              </div>
            </Card>
          </div>

          {/* Order History */}
          <Card>
            <SectionHeader title="ORDER HISTORY" action="VIEW ALL" href="#" />
            <div className="acc-orders-scroll">
              <table className="acc-orders-table">
                <thead>
                  <tr>
                    {["ORDER #", "DATE", "ITEMS", "STATUS", "TOTAL", ""].map(
                      (h, i) => (
                        <th key={h || `pad-${i}`}>{h}</th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {ORDERS.map((order) => (
                    <tr key={order.id}>
                      <td className="acc-order-id">{order.id}</td>
                      <td>{order.date}</td>
                      <td>
                        {order.items} {order.items === 1 ? "item" : "items"}
                      </td>
                      <td>
                        <span
                          className="acc-status"
                          style={{ color: order.statusColor }}
                        >
                          <span
                            className="acc-status-dot"
                            style={{ background: order.statusColor }}
                          />
                          {order.status}
                        </span>
                      </td>
                      <td className="acc-order-total">{order.total}</td>
                      <td className="acc-order-chevron">
                        <Chevron />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Saved Items */}
          <section className="acc-saved" aria-label="Saved items">
            <div className="acc-section-header" style={{ marginBottom: 16 }}>
              <p className="acc-section-title">SAVED ITEMS</p>
              <Link href="/collection" className="acc-action-link">
                VIEW ALL
              </Link>
            </div>
            <div className="acc-saved-grid">
              {SAVED.map((item) => (
                <Link
                  key={item.slug}
                  href={`/collection/${item.slug}`}
                  className="acc-saved-card"
                >
                  <div className="acc-saved-img">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      quality={80}
                      sizes="(max-width: 768px) 50vw, 28vw"
                      className="object-cover object-center"
                    />
                  </div>
                  <p className="acc-saved-name">{item.name}</p>
                  <p className="acc-saved-price">{item.price}</p>
                  <div className="acc-saved-swatches">
                    {item.swatches.map((c, i) => (
                      <span
                        key={`${item.slug}-${c}-${i}`}
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>

      <Footer />

      <style jsx global>{`
        .acc-page {
          background: ${BG};
          min-height: 100vh;
          color: ${INK};
        }

        /* ── Hero ── */
        .acc-hero {
          position: relative;
          height: clamp(240px, 34vw, 420px);
          overflow: hidden;
          background: #000;
        }
        .acc-hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(0, 0, 0, 0.2) 0%,
            rgba(0, 0, 0, 0.55) 55%,
            rgba(0, 0, 0, 0.85) 100%
          );
          pointer-events: none;
        }
        .acc-hero-content {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: clamp(28px, 5vw, 56px) ${GUTTER};
          max-width: calc(${CONTENT_MAX} + ${GUTTER} * 2);
          margin: 0 auto;
          width: 100%;
          box-sizing: border-box;
        }
        .acc-hero-title {
          margin: 0;
          font-family: ${SERIF};
          font-size: clamp(40px, 7.2vw, 88px);
          font-weight: 400;
          letter-spacing: 0.02em;
          text-transform: uppercase;
          color: ${INK};
          line-height: 0.92;
        }
        .acc-hero-sub {
          margin: 14px 0 0;
          font-family: ${SANS};
          font-size: clamp(9px, 0.85vw, 11px);
          letter-spacing: 1.6px;
          text-transform: uppercase;
          color: ${MUTED_SOFT};
          line-height: 1.55;
        }

        /* ── Welcome ── */
        .acc-welcome {
          position: relative;
          overflow: hidden;
          border-top: 1px solid ${BORDER};
          border-bottom: 1px solid ${BORDER};
          min-height: clamp(140px, 18vw, 200px);
        }
        .acc-welcome-dim {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.55);
          pointer-events: none;
        }
        .acc-welcome-inner {
          position: relative;
          z-index: 1;
          padding: clamp(28px, 4vw, 44px) ${GUTTER};
          max-width: calc(${CONTENT_MAX} + ${GUTTER} * 2);
          margin: 0 auto;
          box-sizing: border-box;
        }
        .acc-welcome-label {
          margin: 0 0 8px;
          font-family: ${SANS};
          font-size: 9px;
          letter-spacing: 1.8px;
          text-transform: uppercase;
          color: ${MUTED};
        }
        .acc-welcome-name {
          margin: 0 0 10px;
          font-family: ${SERIF};
          font-size: clamp(36px, 5vw, 64px);
          font-weight: 400;
          color: ${INK};
          letter-spacing: 0.01em;
          line-height: 1;
        }
        .acc-welcome-tagline {
          margin: 0;
          font-family: ${SANS};
          font-size: clamp(11px, 1vw, 13px);
          color: ${MUTED_SOFT};
          line-height: 1.55;
          white-space: pre-line;
          max-width: 340px;
        }

        /* ── Body ── */
        .acc-body {
          max-width: ${CONTENT_MAX};
          margin: 0 auto;
          padding: clamp(28px, 4vw, 48px) ${GUTTER} clamp(56px, 8vw, 96px);
          display: flex;
          flex-direction: column;
          gap: clamp(16px, 2vw, 22px);
          box-sizing: border-box;
        }

        .acc-card {
          border: 1px solid ${BORDER};
          padding: clamp(18px, 2.2vw, 28px) clamp(18px, 2.4vw, 28px);
          background: transparent;
        }

        .acc-section-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 18px;
          gap: 12px;
        }
        .acc-section-title {
          margin: 0;
          font-family: ${SANS};
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 1.6px;
          text-transform: uppercase;
          color: ${INK};
        }
        .acc-action-link {
          font-family: ${SANS};
          font-size: 9px;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: ${MUTED_SOFT};
          text-decoration: none;
          border-bottom: 1px solid ${MUTED_SOFT};
          padding-bottom: 1px;
          flex-shrink: 0;
        }
        .acc-action-link:hover {
          color: ${INK};
          border-bottom-color: ${INK};
        }

        /* ── Two-col ── */
        .acc-two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: clamp(14px, 1.8vw, 20px);
        }

        .acc-details-table {
          width: 100%;
          border-collapse: collapse;
        }
        .acc-details-table tr {
          border-bottom: 1px solid ${RULE};
        }
        .acc-details-table tr:last-child {
          border-bottom: none;
        }
        .acc-detail-label {
          padding: 12px 12px 12px 0;
          font-family: ${SANS};
          font-size: 11px;
          color: ${MUTED};
          width: 42%;
          vertical-align: top;
        }
        .acc-detail-value {
          padding: 12px 0;
          font-family: ${SANS};
          font-size: 12px;
          color: ${INK};
          font-weight: 400;
          text-align: right;
        }

        .acc-address-box {
          border: 1px solid ${RULE};
          padding: 16px 18px;
          background: rgba(255, 255, 255, 0.03);
        }
        .acc-address-label {
          margin: 0 0 12px;
          font-family: ${SANS};
          font-size: 8px;
          letter-spacing: 1.2px;
          color: ${MUTED};
          text-transform: uppercase;
        }
        .acc-address-line {
          margin: 0 0 2px;
          font-family: ${SANS};
          font-size: 12px;
          color: ${INK};
          line-height: 1.65;
        }

        /* ── Orders ── */
        .acc-orders-scroll {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        .acc-orders-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 560px;
        }
        .acc-orders-table th {
          padding: 0 12px 12px 0;
          font-family: ${SANS};
          font-size: 8px;
          font-weight: 600;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: ${MUTED};
          text-align: left;
          border-bottom: 1px solid ${RULE};
          white-space: nowrap;
        }
        .acc-orders-table th:last-child {
          padding-right: 0;
          width: 20px;
        }
        .acc-orders-table td {
          padding: 16px 12px 16px 0;
          font-family: ${SANS};
          font-size: 12px;
          color: ${MUTED_SOFT};
          border-bottom: 1px solid ${RULE};
          white-space: nowrap;
          vertical-align: middle;
        }
        .acc-orders-table tr:last-child td {
          border-bottom: none;
        }
        .acc-order-id {
          color: ${INK} !important;
          font-weight: 500;
        }
        .acc-order-total {
          color: ${INK} !important;
          font-weight: 500;
        }
        .acc-order-chevron {
          padding-right: 0 !important;
          text-align: right;
          color: ${INK};
        }
        .acc-status {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-family: ${SANS};
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.2px;
        }
        .acc-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        /* ── Saved ── */
        .acc-saved {
          margin-top: 8px;
        }
        .acc-saved-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: clamp(14px, 1.8vw, 20px);
        }
        .acc-saved-card {
          display: block;
          text-decoration: none;
          color: inherit;
        }
        .acc-saved-img {
          position: relative;
          width: 100%;
          aspect-ratio: 3 / 4;
          overflow: hidden;
          background: #1a1a1a;
        }
        .acc-saved-name {
          margin: 12px 0 4px;
          font-family: ${SANS};
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.8px;
          color: ${INK};
          text-transform: uppercase;
        }
        .acc-saved-price {
          margin: 0 0 8px;
          font-family: ${SANS};
          font-size: 12px;
          color: ${MUTED_SOFT};
        }
        .acc-saved-swatches {
          display: flex;
          gap: 5px;
        }
        .acc-saved-swatches span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.25);
          display: inline-block;
          flex: 0 0 auto;
        }

        /* ── Tablet: keep two-col details, tighten saved ── */
        @media (max-width: 1023px) and (min-width: 768px) {
          .acc-saved-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 14px;
          }
        }

        /* ── Mobile ── */
        @media (max-width: 767px) {
          .acc-two-col {
            grid-template-columns: 1fr;
          }
          .acc-saved-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 14px;
          }
          .acc-hero {
            height: clamp(220px, 55vw, 320px);
          }
          .acc-welcome-name {
            font-size: clamp(32px, 10vw, 48px);
          }
        }

        @media (max-width: 420px) {
          .acc-saved-grid {
            gap: 12px;
          }
          .acc-card {
            padding: 16px;
          }
        }
      `}</style>
    </>
  );
}
