"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Minus, Plus, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RouteLoading from "@/components/RouteLoading";
import { useEffect, useState } from "react";
import { useCart } from "@/hooks/useCart";
import type { CartItem } from "@/lib/cart-types";
import type { CatalogProduct } from "@/lib/catalog-types";
import { toCardImage } from "@/lib/card-image";
import {
  resolveCartColor,
  selectedColorSwatches,
} from "@/lib/color-swatch";
import { readLocalCart, writeLocalCart } from "@/lib/cart-local";
import { track } from "@/lib/analytics";

const SERIF = '"Cormorant Garamond", Georgia, serif';
const SANS = '"Helvetica Neue", Helvetica, Arial, sans-serif';

const BG = "#0a0a0a";
const INK = "#ffffff";
const MUTED = "rgba(255,255,255,0.45)";
const MUTED_SOFT = "rgba(255,255,255,0.55)";
const BORDER = "rgba(255,255,255,0.28)";
const RULE = "rgba(255,255,255,0.14)";
const GOLD = "#c4a574";
const GOLD_HOVER = "#d4b888";
const GUTTER = "clamp(16px, 4vw, 60px)";
const CONTENT_MAX = "1120px";

type RecoItem = {
  slug: string;
  name: string;
  price: string;
  image: string;
  swatches: string[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return "₹ " + n.toLocaleString("en-IN");
}

function Stepper({
  qty,
  onMinus,
  onPlus,
}: {
  qty: number;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <div className="cart-stepper">
      <button type="button" onClick={onMinus} aria-label="Decrease quantity">
        <Minus size={9} strokeWidth={1.25} absoluteStrokeWidth={false} aria-hidden />
      </button>
      <span>{qty}</span>
      <button type="button" onClick={onPlus} aria-label="Increase quantity">
        <Plus size={9} strokeWidth={1.25} absoluteStrokeWidth={false} aria-hidden />
      </button>
    </div>
  );
}

function SectionHeading({
  title,
  count,
}: {
  title: string;
  count?: string;
}) {
  return (
    <div className="cart-section-heading">
      <p>{title}</p>
      {count && <span>{count}</span>}
    </div>
  );
}

export default function CartClient({
  products = [],
}: {
  products?: CatalogProduct[];
}) {
  const {
    items: cart,
    loading,
    isAuthenticated,
    updateQty,
    removeItem,
  } = useCart();
  const [promo, setPromo] = useState("");
  const [giftMsg, setGiftMsg] = useState(false);
  const [giftText, setGiftText] = useState("");
  const [catalogBySlug] = useState(
    () => new Map(products.map((p) => [p.slug, p])),
  );
  const [youMayLike] = useState<RecoItem[]>(() =>
    products.slice(0, 3).map((p) => ({
      slug: p.slug,
      name: p.name,
      price: `₹ ${Math.round(p.priceCents / 100).toLocaleString("en-IN")}`,
      image: p.image,
      swatches: p.swatches.slice(0, 1),
    })),
  );

  const displayCart = cart.map((item) => {
    const product = catalogBySlug.get(item.slug);
    if (!product) return item;
    const color = resolveCartColor(product.colors, item.color);
    return {
      ...item,
      color,
      image: product.image || item.image,
      swatches: selectedColorSwatches(product.colors, color),
    };
  });

  // Persist catalog images/colors into guest cart so stale paths (404 thumbs) heal.
  useEffect(() => {
    if (isAuthenticated || catalogBySlug.size === 0) return;
    const local = readLocalCart();
    if (local.length === 0) return;
    let changed = false;
    const next = local.map((item) => {
      const product = catalogBySlug.get(item.slug);
      if (!product) return item;
      const color = resolveCartColor(product.colors, item.color);
      const image = product.image || item.image;
      const swatches = selectedColorSwatches(product.colors, color);
      if (
        image === item.image &&
        color === item.color &&
        swatches.length === item.swatches.length &&
        swatches.every((s, i) => s === item.swatches[i])
      ) {
        return item;
      }
      changed = true;
      return { ...item, image, color, swatches };
    });
    if (changed) writeLocalCart(next);
  }, [catalogBySlug, isAuthenticated]);

  const changeQty = (item: CartItem, delta: number) => {
    void updateQty(item.id, Math.max(1, item.qty + delta));
  };

  const subtotal = cart.reduce((acc, i) => acc + i.price * i.qty, 0);
  const shipping = 0;
  const tax = Math.round(subtotal * 0.07);
  const total = subtotal + shipping + tax;
  const itemCount = cart.reduce((acc, i) => acc + i.qty, 0);

  if (loading) {
    return <RouteLoading />;
  }

  return (
    <>
      <Navbar />

      <main className="cart-page">
        {/* ── HERO ── */}
        <section className="cart-hero him-hero-media him-hero-media--center" aria-label="My Cart">
          <Image
            src="/products/man-image-104.webp"
            alt=""
            fill
            priority
            quality={80}
            sizes="100vw"
            className="object-cover"
            style={{ objectFit: "cover", objectPosition: "center 30%" }}
          />
          <div className="cart-hero-overlay" />
          <div className="cart-hero-content">
            <p className="cart-hero-eyebrow">SHOPPING BAG</p>
            <h1 className="cart-hero-title">MY CART</h1>
            <p className="cart-hero-sub">
              A CONSIDERED SELECTION,
              <br />
              READY FOR CHECKOUT.
            </p>
          </div>
        </section>

        {/* ── BODY ── */}
        <div className="cart-body">
          {cart.length === 0 ? (
            <div className="cart-empty">
              <p className="cart-empty-title">Your bag is empty.</p>
              <Link href="/collection" className="cart-btn-secondary">
                CONTINUE SHOPPING
              </Link>
            </div>
          ) : (
            <div className="cart-layout">
              {/* ── LEFT: CART ITEMS ── */}
              <div className="cart-items-col">
                <div className="cart-section-header">
                  <p className="cart-section-title">CART ITEMS</p>
                  <p className="cart-item-count">
                    {itemCount} {itemCount === 1 ? "ITEM" : "ITEMS"}
                  </p>
                </div>

                <div className="cart-items-panel">
                  {displayCart.map((item, idx) => (
                    <div
                      key={item.id}
                      className="cart-item-row"
                      style={{
                        borderBottom:
                          idx < displayCart.length - 1
                            ? `1px solid ${RULE}`
                            : "none",
                      }}
                    >
                      <Link
                        href={`/collection/${item.slug}`}
                        className="cart-item-thumb him-card-media"
                      >
                        <Image
                          key={toCardImage(item.image)}
                          src={toCardImage(item.image)}
                          alt={item.name}
                          fill
                          quality={75}
                          sizes="88px"
                          className="object-cover object-top"
                          style={{ objectFit: "cover", objectPosition: "top center" }}
                        />
                      </Link>

                      <div className="cart-item-meta">
                        <Link
                          href={`/collection/${item.slug}`}
                          className="cart-item-name"
                        >
                          {item.name}
                        </Link>
                        <p className="cart-item-attrs">
                          Size {item.size}
                          {item.color ? (
                            <>
                              &nbsp;|&nbsp; {item.color}
                            </>
                          ) : null}
                        </p>
                        {item.swatches.length > 0 && (
                          <div className="cart-item-swatches">
                            {item.swatches.map((c, i) => (
                              <span
                                key={`${item.id}-${c}-${i}`}
                                style={{ background: c }}
                              />
                            ))}
                          </div>
                        )}

                        <Stepper
                          qty={item.qty}
                          onMinus={() => changeQty(item, -1)}
                          onPlus={() => changeQty(item, 1)}
                        />
                      </div>

                      <div className="cart-item-aside">
                        <button
                          type="button"
                          onClick={() => void removeItem(item.id)}
                          aria-label={`Remove ${item.name}`}
                          className="cart-item-remove"
                        >
                          <X size={10} strokeWidth={1.25} absoluteStrokeWidth={false} aria-hidden />
                        </button>
                        <p className="cart-item-price">
                          {fmt(item.price * item.qty)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Gift message */}
                <div className="cart-gift">
                  <button
                    type="button"
                    onClick={() => setGiftMsg((v) => !v)}
                    className="cart-gift-toggle"
                  >
                    <span>Add a note or gift message (optional)</span>
                    <span aria-hidden="true">{giftMsg ? "−" : "+"}</span>
                  </button>

                  {giftMsg && (
                    <div className="cart-gift-body">
                      <textarea
                        value={giftText}
                        onChange={(event) =>
                          setGiftText(event.target.value)
                        }
                        placeholder="Write your message here..."
                        rows={3}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* ── RIGHT: ORDER SUMMARY ── */}
              <aside className="cart-summary">
                <p className="cart-section-title" style={{ marginBottom: 20 }}>
                  ORDER SUMMARY
                </p>

                <div className="cart-summary-rows">
                  {[
                    {
                      label: `Subtotal (${itemCount} items)`,
                      value: fmt(subtotal),
                    },
                    {
                      label: "Shipping",
                      value: shipping === 0 ? "Free" : fmt(shipping),
                      emphasize: shipping === 0,
                    },
                    { label: "Estimated Tax", value: fmt(tax) },
                  ].map(({ label, value, emphasize }) => (
                    <div key={label} className="cart-summary-row">
                      <span>{label}</span>
                      <span
                        style={{
                          fontWeight: emphasize ? 600 : 400,
                          color: emphasize ? INK : MUTED_SOFT,
                        }}
                      >
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="cart-summary-total">
                  <span>Total</span>
                  <span>{fmt(total)}</span>
                </div>

                <p className="cart-promo-label">PROMO CODE</p>
                <div className="cart-promo">
                  <input
                    type="text"
                    value={promo}
                    onChange={(e) => setPromo(e.target.value)}
                    placeholder="Enter code"
                    aria-label="Promo code"
                  />
                  <button type="button">APPLY</button>
                </div>

                {isAuthenticated ? (
                  <Link
                    href="#"
                    className="cart-btn-primary"
                    onClick={() =>
                      track("checkout_clicked", {
                        authenticated: true,
                        item_count: itemCount,
                        subtotal,
                      })
                    }
                  >
                    PROCEED TO CHECKOUT{" "}
                    <ArrowRight size={12} strokeWidth={1.25} absoluteStrokeWidth={false} aria-hidden />
                  </Link>
                ) : (
                  <Link
                    href="/login?next=%2Fcart"
                    className="cart-btn-primary"
                    onClick={() =>
                      track("checkout_clicked", {
                        authenticated: false,
                        item_count: itemCount,
                        subtotal,
                      })
                    }
                  >
                    LOGIN TO CHECKOUT{" "}
                    <ArrowRight size={12} strokeWidth={1.25} absoluteStrokeWidth={false} aria-hidden />
                  </Link>
                )}
                <Link href="/collection" className="cart-btn-secondary">
                  CONTINUE SHOPPING
                </Link>

                <p className="cart-secure-note">
                  Complimentary shipping on all prepaid orders
                </p>
              </aside>
            </div>
          )}

          {/* ── YOU MAY ALSO LIKE ── */}
          <section className="cart-recs" aria-label="You may also like">
            <div className="cart-section-header" style={{ marginBottom: 20 }}>
              <p className="cart-section-title">YOU MAY ALSO LIKE</p>
              <Link href="/collection" className="cart-action-link">
                VIEW ALL
              </Link>
            </div>

            <div className="cart-recs-grid">
              {youMayLike.map((item) => (
                <Link
                  key={item.slug}
                  href={`/collection/${item.slug}`}
                  className="cart-rec-card"
                >
                  <div className="cart-rec-img him-card-media">
                    <Image
                      src={toCardImage(item.image)}
                      alt={item.name}
                      fill
                      quality={75}
                      sizes="(max-width: 768px) 50vw, 28vw"
                      className="object-cover object-top"
                      style={{ objectFit: "cover", objectPosition: "top center" }}
                    />
                    <span className="cart-rec-plus" aria-hidden="true">
                      +
                    </span>
                  </div>
                  <p className="cart-rec-name">{item.name}</p>
                  <p className="cart-rec-price">{item.price}</p>
                  {item.swatches.length > 0 && (
                    <div className="cart-item-swatches">
                      {item.swatches.map((c, i) => (
                        <span
                          key={`${item.slug}-${c}-${i}`}
                          style={{ background: c }}
                        />
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>

      <Footer />

      <style jsx global>{`
        .cart-page {
          background: ${BG};
          min-height: 100vh;
          color: ${INK};
        }

        /* ── Hero ── */
        .cart-hero {
          position: relative;
          height: clamp(220px, 28vw, 380px);
          overflow: hidden;
          background: #000;
        }
        .cart-hero.him-hero-media > img,
        .cart-hero.him-hero-media img {
          object-position: center 30% !important;
          transform: scale(1.08);
          transform-origin: center center;
        }
        .cart-hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(0, 0, 0, 0.15) 0%,
            rgba(0, 0, 0, 0.55) 50%,
            rgba(0, 0, 0, 0.88) 100%
          );
          pointer-events: none;
        }
        .cart-hero-content {
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
        .cart-hero-eyebrow {
          margin: 0 0 8px;
          font-family: ${SANS};
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: ${MUTED};
        }
        .cart-hero-title {
          margin: 0;
          font-family: ${SERIF};
          font-size: clamp(40px, 7vw, 88px);
          font-weight: 400;
          letter-spacing: 0.02em;
          text-transform: uppercase;
          color: ${INK};
          line-height: 0.92;
        }
        .cart-hero-sub {
          margin: 14px 0 0;
          font-family: ${SANS};
          font-size: clamp(9px, 0.85vw, 11px);
          letter-spacing: 1.6px;
          text-transform: uppercase;
          color: ${MUTED_SOFT};
          line-height: 1.55;
        }

        /* ── Body ── */
        .cart-body {
          max-width: ${CONTENT_MAX};
          margin: 0 auto;
          padding: clamp(28px, 4vw, 48px) ${GUTTER} clamp(56px, 8vw, 96px);
          box-sizing: border-box;
        }

        .cart-layout {
          display: grid;
          grid-template-columns: 1fr minmax(280px, 340px);
          gap: clamp(20px, 3vw, 28px);
          align-items: start;
        }

        .cart-section-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 16px;
          gap: 12px;
        }
        .cart-section-title {
          margin: 0;
          font-family: ${SANS};
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 1.6px;
          text-transform: uppercase;
          color: ${INK};
        }
        .cart-item-count {
          margin: 0;
          font-family: ${SANS};
          font-size: 9px;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: ${MUTED_SOFT};
          border-bottom: 1px solid ${MUTED_SOFT};
          padding-bottom: 1px;
        }
        .cart-action-link {
          font-family: ${SANS};
          font-size: 9px;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: ${MUTED_SOFT};
          text-decoration: none;
          border-bottom: 1px solid ${MUTED_SOFT};
          padding-bottom: 1px;
        }
        .cart-action-link:hover {
          color: ${INK};
          border-bottom-color: ${INK};
        }

        /* ── Items panel ── */
        .cart-items-panel {
          border: 1px solid ${BORDER};
          background: transparent;
        }
        .cart-item-row {
          display: grid;
          grid-template-columns: 72px 1fr auto;
          gap: 16px;
          align-items: stretch;
          padding: 20px;
        }
        .cart-item-thumb {
          position: relative;
          display: block;
          width: 72px;
          height: 88px;
          overflow: hidden;
          background: #1a1a1a;
          flex-shrink: 0;
        }
        .cart-item-meta {
          min-width: 0;
        }
        .cart-item-name {
          display: block;
          margin: 0 0 4px;
          font-family: ${SANS};
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.6px;
          color: ${INK};
          text-decoration: none;
          text-transform: uppercase;
        }
        .cart-item-name:hover {
          opacity: 0.8;
        }
        .cart-item-attrs {
          margin: 0 0 10px;
          font-family: ${SANS};
          font-size: 10px;
          color: ${MUTED};
        }
        .cart-item-swatches {
          display: flex;
          gap: 5px;
          margin-bottom: 14px;
        }
        .cart-item-swatches span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.25);
          display: inline-block;
          flex: 0 0 auto;
        }
        .cart-item-aside {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: flex-end;
          align-self: stretch;
          gap: 12px;
          min-height: 88px;
        }
        .cart-item-remove {
          display: grid;
          place-items: center;
          width: 22px;
          height: 22px;
          border: none;
          background: transparent;
          cursor: pointer;
          color: ${MUTED};
          padding: 0;
        }
        .cart-item-remove:hover {
          color: ${INK};
        }
        .cart-item-price {
          margin: 0;
          font-family: ${SANS};
          font-size: 12px;
          font-weight: 500;
          color: ${INK};
          white-space: nowrap;
        }

        .cart-stepper {
          display: inline-flex;
          align-items: center;
          border: 1px solid ${BORDER};
          height: 28px;
        }
        .cart-stepper button {
          width: 28px;
          height: 28px;
          display: grid;
          place-items: center;
          border: none;
          background: transparent;
          cursor: pointer;
          color: ${INK};
          padding: 0;
        }
        .cart-stepper button:hover {
          background: rgba(255, 255, 255, 0.06);
        }
        .cart-stepper span {
          min-width: 28px;
          text-align: center;
          font-family: ${SANS};
          font-size: 11px;
          font-weight: 600;
          color: ${INK};
          border-left: 1px solid ${BORDER};
          border-right: 1px solid ${BORDER};
          line-height: 28px;
        }

        /* ── Gift ── */
        .cart-gift {
          margin-top: 12px;
          border: 1px solid ${BORDER};
        }
        .cart-gift-toggle {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-family: ${SANS};
          font-size: 10px;
          letter-spacing: 0.8px;
          color: ${MUTED_SOFT};
          text-align: left;
        }
        .cart-gift-toggle:hover {
          color: ${INK};
        }
        .cart-gift-body {
          padding: 0 20px 16px;
        }
        .cart-gift-body textarea {
          width: 100%;
          resize: vertical;
          border: 1px solid ${BORDER};
          outline: none;
          padding: 10px 12px;
          font-family: ${SANS};
          font-size: 12px;
          color: ${INK};
          background: rgba(255, 255, 255, 0.04);
          box-sizing: border-box;
        }
        .cart-gift-body textarea::placeholder {
          color: ${MUTED};
        }

        /* ── Summary ── */
        .cart-summary {
          border: 1px solid ${BORDER};
          padding: 24px;
          background: transparent;
          position: sticky;
          top: 24px;
        }
        .cart-summary-rows {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 20px;
        }
        .cart-summary-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 12px;
          font-family: ${SANS};
          font-size: 11px;
          color: ${MUTED};
        }
        .cart-summary-row span:last-child {
          color: ${MUTED_SOFT};
        }
        .cart-summary-total {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          padding-top: 16px;
          border-top: 1px solid ${RULE};
          margin-bottom: 24px;
          gap: 12px;
        }
        .cart-summary-total span:first-child {
          font-family: ${SANS};
          font-size: 13px;
          font-weight: 600;
          color: ${INK};
        }
        .cart-summary-total span:last-child {
          font-family: ${SERIF};
          font-size: 22px;
          font-weight: 400;
          color: ${INK};
        }

        .cart-promo-label {
          margin: 0 0 8px;
          font-family: ${SANS};
          font-size: 9px;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: ${MUTED};
        }
        .cart-promo {
          display: flex;
          margin-bottom: 20px;
        }
        .cart-promo input {
          flex: 1;
          height: 38px;
          padding: 0 12px;
          border: 1px solid ${BORDER};
          border-right: none;
          outline: none;
          font-family: ${SANS};
          font-size: 11px;
          color: ${INK};
          background: rgba(255, 255, 255, 0.04);
          min-width: 0;
        }
        .cart-promo input::placeholder {
          color: ${MUTED};
        }
        .cart-promo button {
          height: 38px;
          padding: 0 16px;
          border: 1px solid ${INK};
          background: ${INK};
          color: ${BG};
          font-family: ${SANS};
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 1px;
          cursor: pointer;
          text-transform: uppercase;
          flex-shrink: 0;
        }
        .cart-promo button:hover {
          background: #e8e8e8;
        }

        .cart-btn-primary {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          height: 48px;
          background: ${GOLD};
          color: #111;
          font-family: ${SANS};
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-decoration: none;
          text-transform: uppercase;
          margin-bottom: 10px;
          transition: background 200ms ease;
          box-sizing: border-box;
        }
        .cart-btn-primary:hover {
          background: ${GOLD_HOVER};
        }

        .cart-btn-secondary {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 44px;
          border: 1px solid ${BORDER};
          background: transparent;
          color: ${INK};
          font-family: ${SANS};
          font-size: 10px;
          letter-spacing: 1.2px;
          text-decoration: none;
          text-transform: uppercase;
          transition: border-color 200ms, color 200ms;
          box-sizing: border-box;
        }
        .cart-btn-secondary:hover {
          border-color: ${INK};
        }

        .cart-secure-note {
          margin: 14px 0 0;
          font-family: ${SANS};
          font-size: 9px;
          color: ${MUTED};
          text-align: center;
          letter-spacing: 0.3px;
        }

        /* ── Empty ── */
        .cart-empty {
          text-align: center;
          padding: 80px 0;
        }
        .cart-empty-title {
          font-family: ${SERIF};
          font-size: clamp(24px, 4vw, 32px);
          color: ${INK};
          margin: 0 0 20px;
        }
        .cart-empty .cart-btn-secondary {
          display: inline-flex;
          width: auto;
          padding: 0 32px;
        }

        /* ── Recs ── */
        .cart-recs {
          margin-top: clamp(48px, 6vw, 72px);
        }
        .cart-recs-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: clamp(14px, 1.8vw, 20px);
        }
        .cart-rec-card {
          display: block;
          text-decoration: none;
          color: inherit;
        }
        .cart-rec-img {
          position: relative;
          width: 100%;
          aspect-ratio: 3 / 4;
          overflow: hidden;
          background: #1a1a1a;
        }
        .cart-rec-plus {
          position: absolute;
          right: 10px;
          bottom: 10px;
          width: 24px;
          height: 24px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.92);
          color: #111;
          font-size: 16px;
          line-height: 1;
        }
        .cart-rec-name {
          margin: 12px 0 4px;
          font-family: ${SANS};
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.8px;
          color: ${INK};
          text-transform: uppercase;
        }
        .cart-rec-price {
          margin: 0 0 8px;
          font-family: ${SANS};
          font-size: 12px;
          color: ${MUTED_SOFT};
        }
        .cart-rec-card .cart-item-swatches {
          margin-bottom: 0;
        }

        .cart-items-col,
        .cart-summary {
          min-width: 0;
        }

        /* ── Responsive ── */
        @media (max-width: 900px) {
          .cart-layout {
            grid-template-columns: minmax(0, 1fr) minmax(240px, 270px);
            gap: 16px;
          }
          .cart-summary {
            position: static;
          }
        }

        @media (max-width: 767px) {
          .cart-body {
            padding-left: 16px;
            padding-right: 16px;
          }

          .cart-layout {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .cart-recs-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 14px;
          }
          .cart-item-row {
            grid-template-columns: 64px minmax(0, 1fr) auto;
            gap: 12px;
            padding: 16px;
          }
          .cart-item-thumb {
            width: 64px;
            height: 80px;
          }
          .cart-summary {
            width: 100%;
            box-sizing: border-box;
            padding: 20px 16px;
          }
          .cart-summary-total span:last-child {
            font-size: 20px;
          }
          .cart-hero {
            height: clamp(200px, 50vw, 280px);
          }
        }

        @media (max-width: 420px) {
          .cart-item-row {
            grid-template-columns: 56px minmax(0, 1fr);
          }
          .cart-item-aside {
            grid-column: 2;
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            width: 100%;
            min-height: 0;
          }
          .cart-item-remove {
            order: 2;
          }
        }
      `}</style>
    </>
  );
}