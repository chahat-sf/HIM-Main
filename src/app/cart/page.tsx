"use client";

import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState } from "react";

const SERIF = '"Cormorant Garamond", Georgia, serif';
const SANS  = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const INK   = "#111";
const MUTED = "#6b6b6b";
const RULE  = "#e4e4e4";
const DARK_BG = "#0d0c0b";

// ─── Types ────────────────────────────────────────────────────────────────────

type CartItem = {
  id: string;
  slug: string;
  name: string;
  size: string;
  color: string;
  price: number;
  qty: number;
  image: string;
  swatches: string[];
};

// ─── Mock cart data ───────────────────────────────────────────────────────────

const INITIAL_CART: CartItem[] = [
  {
    id: "1",
    slug: "textured-thermal-white-7",
    name: "LINEN SHIRT",
    size: "M",
    color: "Ivory",
    price: 4080,
    qty: 1,
    image: "/products/man-image-100.webp",
    swatches: ["#111", "#a3a3a3"],
  },
  {
    id: "2",
    slug: "textured-thermal-white-8",
    name: "WIDE LEG TROUSERS",
    size: "32",
    color: "Oatmeal",
    price: 5840,
    qty: 1,
    image: "/products/man-image-101.webp",
    swatches: ["#a3a3a3", "#7a1420"],
  },
  {
    id: "3",
    slug: "textured-thermal-white-9",
    name: "DENIM JACKET",
    size: "M",
    color: "Indigo",
    price: 6960,
    qty: 1,
    image: "/products/man-image-102.webp",
    swatches: ["#3a5aa8", "#111"],
  },
];

const YOU_MAY_LIKE = [
  { slug: "textured-thermal-white-10", name: "KNIT POLO",          price: "₹ 4,080", image: "/products/man-image-103.webp", swatches: ["#111", "#a3a3a3"] },
  { slug: "textured-thermal-white-11", name: "SIMON JACKET",       price: "₹ 7,880", image: "/products/man-image-104.webp", swatches: ["#111", "#7a1420"] },
  { slug: "textured-thermal-white-12", name: "EVERYDAY TROUSERS",  price: "₹ 5,440", image: "/bestseller/bs-image-2.webp",  swatches: ["#a3a3a3", "#111", "#7a1420"] },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return "₹ " + n.toLocaleString("en-IN");
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function CloseIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M5 5l14 14M19 5L5 19" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <path d="M2 6h8" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <path d="M6 2v8M2 6h8" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12h16M14 6l6 6-6 6" />
    </svg>
  );
}

// ─── Qty stepper ─────────────────────────────────────────────────────────────

