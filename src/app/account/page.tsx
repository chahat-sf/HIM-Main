"use client";

import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const SERIF = '"Cormorant Garamond", Georgia, serif';
const SANS  = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const INK   = "#111";
const MUTED = "#6b6b6b";
const RULE  = "#e4e4e4";
const DARK_BG = "#0d0c0b";

// ─── Mock data ────────────────────────────────────────────────────────────────

const USER = {
  name: "Aarav.",
  tagline: "A more considered wardrobe,\nfor wherever the day takes you.",
  details: {
    fullName:   "Aarav Sharma",
    email:      "aarav.sharma@gmail.com",
    phone:      "+91 98765 43210",
    dob:        "14 March 1995",
  },
  address: {
    label: "DEFAULT SHIPPING ADDRESS",
    lines: ["Kaira Sharma", "12, Park Grove Apartments", "Bandra West", "Mumbai, Maharashtra 400050", "India"],
  },
};

const ORDERS = [
  { id: "#HIM714571", date: "12 Jun 2024", items: 2, status: "Delivered",  statusColor: "#2e7d32", total: "₹ 14,913" },
  { id: "#HIM717834", date: "24 May 2024", items: 3, status: "Shipped",    statusColor: "#1565c0", total: "₹  8,960" },
  { id: "#HIM712209", date: "18 Apr 2024", items: 1, status: "Processing", statusColor: "#e65100", total: "₹  6,960" },
];

const SAVED = [
  { slug: "textured-thermal-white-7",  name: "LINEN SHIRT",         price: "₹ 4,080", image: "/products/man-image-100.webp",  swatches: ["#111", "#a3a3a3"] },
  { slug: "textured-thermal-white-8",  name: "WIDE LEG TROUSERS",   price: "₹ 5,840", image: "/products/man-image-101.webp",  swatches: ["#a3a3a3", "#7a1420"] },
  { slug: "textured-thermal-white-9",  name: "DENIM JACKET",        price: "₹ 6,960", image: "/products/man-image-102.webp",  swatches: ["#3a5aa8", "#111", "#a3a3a3"] },
];

// ─── Section card wrapper ─────────────────────────────────────────────────────

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        border: `1px solid ${RULE}`,
        padding: "24px 28px",
        background: "#fff",
      }}
    >
      {children}
    </div>
  );
}

