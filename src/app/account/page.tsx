
"use client";

import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const SERIF = '"Cormorant Garamond", Georgia, serif';
const SANS = '"Helvetica Neue", Helvetica, Arial, sans-serif';

const USER = {
  name: "Aarav.",
  tagline: "A more considered wardrobe,\nfor wherever the day takes you.",
  details: {
    fullName: "Aarav Sharma",
    email: "aarav.sharma@gmail.com",
    phone: "+91 98765 43210",
    dob: "14 March 1995",
  },
  address: {
    label: "DEFAULT SHIPPING ADDRESS",
    lines: [
      "Kaira Sharma",
      "12, Park Grove Apartments",
      "Bandra West",
      "Mumbai, Maharashtra 400050",
      "India",
    ],
  },
};

const ORDERS = [
  {
    id: "#HIM714571",
    date: "12 Jun 2024",
    items: 2,
    status: "Delivered",
    statusColor: "#78c99a",
    total: "₹ 14,913",
  },
  {
    id: "#HIM717834",
    date: "24 May 2024",
    items: 3,
    status: "Shipped",
    statusColor: "#91b9f5",
    total: "₹ 8,960",
  },
  {
    id: "#HIM712209",
    date: "18 Apr 2024",
    items: 1,
    status: "Processing",
    statusColor: "#e8b36a",
    total: "₹ 6,960",
  },
];

const SAVED = [
  {
    slug: "textured-thermal-white-7",
    name: "LINEN SHIRT",
    price: "₹ 4,080",
    image: "/products/man-image-100.webp",
    swatches: ["#f4ecd8", "#a3a3a3", "#111111"],
  },
  {
    slug: "textured-thermal-white-8",
    name: "WIDE LEG TROUSERS",
    price: "₹ 5,840",
    image: "/products/man-image-101.webp",
    swatches: ["#a3a3a3", "#7a1420", "#111111"],
  },
  {
    slug: "textured-thermal-white-9",
    name: "DENIM JACKET",
    price: "₹ 6,960",
    image: "/products/man-image-102.webp",
    swatches: ["#f4ecd8", "#3a5aa8", "#111111"],
  },
];

const sectionLabel: React.CSSProperties = {
  margin: 0,
  fontFamily: SANS,
  fontSize: "8px",
  fontWeight: 600,
  letterSpacing: "1.15px",
  textTransform: "uppercase",
  color: "#e8dfd0",
};

function Card({ children }: { children: React.ReactNode }) {
  return <section className="account-card">{children}</section>;
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
    <div className="account-section-header">
      <p style={sectionLabel}>{title}</p>
      {action && (
        <Link href={href ?? "#"} className="account-action">
          {action}
        </Link>
      )}
    </div>
  );
}