function Stepper({ qty, onMinus, onPlus }: { qty: number; onMinus: () => void; onPlus: () => void }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        border: `1px solid ${RULE}`,
        height: "28px",
      }}
    >
      <button
        type="button"
        onClick={onMinus}
        aria-label="Decrease quantity"
        style={{ width: "28px", height: "28px", display: "grid", placeItems: "center", border: "none", background: "transparent", cursor: "pointer", color: INK }}
      >
        <MinusIcon />
      </button>
      <span
        style={{
          minWidth: "28px",
          textAlign: "center",
          fontFamily: SANS,
          fontSize: "11px",
          fontWeight: 600,
          color: INK,
          borderLeft: `1px solid ${RULE}`,
          borderRight: `1px solid ${RULE}`,
          lineHeight: "28px",
        }}
      >
        {qty}
      </span>
      <button
        type="button"
        onClick={onPlus}
        aria-label="Increase quantity"
        style={{ width: "28px", height: "28px", display: "grid", placeItems: "center", border: "none", background: "transparent", cursor: "pointer", color: INK }}
      >
        <PlusIcon />
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>(INITIAL_CART);
  const [promo, setPromo] = useState("");
  const [giftMsg, setGiftMsg] = useState(false);
  const [giftText, setGiftText] = useState("");

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item)
    );
  };

  const removeItem = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const subtotal  = cart.reduce((acc, i) => acc + i.price * i.qty, 0);
  const shipping  = 0;
  const tax       = Math.round(subtotal * 0.07);
  const total     = subtotal + shipping + tax;
  const itemCount = cart.reduce((acc, i) => acc + i.qty, 0);

  return (
    <>
      <Navbar />

      <main style={{ background: "#f7f5f2", minHeight: "100vh" }}>

        {/* ── HERO ── */}
        <div
          style={{
            position: "relative",
            height: "clamp(220px, 26vw, 380px)",
            background: DARK_BG,
            overflow: "hidden",
          }}
        >
          <Image
            src="/products/man-image-104.webp"
            alt=""
            fill
            priority
            quality={85}
            sizes="100vw"
            className="object-cover"
            style={{ objectPosition: "center 25%", opacity: 0.4 }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.7) 100%)",
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
                margin: "0 0 8px",
                fontFamily: SANS,
                fontSize: "9px",
                fontWeight: 700,
                letterSpacing: "2px",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.5)",
              }}
            >
              ENTERING BAG
            </p>
            <h1
              style={{
                margin: 0,
                fontFamily: SERIF,
                fontSize: "clamp(40px, 7vw, 92px)",
                fontWeight: 300,
                letterSpacing: "-1px",
                textTransform: "uppercase",
                color: "#fff",
                lineHeight: 0.9,
              }}
            >
              MY CART
            </h1>
            <p
              style={{
                margin: "12px 0 0",
                fontFamily: SANS,
                fontSize: "10px",
                letterSpacing: "1px",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.5)",
              }}
            >
              A CONSIDERED SELECTION,{"\n"}READY FOR CHECKOUT.
            </p>
          </div>
        </div>

        {/* ── BODY ── */}
        <div
          style={{
            maxWidth: "1080px",
            margin: "0 auto",
            padding: "44px clamp(16px, 4vw, 40px) 80px",
          }}
        >
          {cart.length === 0 ? (
            /* Empty state */
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <p style={{ fontFamily: SERIF, fontSize: "28px", color: INK, marginBottom: "16px" }}>Your bag is empty.</p>
              <Link
                href="/collection"
                style={{
                  display: "inline-block",
                  height: "44px",
                  padding: "0 32px",
                  lineHeight: "44px",
                  background: INK,
                  color: "#fff",
                  fontFamily: SANS,
                  fontSize: "10px",
                  letterSpacing: "1.5px",
                  textDecoration: "none",
                  textTransform: "uppercase",
                }}
              >
                CONTINUE SHOPPING
              </Link>
            </div>
          ) : (
            <div className="cart-layout">

              {/* ── LEFT: CART ITEMS ── */}
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginBottom: "20px",
                  }}
                >
                  <p style={{ margin: 0, fontFamily: SANS, fontSize: "9px", fontWeight: 700, letterSpacing: "1.6px", textTransform: "uppercase", color: INK }}>
                    CART ITEMS
                  </p>
                  <p style={{ margin: 0, fontFamily: SANS, fontSize: "9px", color: MUTED, letterSpacing: "0.5px" }}>
                    {itemCount} {itemCount === 1 ? "ITEM" : "ITEMS"}
                  </p>
                </div>

                <div style={{ background: "#fff", border: `1px solid ${RULE}` }}>
                  {cart.map((item, idx) => (
                    <div
                      key={item.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "72px 1fr auto",
                        gap: "16px",
                        alignItems: "start",
                        padding: "20px 20px",
                        borderBottom: idx < cart.length - 1 ? `1px solid ${RULE}` : "none",
                      }}
                    >
                      {/* Thumbnail */}
                      <Link href={`/collection/${item.slug}`} style={{ display: "block", flexShrink: 0 }}>
                        <div style={{ position: "relative", width: "72px", height: "88px", overflow: "hidden", background: "#e9e6e1" }}>
                          <Image src={item.image} alt={item.name} fill quality={70} sizes="80px" className="object-cover object-center" />
                        </div>
                      </Link>

                      {/* Details */}
                      <div>
                        <Link href={`/collection/${item.slug}`} style={{ textDecoration: "none" }}>
                          <p style={{ margin: "0 0 4px", fontFamily: SANS, fontSize: "12px", fontWeight: 700, letterSpacing: "0.5px", color: INK }}>
                            {item.name}
                          </p>
                        </Link>
                        <p style={{ margin: "0 0 10px", fontFamily: SANS, fontSize: "10px", color: MUTED }}>
                          Size {item.size} &nbsp;|&nbsp; {item.color}
                        </p>
                        <div style={{ display: "flex", gap: "5px", marginBottom: "14px" }}>
                          {item.swatches.map((c, i) => (
                            <span key={i} style={{ width: "9px", height: "9px", borderRadius: "50%", background: c, border: "1px solid rgba(0,0,0,0.12)" }} />
                          ))}
                        </div>
                        <Stepper
                          qty={item.qty}
                          onMinus={() => updateQty(item.id, -1)}
                          onPlus={() => updateQty(item.id, 1)}
                        />
                      </div>

                      {/* Price + Remove */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "10px" }}>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          aria-label={`Remove ${item.name}`}
                          style={{ display: "grid", placeItems: "center", width: "20px", height: "20px", border: "none", background: "transparent", cursor: "pointer", color: MUTED }}
                        >
                          <CloseIcon />
                        </button>
                        <p style={{ margin: 0, fontFamily: SANS, fontSize: "12px", fontWeight: 600, color: INK, whiteSpace: "nowrap" }}>
                          {fmt(item.price * item.qty)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Gift message */}
                <div style={{ marginTop: "12px", background: "#fff", border: `1px solid ${RULE}` }}>
                  <button
                    type="button"
                    onClick={() => setGiftMsg((v) => !v)}
                    style={{
                      width: "100%",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "16px 20px",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      fontFamily: SANS,
                      fontSize: "10px",
                      letterSpacing: "0.8px",
                      color: MUTED,
                    }}
                  >
                    <span>🎁 Add a note or gift message (optional)</span>
                    <span style={{ fontSize: "14px", lineHeight: 1 }}>{giftMsg ? "−" : "+"}</span>
                  </button>
                  {giftMsg && (
                    <div style={{ padding: "0 20px 16px" }}>
                      <textarea
                        value={giftText}
                        onChange={(e) => setGiftText(e.target.value)}
                        placeholder="Write your message here…"
                        rows={3}
                        style={{
                          width: "100%",
                          resize: "vertical",
                          border: `1px solid ${RULE}`,
                          outline: "none",
                          padding: "10px 12px",
                          fontFamily: SANS,
                          fontSize: "12px",
                          color: INK,
                          background: "#fafafa",
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* ── RIGHT: ORDER SUMMARY ── */}
              <div>
                <div style={{ background: "#fff", border: `1px solid ${RULE}`, padding: "24px 24px" }}>
                  <p style={{ margin: "0 0 20px", fontFamily: SANS, fontSize: "9px", fontWeight: 700, letterSpacing: "1.6px", textTransform: "uppercase", color: INK }}>
                    ORDER SUMMARY
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                    {[
                      { label: `Subtotal (${itemCount} items)`, value: fmt(subtotal) },
                      { label: "Shipping",                       value: shipping === 0 ? "Free" : fmt(shipping) },
                      { label: "Estimated Tax ℹ",               value: fmt(tax) },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <span style={{ fontFamily: SANS, fontSize: "11px", color: MUTED }}>{label}</span>
                        <span style={{ fontFamily: SANS, fontSize: "11px", color: INK, fontWeight: value === "Free" ? 600 : 400 }}>{value}</span>
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      paddingTop: "16px",
                      borderTop: `1px solid ${RULE}`,
                      marginBottom: "24px",
                    }}
                  >
                    <span style={{ fontFamily: SANS, fontSize: "13px", fontWeight: 700, color: INK }}>Total</span>
                    <span style={{ fontFamily: SERIF, fontSize: "20px", fontWeight: 600, color: INK }}>{fmt(total)}</span>
                  </div>

                  {/* Promo */}
                  <p style={{ margin: "0 0 8px", fontFamily: SANS, fontSize: "9px", letterSpacing: "1.2px", textTransform: "uppercase", color: MUTED }}>
                    PROMO CODE
                  </p>
                  <div style={{ display: "flex", gap: "0", marginBottom: "20px" }}>
                    <input
                      type="text"
                      value={promo}
                      onChange={(e) => setPromo(e.target.value)}
                      placeholder="Enter code"
                      style={{
                        flex: 1,
                        height: "38px",
                        padding: "0 12px",
                        border: `1px solid ${RULE}`,
                        borderRight: "none",
                        outline: "none",
                        fontFamily: SANS,
                        fontSize: "11px",
                        color: INK,
                        background: "#fafafa",
                      }}
                    />
                    <button
                      type="button"
                      style={{
                        height: "38px",
                        padding: "0 16px",
                        border: `1px solid ${INK}`,
                        background: INK,
                        color: "#fff",
                        fontFamily: SANS,
                        fontSize: "9px",
                        fontWeight: 700,
                        letterSpacing: "1px",
                        cursor: "pointer",
                        textTransform: "uppercase",
                      }}
                    >
                      APPLY
                    </button>
                  </div>

                  {/* Checkout CTA */}
                  <Link
                    href="#"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "10px",
                      width: "100%",
                      height: "48px",
                      background: "#3a3a3a",
                      color: "#fff",
                      fontFamily: SANS,
                      fontSize: "10px",
                      fontWeight: 700,
                      letterSpacing: "1.5px",
                      textDecoration: "none",
                      textTransform: "uppercase",
                      marginBottom: "10px",
                      transition: "background 200ms ease",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#111"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "#3a3a3a"; }}
                  >
                    PROCEED TO CHECKOUT <ArrowIcon />
                  </Link>
                  <Link
                    href="/collection"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "100%",
                      height: "44px",
                      border: `1px solid ${RULE}`,
                      background: "#fff",
                      color: INK,
                      fontFamily: SANS,
                      fontSize: "10px",
                      letterSpacing: "1.2px",
                      textDecoration: "none",
                      textTransform: "uppercase",
                      transition: "border-color 200ms",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = INK; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = RULE; }}
                  >
                    CONTINUE SHOPPING
                  </Link>

                  <p style={{ margin: "14px 0 0", fontFamily: SANS, fontSize: "9px", color: MUTED, textAlign: "center", letterSpacing: "0.3px" }}>
                    🔒 Complimentary shipping on all prepaid orders
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* ── YOU MAY ALSO LIKE ── */}
          <div style={{ marginTop: "64px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "20px" }}>
              <p style={{ margin: 0, fontFamily: SANS, fontSize: "9px", fontWeight: 700, letterSpacing: "1.6px", textTransform: "uppercase", color: INK }}>
                YOU MAY ALSO LIKE
              </p>
              <Link href="/collection" style={{ fontFamily: SANS, fontSize: "9px", letterSpacing: "1px", color: MUTED, textDecoration: "none", borderBottom: `1px solid ${MUTED}`, paddingBottom: "1px" }}>
                VIEW ALL
              </Link>
            </div>
            <div className="cart-recs-grid">
              {YOU_MAY_LIKE.map((item) => (
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
                    {/* Plus button */}
                    <span
                      style={{
                        position: "absolute",
                        right: "10px",
                        bottom: "10px",
                        width: "24px",
                        height: "24px",
                        display: "grid",
                        placeItems: "center",
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.9)",
                        color: INK,
                        fontSize: "16px",
                        lineHeight: 1,
                      }}
                    >
                      +
                    </span>
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
        .cart-layout {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 28px;
          align-items: start;
        }
        .cart-recs-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        @media (max-width: 900px) {
          .cart-layout {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 768px) {
          .cart-recs-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 14px;
          }
        }
      `}</style>
    </>
  );
}