function SectionHeader({ title, action, href }: { title: string; action?: string; href?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "18px" }}>
      <p style={{ margin: 0, fontFamily: SANS, fontSize: "9px", fontWeight: 700, letterSpacing: "1.6px", textTransform: "uppercase", color: INK }}>
        {title}
      </p>
      {action && (
        <Link
          href={href ?? "#"}
          style={{ fontFamily: SANS, fontSize: "9px", letterSpacing: "1px", color: MUTED, textDecoration: "none", borderBottom: `1px solid ${MUTED}`, paddingBottom: "1px" }}
        >
          {action}
        </Link>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AccountPage() {
  return (
    <>
      <Navbar />

      <main style={{ background: "#f7f5f2", minHeight: "100vh" }}>

        {/* ── HERO ── */}
        <div
          style={{
            position: "relative",
            height: "clamp(280px, 32vw, 460px)",
            background: DARK_BG,
            overflow: "hidden",
          }}
        >
          <Image
            src="/products/man-image-103.webp"
            alt=""
            fill
            priority
            quality={85}
            sizes="100vw"
            className="object-cover"
            style={{ objectPosition: "center 20%", opacity: 0.45 }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.65) 100%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              padding: "clamp(24px, 5vw, 60px)",
            }}
          >
            <p
              style={{
                margin: "0 0 10px",
                fontFamily: SANS,
                fontSize: "9px",
                fontWeight: 700,
                letterSpacing: "2px",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.6)",
              }}
            >
              MY ACCOUNT
            </p>
            <h1
              style={{
                margin: 0,
                fontFamily: SERIF,
                fontSize: "clamp(42px, 7vw, 96px)",
                fontWeight: 300,
                letterSpacing: "-1px",
                textTransform: "uppercase",
                color: "#fff",
                lineHeight: 0.9,
              }}
            >
              MY ACCOUNT
            </h1>
            <p
              style={{
                margin: "14px 0 0",
                fontFamily: SANS,
                fontSize: "10px",
                letterSpacing: "1px",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.55)",
                whiteSpace: "pre-line",
              }}
            >
              A MORE CONSIDERED WARDROBE{"\n"}BEGINS HERE.
            </p>
          </div>
        </div>

        {/* ── WELCOME BANNER ── */}
        <div
          style={{
            background: "#1a1815",
            padding: "28px clamp(20px, 5vw, 60px)",
          }}
        >
          <p style={{ margin: "0 0 6px", fontFamily: SANS, fontSize: "9px", letterSpacing: "1.5px", textTransform: "uppercase", color: "rgba(255,255,255,0.45)" }}>
            WELCOME BACK
          </p>
          <h2 style={{ margin: "0 0 6px", fontFamily: SERIF, fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 400, color: "#f4ecd8", letterSpacing: "0.01em" }}>
            {USER.name}
          </h2>
          <p style={{ margin: 0, fontFamily: SANS, fontSize: "11px", color: "rgba(255,255,255,0.5)", lineHeight: 1.6, whiteSpace: "pre-line" }}>
            {USER.tagline}
          </p>
        </div>

        {/* ── BODY ── */}
        <div
          style={{
            maxWidth: "980px",
            margin: "0 auto",
            padding: "40px clamp(16px, 4vw, 40px) 80px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >

          {/* Personal + Address row */}
          <div className="acc-two-col">
            {/* Personal Details */}
            <Card>
              <SectionHeader title="Personal Details" action="EDIT" href="#" />
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  {Object.entries({
                    "Full Name":    USER.details.fullName,
                    "Email":        USER.details.email,
                    "Phone":        USER.details.phone,
                    "Date of Birth": USER.details.dob,
                  }).map(([label, value]) => (
                    <tr key={label} style={{ borderBottom: `1px solid ${RULE}` }}>
                      <td style={{ padding: "11px 0", fontFamily: SANS, fontSize: "10px", color: MUTED, width: "42%" }}>{label}</td>
                      <td style={{ padding: "11px 0", fontFamily: SANS, fontSize: "11px", color: INK, fontWeight: 500 }}>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            {/* Address */}
            <Card>
              <SectionHeader title="Addresses" action="MANAGE" href="#" />
              <p style={{ margin: "0 0 12px", fontFamily: SANS, fontSize: "9px", letterSpacing: "1px", color: MUTED, textTransform: "uppercase" }}>
                {USER.address.label}
              </p>
              {USER.address.lines.map((line) => (
                <p key={line} style={{ margin: "0 0 3px", fontFamily: SANS, fontSize: "12px", color: INK, lineHeight: 1.7 }}>
                  {line}
                </p>
              ))}
            </Card>
          </div>

          {/* Order History */}
          <Card>
            <SectionHeader title="Order History" action="VIEW ALL" href="#" />
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "520px" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${RULE}` }}>
                    {["ORDER #", "DATE", "ITEMS", "STATUS", "TOTAL"].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "0 0 10px",
                          fontFamily: SANS,
                          fontSize: "8px",
                          fontWeight: 700,
                          letterSpacing: "1.2px",
                          textTransform: "uppercase",
                          color: MUTED,
                          textAlign: "left",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ORDERS.map((order) => (
                    <tr key={order.id} style={{ borderBottom: `1px solid ${RULE}` }}>
                      <td style={{ padding: "14px 0", fontFamily: SANS, fontSize: "11px", fontWeight: 600, color: INK }}>{order.id}</td>
                      <td style={{ padding: "14px 0", fontFamily: SANS, fontSize: "11px", color: MUTED }}>{order.date}</td>
                      <td style={{ padding: "14px 0", fontFamily: SANS, fontSize: "11px", color: MUTED }}>{order.items} items</td>
                      <td style={{ padding: "14px 0" }}>
                        <span
                          style={{
                            fontFamily: SANS,
                            fontSize: "10px",
                            fontWeight: 600,
                            color: order.statusColor,
                            letterSpacing: "0.5px",
                          }}
                        >
                          ● {order.status}
                        </span>
                      </td>
                      <td style={{ padding: "14px 0", fontFamily: SANS, fontSize: "12px", fontWeight: 600, color: INK }}>{order.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Saved Items */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "16px" }}>
              <p style={{ margin: 0, fontFamily: SANS, fontSize: "9px", fontWeight: 700, letterSpacing: "1.6px", textTransform: "uppercase", color: INK }}>
                SAVED ITEMS
              </p>
              <Link href="/collection" style={{ fontFamily: SANS, fontSize: "9px", letterSpacing: "1px", color: MUTED, textDecoration: "none", borderBottom: `1px solid ${MUTED}`, paddingBottom: "1px" }}>
                VIEW ALL
              </Link>
            </div>
            <div className="acc-saved-grid">
              {SAVED.map((item) => (
                <Link key={item.slug} href={`/collection/${item.slug}`} style={{ display: "block", textDecoration: "none", color: "inherit" }}>
                  <div style={{ position: "relative", width: "100%", aspectRatio: "3/4", overflow: "hidden", background: "#e9e6e1" }}>
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      quality={80}
                      sizes="(max-width: 768px) 50vw, 28vw"
                      className="object-cover object-center"
                    />
                  </div>
                  <p style={{ margin: "10px 0 3px", fontFamily: SANS, fontSize: "11px", fontWeight: 600, letterSpacing: "0.5px", color: INK }}>
                    {item.name}
                  </p>
                  <p style={{ margin: "0 0 7px", fontFamily: SANS, fontSize: "11px", color: MUTED }}>{item.price}</p>
                  <div style={{ display: "flex", gap: "5px" }}>
                    {item.swatches.map((c, i) => (
                      <span key={i} style={{ width: "9px", height: "9px", borderRadius: "50%", background: c, border: "1px solid rgba(0,0,0,0.12)" }} />
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </main>

      <Footer />

      <style jsx global>{`
        .acc-two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .acc-saved-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        @media (max-width: 768px) {
          .acc-two-col {
            grid-template-columns: 1fr;
          }
          .acc-saved-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 14px;
          }
        }
      `}</style>
    </>
  );
}
