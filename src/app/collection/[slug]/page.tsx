"use client";

import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState } from "react";

// ─── Rotate arrows for the 360 control ──────────────────────────────
function RotateIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      style={{ transform: direction === "right" ? "scaleX(-1)" : undefined }}
    >
      <path
        d="M4 2.5L1.75 4.75L4 7M2 4.75H7.25C8.90685 4.75 10.25 6.09315 10.25 7.75C10.25 9.40685 8.90685 10.75 7.25 10.75H5.5"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Chevron for the size dropdown ──────────────────────────────────
function Chevron() {
  return (
    <svg width="9" height="6" viewBox="0 0 9 6" fill="none" aria-hidden="true">
      <path d="M1 1L4.5 4.5L8 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Plus / Minus icon for accordions ───────────────────────────────
function PlusIcon({ open }: { open: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <line x1="6" y1="0" x2="6" y2="12" stroke="currentColor" strokeWidth="1"
        style={{ opacity: open ? 0 : 1, transition: "opacity 200ms" }} />
      <line x1="0" y1="6" x2="12" y2="6" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

// ─── Star rating ─────────────────────────────────────────────────────
function Stars({ rating }: { rating: number }) {
  return (
    <span className="pdp-related-stars" aria-label={`${rating} out of 5`}>
      {"★".repeat(Math.floor(rating))}
    </span>
  );
}

// ─── Static product data (in a real app this comes from params/API) ─
const PRODUCT = {
  name: "Athletic Zip Hoodie",
  price: "45,000.00",
  description:
    "A refined take on the everyday essential. Cut from our signature brushed-cotton blend, this hoodie pairs relaxed structure with purposeful detailing — zip placket, tonal stitching, and a fit that works as hard as you do.",
  colors: [
    { name: "Heather Grey", hex: "#a3a3a3" },
    { name: "Burgundy", hex: "#7a1420" },
  ],
  sizes: ["XS", "S", "M", "L", "XL", "XXL"],
  images: [
    "/products/item-4.webp",
    "/products/man-image-1.webp",
    "/products/man-image-2.webp",
  ],
  details:
    "100% premium cotton. Brushed inner lining. Full-length zip with branded puller. Ribbed cuffs and hem. Machine washable at 30°C.",
  sizeFit:
    "True to size. Model is 6'1\" wearing size M. Relaxed through the chest and shoulders with a slightly tapered hem.",
  shipping:
    "Free standard shipping on orders above ₹3,000. Express delivery available at checkout. Hassle-free 30-day returns.",
};

const RELATED = [
  { slug: "textured-thermal-white", name: "Textured Thermal - White", price: "16,000", image: "/products/item-4.webp", rating: 4.8, color: "#111" },
  { slug: "textured-thermal-white-2", name: "Textured Thermal - White", price: "16,000", image: "/products/item-4.webp", rating: 4.8, color: "#111" },
  { slug: "textured-thermal-white-3", name: "Textured Thermal - White", price: "16,000", image: "/products/item-4.webp", rating: 4.8, color: "#111" },
];

// ─── Accordion row ───────────────────────────────────────────────────
function Accordion({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="pdp-accordion">
      <button
        type="button"
        className="pdp-accordion-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>{label}</span>
        <PlusIcon open={open} />
      </button>
      {open && <div className="pdp-accordion-body">{children}</div>}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────
export default function ProductDetailPage() {
  const [selectedColor, setSelectedColor] = useState(PRODUCT.colors[0].name);
  const [selectedSize, setSelectedSize] = useState("");
  const [activeImg, setActiveImg] = useState(0);
  const [added, setAdded] = useState(false);

  const imageCount = PRODUCT.images.length;
  const angle = Math.round((activeImg * 360) / imageCount);
  const rotate = (step: number) => setActiveImg((i) => (i + step + imageCount) % imageCount);

  const handleAddToBag = () => {
    if (!selectedSize) return;
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <>
      <Navbar />

      <main className="pdp-main">
        <div className="pdp-columns">

          {/* ── LEFT: IMAGE PANEL ──────────────────────── */}
          <div className="pdp-left">
            <div className="pdp-main-img">
              {PRODUCT.images.map((src, i) => (
                <Image
                  key={src}
                  src={src}
                  alt={i === activeImg ? PRODUCT.name : ""}
                  fill
                  priority={i === 0}
                  quality={75}
                  sizes="(max-width: 1280px) 50vw, 40vw"
                  className={`pdp-main-img-frame object-cover object-center${i === activeImg ? " active" : ""}`}
                />
              ))}

              <div className="pdp-rotate" role="group" aria-label="Rotate product view">
                <button type="button" onClick={() => rotate(-1)} aria-label="Rotate left">
                  <RotateIcon direction="left" />
                </button>
                <span aria-live="polite">{angle}°</span>
                <button type="button" onClick={() => rotate(1)} aria-label="Rotate right">
                  <RotateIcon direction="right" />
                </button>
              </div>
            </div>
          </div>

          {/* ── RIGHT: PRODUCT INFO PANEL ──────────────── */}
          <div className="pdp-right">
            <h1 className="pdp-title">{PRODUCT.name}</h1>
            <p className="pdp-price">Rs. {PRODUCT.price}</p>

            <div className="pdp-divider" />

            {/* Color selector */}
            <p className="pdp-field-label">
              COLOR: <span className="pdp-field-value">{selectedColor}</span>
            </p>
            <div className="pdp-color-row">
              {PRODUCT.colors.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  aria-label={c.name}
                  aria-pressed={selectedColor === c.name}
                  onClick={() => setSelectedColor(c.name)}
                  className={`pdp-color-swatch${selectedColor === c.name ? " active" : ""}`}
                  style={{ background: c.hex }}
                />
              ))}
            </div>

            <div className="pdp-divider" />

            {/* Size selector */}
            <div className="pdp-size-head">
              <label htmlFor="pdp-size" className="pdp-field-label">SIZE</label>
              <button type="button" className="pdp-size-chart">SIZE CHART</button>
            </div>
            <div className="pdp-select">
              <select
                id="pdp-size"
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
              >
                <option value="" disabled>Select Size</option>
                {PRODUCT.sizes.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <Chevron />
            </div>

            {/* Add to bag */}
            <button
              type="button"
              onClick={handleAddToBag}
              aria-disabled={!selectedSize}
              className="pdp-add-btn"
            >
              {added ? "ADDED TO BAG" : "ADD TO BAG"}
            </button>

            {/* Accordions */}
            <div className="pdp-accordions">
              <Accordion label="Details">
                <p>{PRODUCT.details}</p>
              </Accordion>
              <Accordion label="Size & Fit">
                <p>{PRODUCT.sizeFit}</p>
              </Accordion>
              <Accordion label="Shipping">
                <p>{PRODUCT.shipping}</p>
              </Accordion>
            </div>

            {/* ── MORE WAYS TO WEAR IT ───────────────── */}
            <section className="pdp-related" aria-labelledby="pdp-related-title">
              <div className="pdp-related-header">
                <h2 id="pdp-related-title" className="pdp-related-title">More ways to wear it</h2>
                <Link href="/collection" className="pdp-view-all">VIEW ALL</Link>
              </div>

              <div className="pdp-related-grid">
                {RELATED.map((r) => (
                  <Link key={r.slug} href={`/collection/${r.slug}`} className="pdp-related-card group">
                    <div className="pdp-related-img">
                      <Image
                        src={r.image}
                        alt={r.name}
                        fill
                        quality={70}
                        sizes="(max-width: 768px) 33vw, 12vw"
                        className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.03]"
                      />
                    </div>
                    <p className="pdp-related-name">{r.name}</p>
                    <Stars rating={r.rating} />
                    <span className="pdp-related-dot" style={{ background: r.color }} aria-hidden="true" />
                    <p className="pdp-related-price">Rs. {r.price}</p>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />

      <style jsx global>{`
        .pdp-main {
          --pdp-ink: #111;
          --pdp-muted: #6b6b6b;
          --pdp-rule: #1a1a1a;
          --pdp-serif: var(--font-room-serif, "Cormorant Garamond"), Georgia, serif;
          --pdp-sans: "Helvetica Neue", Helvetica, Arial, sans-serif;
          background: #fff;
          color: var(--pdp-ink);
          --u: calc(min(100vw, 1440px) / 1440);
          padding-top: 68px; /* navbar height */
        }

        /* ── TWO COLUMNS ── */
        .pdp-columns {
          display: grid;
          grid-template-columns: 40% 60%;
          align-items: start;
        }

        /* ══════════════════════
           LEFT PANEL
        ══════════════════════ */
        .pdp-left {
          position: relative;
        }

        .pdp-main-img {
          position: relative;
          width: 100%;
          aspect-ratio: 720 / 882;
          overflow: hidden;
          background: #e9e6e1;
        }

        .pdp-main-img-frame {
          opacity: 0;
          transition: opacity 450ms ease;
        }

        .pdp-main-img-frame.active {
          opacity: 1;
        }

        .pdp-rotate {
          position: absolute;
          z-index: 2;
          top: calc(24 * var(--u));
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 4px;
          height: 34px;
          padding: 0 6px;
          background: rgba(255, 255, 255, 0.86);
          border-radius: 3px;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
          backdrop-filter: blur(6px);
          font-family: var(--pdp-sans);
          font-size: 11px;
          color: #333;
        }

        .pdp-rotate span {
          min-width: 38px;
          text-align: center;
          font-variant-numeric: tabular-nums;
        }

        .pdp-rotate button {
          display: grid;
          place-items: center;
          width: 30px;
          height: 26px;
          padding: 0;
          border: none;
          border-radius: 2px;
          background: transparent;
          color: #333;
          cursor: pointer;
          transition: background 150ms ease;
        }

        .pdp-rotate button:hover {
          background: rgba(0, 0, 0, 0.06);
        }

        /* ══════════════════════
           RIGHT PANEL
        ══════════════════════ */
        .pdp-right {
          width: 100%;
          max-width: none;
          box-sizing: border-box;
          padding: calc(96 * var(--u)) calc(96 * var(--u)) calc(96 * var(--u)) calc(96 * var(--u));
        }

        .pdp-title {
          margin: 0;
          font-family: var(--pdp-serif);
          font-size: max(26px, calc(36 * var(--u)));
          font-weight: 500;
          font-variant-caps: small-caps;
          line-height: 1.1;
          letter-spacing: 0.06em;
          color: var(--pdp-ink);
        }

        .pdp-price {
          margin: calc(14 * var(--u)) 0 0;
          font-family: var(--pdp-sans);
          font-size: 11px;
          font-weight: 300;
          letter-spacing: 0.04em;
          color: var(--pdp-muted);
        }

        .pdp-divider {
          width: 100%;
          height: 1px;
          background: var(--pdp-rule);
          margin: calc(38 * var(--u)) 0 calc(46 * var(--u));
        }

        .pdp-field-label {
          display: block;
          margin: 0;
          font-family: var(--pdp-sans);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--pdp-ink);
        }

        .pdp-field-value {
          font-weight: 400;
          color: var(--pdp-muted);
        }

        /* Color swatches */
        .pdp-color-row {
          display: flex;
          gap: 12px;
          margin-top: calc(18 * var(--u));
        }

        .pdp-color-swatch {
          width: max(20px, calc(26 * var(--u)));
          height: max(20px, calc(26 * var(--u)));
          padding: 0;
          border: none;
          border-radius: 0;
          outline: 1px solid transparent;
          outline-offset: 2px;
          cursor: pointer;
          transition: outline-color 150ms ease;
        }

        .pdp-color-swatch.active {
          outline-color: var(--pdp-ink);
        }

        .pdp-color-swatch:not(.active):hover {
          outline-color: rgba(0, 0, 0, 0.3);
        }

        /* Size */
        .pdp-size-head {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: calc(18 * var(--u));
        }

        .pdp-size-chart {
          padding: 0 0 1px;
          border: none;
          border-bottom: 1px solid currentColor;
          background: transparent;
          font-family: var(--pdp-sans);
          font-size: 8px;
          font-weight: 400;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--pdp-muted);
          cursor: pointer;
          transition: color 150ms;
        }

        .pdp-size-chart:hover {
          color: var(--pdp-ink);
        }

        .pdp-select {
          position: relative;
          color: var(--pdp-ink);
        }

        .pdp-select select {
          width: 100%;
          height: max(42px, calc(52 * var(--u)));
          padding: 0 44px 0 calc(20 * var(--u));
          border: 1px solid var(--pdp-ink);
          border-radius: 0;
          background: #fff;
          appearance: none;
          -webkit-appearance: none;
          font-family: var(--pdp-sans);
          font-size: 12px;
          font-weight: 400;
          color: var(--pdp-ink);
          cursor: pointer;
        }

        .pdp-select select:focus-visible {
          outline: 1px solid var(--pdp-ink);
          outline-offset: 2px;
        }

        .pdp-select svg {
          position: absolute;
          top: 50%;
          right: 20px;
          transform: translateY(-50%);
          pointer-events: none;
        }

        /* Add to bag */
        .pdp-add-btn {
          width: 100%;
          height: max(44px, calc(56 * var(--u)));
          margin-top: calc(31 * var(--u));
          border: none;
          border-radius: 0;
          background: var(--pdp-ink);
          color: #fff;
          font-family: var(--pdp-sans);
          font-size: 10px;
          font-weight: 400;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 180ms ease;
        }

        .pdp-add-btn:hover {
          background: #2a2a2a;
        }

        .pdp-add-btn[aria-disabled="true"] {
          cursor: default;
        }

        /* ── ACCORDIONS ── */
        .pdp-accordions {
          margin-top: calc(44 * var(--u));
        }

        .pdp-accordion {
          border-bottom: 1px solid var(--pdp-rule);
        }

        .pdp-accordion-trigger {
          width: 100%;
          height: max(52px, calc(76 * var(--u)));
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0;
          border: none;
          background: transparent;
          font-family: var(--pdp-serif);
          font-size: max(17px, calc(20 * var(--u)));
          font-weight: 500;
          font-variant-caps: small-caps;
          letter-spacing: 0.05em;
          color: var(--pdp-ink);
          cursor: pointer;
          text-align: left;
        }

        .pdp-accordion-trigger svg {
          margin-right: 4px;
        }

        .pdp-accordion-body {
          padding: 0 0 24px;
          font-family: var(--pdp-sans);
          font-size: 12px;
          line-height: 1.7;
          color: var(--pdp-muted);
        }

        .pdp-accordion-body p {
          margin: 0;
        }

        /* ── RELATED / MORE WAYS ── */
        .pdp-related {
          max-width: none;
          margin-top: calc(104 * var(--u));
        }

        .pdp-related-header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin-bottom: calc(28 * var(--u));
        }

        .pdp-related-title {
          margin: 0;
          font-family: var(--pdp-serif);
          font-size: max(17px, calc(23 * var(--u)));
          font-weight: 500;
          letter-spacing: 0.02em;
          text-transform: uppercase;
          color: var(--pdp-ink);
        }

        .pdp-view-all {
          font-family: var(--pdp-sans);
          font-size: 8px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--pdp-ink);
          text-decoration: none;
          transition: opacity 150ms;
        }

        .pdp-view-all:hover {
          opacity: 0.5;
        }

        .pdp-related-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: calc(18 * var(--u));
        }

        .pdp-related-card {
          display: block;
          color: var(--pdp-ink);
          text-decoration: none;
        }

        .pdp-related-img {
          position: relative;
          width: 100%;
          aspect-ratio: 3 / 4;
          overflow: hidden;
          background: #e9e6e1;
        }

        .pdp-related-name {
          margin: calc(18 * var(--u)) 0 0;
          font-family: var(--pdp-sans);
          font-size: 8px;
          font-weight: 700;
          line-height: 1.5;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .pdp-related-stars {
          display: block;
          margin-top: 6px;
          font-size: 10px;
          letter-spacing: 4px;
          color: var(--pdp-ink);
        }

        .pdp-related-dot {
          display: block;
          width: 7px;
          height: 7px;
          margin: 6px 0 0 18px;
          border-radius: 50%;
        }

        .pdp-related-price {
          margin: calc(14 * var(--u)) 0 0;
          font-family: var(--pdp-sans);
          font-size: 9px;
          font-weight: 300;
          letter-spacing: 0.04em;
          color: var(--pdp-muted);
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 1280px) {
          .pdp-main {
            --u: 0.8px;
          }

          .pdp-columns {
            grid-template-columns: 50% 50%;
          }

          .pdp-main-img {
            aspect-ratio: 4 / 5;
          }

          .pdp-rotate {
            top: 16px;
          }

          .pdp-right {
            max-width: none;
            padding: 36px 20px 64px;
          }

          .pdp-title {
            font-size: 30px;
          }

          .pdp-divider {
            margin: 28px 0 32px;
          }

          .pdp-accordions {
            margin-top: 32px;
          }

          .pdp-accordion-trigger {
            height: 64px;
            font-size: 19px;
          }

          .pdp-related {
            max-width: none;
            margin-top: 64px;
          }

          .pdp-related-title {
            font-size: 19px;
          }

          .pdp-related-grid {
            gap: 12px;
          }
        }
      `}</style>
    </>
  );
}