export default function AccountPage() {
  return (
    <>
      <Navbar />

      <main className="account-page">
        {/* HERO */}
        <section className="account-hero">
          <Image
            src="/homepage/navbar-image.webp"
            alt=""
            fill
            priority
            quality={85}
            sizes="100vw"
            className="account-hero-image"
          />

          <div className="account-hero-overlay" />

          <div className="account-hero-content">
            <p className="account-eyebrow">MY ACCOUNT</p>

            <h1>MY ACCOUNT</h1>

            <p className="account-hero-caption">
              A MORE CONSIDERED WARDROBE
              <br />
              BEGINS HERE.
            </p>
          </div>
        </section>

        {/* WELCOME BANNER */}
        <section className="account-welcome">
          <Image
            src="/homepage/3-man-image.webp"
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 980px"
            className="account-welcome-image"
          />

          <div className="account-welcome-overlay" />

          <div className="account-welcome-content">
            <p className="account-welcome-label">WELCOME BACK</p>

            <h2>{USER.name}</h2>

            <p className="account-welcome-description">
              {USER.tagline}
            </p>
          </div>
        </section>

        {/* DASHBOARD */}
        <div className="account-dashboard">
          {/* PERSONAL DETAILS + ADDRESS */}
          <div className="account-two-col">
            <Card>
              <SectionHeader
                title="Personal Details"
                action="EDIT"
                href="#"
              />

              <table className="account-details-table">
                <tbody>
                  {Object.entries({
                    "Full Name": USER.details.fullName,
                    Email: USER.details.email,
                    Phone: USER.details.phone,
                    "Date of Birth": USER.details.dob,
                  }).map(([label, value]) => (
                    <tr key={label}>
                      <td>{label}</td>
                      <td>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            <Card>
              <SectionHeader
                title="Addresses"
                action="MANAGE"
                href="#"
              />

              <div className="account-address">
                <p className="account-address-label">
                  {USER.address.label}
                </p>

                {USER.address.lines.map((line) => (
                  <p key={line} className="account-address-line">
                    {line}
                  </p>
                ))}
              </div>
            </Card>
          </div>

          {/* ORDER HISTORY */}
          <Card>
            <SectionHeader
              title="Order History"
              action="VIEW ALL"
              href="#"
            />

            <div className="account-table-scroll">
              <table className="account-orders-table">
                <thead>
                  <tr>
                    {["ORDER #", "DATE", "ITEMS", "STATUS", "TOTAL"].map(
                      (heading) => (
                        <th key={heading}>{heading}</th>
                      )
                    )}
                    <th aria-label="View order" />
                  </tr>
                </thead>

                <tbody>
                  {ORDERS.map((order) => (
                    <tr key={order.id}>
                      <td className="account-order-id">{order.id}</td>
                      <td>{order.date}</td>
                      <td>{order.items} items</td>
                      <td>
                        <span
                          className="account-order-status"
                          style={{ color: order.statusColor }}
                        >
                          <span>●</span> {order.status}
                        </span>
                      </td>
                      <td className="account-order-total">
                        {order.total}
                      </td>
                      <td className="account-order-arrow">›</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* SAVED ITEMS */}
          <section className="account-saved">
            <SectionHeader
              title="Saved Items"
              action="VIEW ALL"
              href="/collection"
            />

            <div className="account-saved-grid">
              {SAVED.map((item) => (
                <Link
                  key={item.slug}
                  href={`/collection/${item.slug}`}
                  className="account-product"
                >
                  <div className="account-product-image">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      quality={80}
                      sizes="(max-width: 480px) 32vw, 300px"
                      className="object-cover object-center"
                    />

                    <span
                      className="account-product-heart"
                      aria-hidden="true"
                    >
                      ♡
                    </span>
                  </div>

                  <p className="account-product-name">{item.name}</p>
                  <p className="account-product-price">{item.price}</p>

                  <div className="account-product-swatches">
                    {item.swatches.map((color, index) => (
                      <span
                        key={`${color}-${index}`}
                        style={{ backgroundColor: color }}
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
        .account-page {
          --account-bg: #0d0805;
          --account-card: #100c09;
          --account-border: #65584c;
          --account-text: #eee6da;
          --account-muted: #a79b8d;

          min-height: 100vh;
          background: var(--account-bg);
          color: var(--account-text);
          font-family: ${SANS};
        }

        .account-page * {
          box-sizing: border-box;
        }

        /* HERO */

        .account-hero {
  position: relative;
  height: clamp(170px, 22vw, 280px);
  min-height: 170px;
  overflow: hidden;
  background: #17110c;
  margin-bottom: 35px;
}

        .account-hero-image {
          object-fit: cover;
          object-position: center 35%;
          opacity: 0.57;
        }

        .account-hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            rgba(8, 7, 6, 0.88) 0%,
            rgba(8, 7, 6, 0.53) 55%,
            rgba(8, 7, 6, 0.38) 100%
          );
        }

        .account-hero-content {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          align-items: flex-start;
          padding: 22px max(24px, calc((100% - 980px) / 2));
        }

        .account-eyebrow {
          margin: 0 0 8px;
          font-size: 7px;
          font-weight: 500;
          letter-spacing: 1.1px;
          color: #d0c3b3;
        }

        .account-hero-content h1 {
          margin: 0;
          font-family: ${SERIF};
          font-size: clamp(30px, 4.2vw, 58px);
          font-weight: 400;
          line-height: 0.95;
          letter-spacing: -0.5px;
          color: #f8f1e8;
        }

        .account-hero-caption {
          margin: 9px 0 0;
          font-size: 5.5px;
          line-height: 1.7;
          letter-spacing: 0.65px;
          color: #b9aa99;
        }

        /* WELCOME */

        .account-welcome {
          position: relative;
          isolation: isolate;
          overflow: hidden;
          min-height: 105px;
          background: #1a120d;
        }

        .account-welcome-image {
          z-index: -2;
          object-fit: cover;
          object-position: center 40%;
          opacity: 0.3;
        }

        .account-welcome-overlay {
          position: absolute;
          z-index: -1;
          inset: 0;
          background: linear-gradient(
            90deg,
            rgba(14, 9, 6, 0.95),
            rgba(14, 9, 6, 0.64)
          );
        }

        .account-welcome-content {
          position: relative;
          max-width: 980px;
          margin: 0 auto;
          padding: 15px 24px 16px;
        }

        .account-welcome-label {
          margin: 0 0 6px;
          color: #a99a88;
          font-size: 6px;
          letter-spacing: 1px;
        }

        .account-welcome-content h2 {
          margin: 0 0 5px;
          font-family: ${SERIF};
          font-size: 25px;
          line-height: 1;
          font-weight: 400;
          color: #f4ecd8;
        }

        .account-welcome-description {
          margin: 0;
          color: #c0b4a6;
          font-size: 7px;
          line-height: 1.6;
          white-space: pre-line;
        }

        /* DASHBOARD LAYOUT */

        .account-dashboard {
          width: min(100% - 48px, 980px);
          margin: 0 auto;
          padding: 22px 0 55px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .account-two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .account-card {
          min-width: 0;
          padding: 12px 13px;
          border: 1px solid var(--account-border);
          background: var(--account-card);
        }

        .account-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 10px;
        }

        .account-action {
          flex-shrink: 0;
          font-family: ${SANS};
          font-size: 6px;
          letter-spacing: 0.65px;
          color: #b5a795;
          text-decoration: none;
          border-bottom: 1px solid #746657;
          padding-bottom: 2px;
        }

        /* PERSONAL DETAILS */

        .account-details-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }

        .account-details-table tr {
          border-bottom: 1px solid #2c241d;
        }

        .account-details-table tr:last-child {
          border-bottom: none;
        }

        .account-details-table td {
          padding: 8px 0;
          font-size: 7px;
          line-height: 1.45;
          overflow-wrap: anywhere;
        }

        .account-details-table td:first-child {
          width: 43%;
          color: #a99d8f;
        }

        .account-details-table td:last-child {
          color: #e7ded2;
          font-weight: 400;
        }

        /* ADDRESS */

        .account-address {
          padding: 10px;
          background: #17110d;
        }

        .account-address-label {
          margin: 0 0 7px;
          color: #aa9b89;
          font-size: 6px;
          letter-spacing: 0.65px;
          line-height: 1.5;
        }

        .account-address-line {
          margin: 0 0 3px;
          color: #e0d5c7;
          font-size: 7px;
          line-height: 1.5;
        }

        /* ORDER HISTORY */

        .account-table-scroll {
          width: 100%;
          overflow-x: auto;
          scrollbar-width: thin;
          scrollbar-color: #625244 #100c09;
        }

        .account-orders-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .account-orders-table th {
          padding: 4px 5px 8px;
          font-size: 5.5px;
          font-weight: 500;
          letter-spacing: 0.65px;
          color: #9e9182;
          white-space: nowrap;
        }

        .account-orders-table td {
          padding: 10px 5px;
          border-top: 1px solid #2c241d;
          color: #c9bdae;
          font-size: 7px;
          white-space: nowrap;
        }

        .account-orders-table th:first-child,
        .account-orders-table td:first-child {
          padding-left: 0;
        }

        .account-orders-table th:last-child,
        .account-orders-table td:last-child {
          padding-right: 0;
        }

        .account-orders-table .account-order-id {
          color: #e8dfd3;
          font-weight: 500;
        }

        .account-orders-table .account-order-total {
          color: #eee5d9;
        }

        .account-order-status {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          font-size: 6px;
        }

        .account-order-status span {
          font-size: 5px;
        }

        .account-order-arrow {
          color: #9f8e7c !important;
          font-size: 13px !important;
          text-align: right;
        }

        /* SAVED ITEMS */

        .account-saved {
          min-width: 0;
        }

        .account-saved > .account-section-header {
          margin: 0 0 9px;
          padding: 0 10px;
        }

        .account-saved-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
        }

        .account-product {
          display: block;
          min-width: 0;
          color: inherit;
          text-decoration: none;
        }

        .account-product-image {
          position: relative;
          width: 100%;
          aspect-ratio: 1.48 / 1;
          overflow: hidden;
          background: #1b1510;
        }

        .account-product-image img {
          transition: none !important;
          transform: none !important;
        }

        .account-product-heart {
          position: absolute;
          right: 5px;
          bottom: 5px;
          display: grid;
          width: 15px;
          height: 15px;
          place-items: center;
          border-radius: 50%;
          background: rgba(15, 12, 10, 0.75);
          color: #f2e8da;
          font-size: 12px;
          line-height: 1;
        }

        .account-product-name {
          margin: 6px 0 2px;
          color: #e7ddd0;
          font-size: 6px;
          font-weight: 500;
          letter-spacing: 0.35px;
        }

        .account-product-price {
          margin: 0 0 5px;
          color: #b6a999;
          font-size: 7px;
        }

        .account-product-swatches {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .account-product-swatches span {
          display: block;
          width: 6px;
          height: 6px;
          border: 1px solid rgba(230, 220, 205, 0.3);
          border-radius: 50%;
        }

        /* RESPONSIVE */

        @media (min-width: 1200px) {
          .account-dashboard {
            width: min(100% - 56px, 980px);
            padding-top: 22px;
            gap: 10px;
          }

          .account-card {
            padding: 14px 16px;
          }

          .account-two-col {
            gap: 12px;
          }

          .account-saved-grid {
            gap: 10px;
          }

          .account-product-name {
            font-size: 7px;
          }

          .account-product-price {
            font-size: 8px;
          }
        }

        @media (max-width: 480px) {
          .account-hero {
            height: 148px;
          }

          .account-hero-content {
            padding: 18px 24px;
          }

          .account-hero-content h1 {
            font-size: 30px;
          }

          .account-welcome {
            min-height: 80px;
          }

          .account-welcome-content {
            padding: 12px 24px;
          }

          .account-welcome-content h2 {
            font-size: 21px;
          }

          .account-dashboard {
            width: calc(100% - 56px);
            padding-top: 10px;
            padding-bottom: 32px;
            gap: 9px;
          }

          .account-two-col {
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
            gap: 9px;
          }

          .account-card {
            padding: 10px 9px;
          }

          .account-section-header {
            gap: 4px;
            margin-bottom: 8px;
          }

          .account-section-header > p {
            font-size: 6px !important;
            letter-spacing: 0.65px !important;
          }

          .account-action {
            font-size: 5px;
            letter-spacing: 0.3px;
          }

          .account-details-table td {
            padding: 7px 0;
            font-size: 6px;
          }

          .account-address {
            padding: 7px;
          }

          .account-address-label {
            font-size: 5px;
          }

          .account-address-line {
            font-size: 6px;
            line-height: 1.5;
            overflow-wrap: anywhere;
          }

          .account-orders-table {
            min-width: 0;
          }

          .account-orders-table th {
            padding: 4px 3px 7px;
            font-size: 4.5px;
            letter-spacing: 0.2px;
          }

          .account-orders-table td {
            padding: 9px 3px;
            font-size: 5.5px;
          }

          .account-order-status {
            gap: 2px;
            font-size: 5px;
          }

          .account-orders-table .account-order-arrow {
            font-size: 10px !important;
          }

          .account-saved > .account-section-header {
            padding: 0 10px;
            margin-bottom: 7px;
          }

          .account-saved-grid {
            gap: 7px;
          }

          .account-product-image {
            aspect-ratio: 1.48 / 1;
          }

          .account-product-name {
            font-size: 5px;
            letter-spacing: 0.15px;
          }

          .account-product-price {
            font-size: 6px;
          }

          .account-product-swatches {
            gap: 3px;
          }

          .account-product-swatches span {
            width: 5px;
            height: 5px;
          }
        }

        @media (max-width: 340px) {
          .account-dashboard {
            width: calc(100% - 28px);
          }

          .account-two-col {
            grid-template-columns: 1fr;
          }

          .account-orders-table th,
          .account-orders-table td {
            font-size: 5px;
          }
        }
      `}</style>
    </>
  );
}
