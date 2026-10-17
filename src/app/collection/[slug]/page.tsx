"use client";

import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState } from "react";

// ─── Arrow ──────────────────────────────────────────────────────────
function Arrow() {
  return (
    <svg width="12" height="9" viewBox="0 0 14 10" fill="none" aria-hidden="true">
      <path
        d="M1 5H12.5M8.5 1L12.5 5L8.5 9"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
    <span style={{ color: "#c9a84c", fontSize: "11px", letterSpacing: "1.5px" }}>
      {"★".repeat(Math.floor(rating))}
    </span>
  );
}

// ─── Static product data (in a real app this comes from params/API) ─
const PRODUCT = {
  name: "Athletic Zip Hoodie",
  price: "₹47,000.00",
  description:
    "A refined take on the everyday essential. Cut from our signature brushed-cotton blend, this hoodie pairs relaxed structure with purposeful detailing — zip placket, tonal stitching, and a fit that works as hard as you do.",
  colors: [
    { name: "Heather Grey", hex: "#9ca3af" },
    { name: "Burgundy",     hex: "#7f1d1d" },
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
  { slug: "textured-thermal-white",   name: "Textured Thermal – White", price: "₹16,000", image: "/products/item-4.webp",  rating: 4.8 },
  { slug: "textured-thermal-white-2", name: "Textured Thermal – White", price: "₹16,000", image: "/products/item-4.webp",  rating: 4.8 },
  { slug: "textured-thermal-white-3", name: "Textured Thermal – White", price: "₹16,000", image: "/products/item-4.webp",  rating: 4.8 },
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
  const [selectedSize, setSelectedSize]   = useState("");
  const [activeImg, setActiveImg]         = useState(0);
  const [added, setAdded]                 = useState(false);

  const handleAddToBag = () => {
    if (!selectedSize) return;
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <>
      <Navbar />

      <main className="pdp-main">

        {/* ════════════════════════════════════════════════
            TWO-COLUMN LAYOUT
        ════════════════════════════════════════════════ */}
        <div className="pdp-columns">

          {/* ── LEFT: IMAGE PANEL ──────────────────────── */}
          <div className="pdp-left">
            {/* Thumbnail strip */}
            <div className="pdp-thumbs">
              {PRODUCT.images.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  className={`pdp-thumb${activeImg === i ? " active" : ""}`}
                  onClick={() => setActiveImg(i)}
                  aria-label={`View image ${i + 1}`}
                >
                  <Image src={src} alt="" fill className="object-cover" quality={70} sizes="60px" />
                </button>
              ))}
            </div>

            {/* Main image */}
            <div className="pdp-main-img">
              <Image
                src={PRODUCT.images[activeImg]}
                alt={PRODUCT.name}
                fill
                priority
                quality={70}
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover object-center"
              />
            </div>
          </div>

          {/* ── RIGHT: PRODUCT INFO PANEL ──────────────── */}
          <div className="pdp-right">

            {/* Breadcrumb */}
            <nav className="pdp-breadcrumb" aria-label="Breadcrumb">
              <Link href="/collection">Collection</Link>
              <span>/</span>
              <span>{PRODUCT.name}</span>
            </nav>

            {/* Title + price */}
            <h1 className="pdp-title">{PRODUCT.name}</h1>
            <p className="pdp-price">Rs. {PRODUCT.price}</p>

            {/* Divider */}
            <div className="pdp-divider" />

            {/* Color selector */}
            <div className="pdp-field">
              <p className="pdp-field-label">
                COLOR — <span style={{ fontWeight: 400, textTransform: "none" }}>{selectedColor}</span>
              </p>
              <div className="pdp-color-row">
                {PRODUCT.colors.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    aria-label={c.name}
                    onClick={() => setSelectedColor(c.name)}
                    className={`pdp-color-swatch${selectedColor === c.name ? " active" : ""}`}
                    style={{ background: c.hex }}
                  />
                ))}
              </div>
            </div>

            {/* Size selector */}
            <div className="pdp-field">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <p className="pdp-field-label">SIZE</p>
                <button type="button" className="pdp-size-chart">SIZE CHART</button>
              </div>

              <div className="pdp-size-row">
                {PRODUCT.sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSelectedSize(s)}
                    className={`pdp-size-btn${selectedSize === s ? " active" : ""}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Add to bag */}
            <button
              type="button"
              onClick={handleAddToBag}
              disabled={!selectedSize}
              className="pdp-add-btn"
            >
              {added ? "ADDED ✓" : "ADD TO BAG"}
            </button>
            {!selectedSize && (
              <p className="pdp-size-hint">Please select a size</p>
            )}

            {/* Divider */}
            <div className="pdp-divider" style={{ margin: "24px 0" }} />

            {/* Accordions */}
            <Accordion label="Details">
              <p>{PRODUCT.details}</p>
            </Accordion>
            <Accordion label="Size & Fit">
              <p>{PRODUCT.sizeFit}</p>
            </Accordion>
            <Accordion label="Shipping">
              <p>{PRODUCT.shipping}</p>
            </Accordion>

            {/* ── MORE WAYS TO WEAR IT ───────────────── */}
            <div className="pdp-related">
              <div className="pdp-related-header">
                <span className="pdp-related-title">MORE WAYS TO WEAR IT</span>
                <Link href="/collection" className="pdp-view-all">
                  VIEW ALL &nbsp;<Arrow />
                </Link>
              </div>

              <div className="pdp-related-grid">
                {RELATED.map((r) => (
                  <Link key={r.slug} href={`/collection/${r.slug}`} className="pdp-related-card group" style={{ textDecoration: "none" }}>
                    <div className="pdp-related-img">
                      <Image
                        src={r.image}
                        alt={r.name}
                        fill
                        quality={70}
                        sizes="(max-width: 768px) 33vw, 15vw"
                        className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.03]"
                      />
                    </div>
                    <p className="pdp-related-name">{r.name}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "3px" }}>
                      <Stars rating={r.rating} />
                    </div>
                    <p className="pdp-related-price">{r.price}</p>
                  </Link>
                ))}
              </div>
            </div>

          </div>
        </div>
      </main>

      <Footer />

      <style jsx global>{`
        /* ── BASE ── */
        .pdp-main {
          background: #fff;
          color: #111;
          min-height: 100vh;
          padding-top: 68px; /* navbar height */
        }

        /* ── TWO COLUMNS ── */
        .pdp-columns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: calc(100vh - 68px);
        }

        /* ══════════════════════
           LEFT PANEL
        ══════════════════════ */
        .pdp-left {
          position: relative;
          display: flex;
          gap: 10px;
          padding: 24px clamp(12px, 2.5vw, 32px) 24px clamp(16px, 4vw, 56px);
          background: #f7f4ef;
        }

        /* Thumbnail strip — vertical on left side */
        .pdp-thumbs {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 0 0 52px;
        }

        .pdp-thumb {
          position: relative;
          width: 52px;
          height: 64px;
          border: 1px solid transparent;
          overflow: hidden;
          background: #e8e5df;
          cursor: pointer;
          transition: border-color 150ms ease;
          padding: 0;
        }

        .pdp-thumb.active {
          border-color: #111;
        }

        /* Main product image */
        .pdp-main-img {
          position: relative;
          flex: 1;
          aspect-ratio: 3 / 4;
          overflow: hidden;
          background: #e8e5df;
        }

        /* ══════════════════════
           RIGHT PANEL
        ══════════════════════ */
        .pdp-right {
          padding: 32px clamp(24px, 4vw, 56px) 60px clamp(24px, 3vw, 48px);
          overflow-y: auto;
        }

        /* Breadcrumb */
        .pdp-breadcrumb {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 20px;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 9px;
          color: rgba(0,0,0,0.4);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .pdp-breadcrumb a {
          color: rgba(0,0,0,0.4);
          text-decoration: none;
          transition: color 150ms;
        }

        .pdp-breadcrumb a:hover {
          color: #111;
        }

        /* Title */
        .pdp-title {
          margin: 0;
          font-family: "Cormorant Garamond", Georgia, serif;
          font-size: clamp(22px, 2.4vw, 34px);
          font-weight: 400;
          line-height: 1.1;
          letter-spacing: 0.2px;
          color: #111;
          text-transform: capitalize;
        }

        /* Price */
        .pdp-price {
          margin: 8px 0 0;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 12px;
          font-weight: 400;
          color: rgba(0,0,0,0.55);
        }

        /* Divider */
        .pdp-divider {
          width: 100%;
          height: 1px;
          background: rgba(0,0,0,0.1);
          margin: 20px 0;
        }

        /* Field label */
        .pdp-field {
          margin-bottom: 20px;
        }

        .pdp-field-label {
          margin: 0 0 10px;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          color: rgba(0,0,0,0.55);
        }

        /* Color swatches */
        .pdp-color-row {
          display: flex;
          gap: 8px;
        }

        .pdp-color-swatch {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid transparent;
          outline: 1px solid transparent;
          cursor: pointer;
          transition: outline-color 150ms ease;
          padding: 0;
        }

        .pdp-color-swatch.active {
          outline-color: #111;
          outline-offset: 2px;
        }

        /* Size buttons */
        .pdp-size-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 4px;
        }

        .pdp-size-btn {
          width: 44px;
          height: 36px;
          border: 1px solid rgba(0,0,0,0.2);
          background: transparent;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 10px;
          font-weight: 500;
          color: #111;
          cursor: pointer;
          transition: border-color 150ms, background 150ms, color 150ms;
        }

        .pdp-size-btn:hover {
          border-color: #111;
        }

        .pdp-size-btn.active {
          background: #111;
          color: #fff;
          border-color: #111;
        }

        /* Size chart link */
        .pdp-size-chart {
          padding: 0;
          border: none;
          border-bottom: 1px solid rgba(0,0,0,0.3);
          background: transparent;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 8px;
          font-weight: 500;
          letter-spacing: 0.5px;
          color: rgba(0,0,0,0.45);
          cursor: pointer;
          text-transform: uppercase;
          transition: color 150ms;
        }

        .pdp-size-chart:hover {
          color: #111;
        }

        /* Add to bag */
        .pdp-add-btn {
          width: 100%;
          height: 48px;
          border: none;
          background: #111;
          color: #fff;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 180ms ease, transform 180ms ease;
        }

        .pdp-add-btn:disabled {
          background: rgba(0,0,0,0.25);
          cursor: not-allowed;
        }

        .pdp-add-btn:not(:disabled):hover {
          background: #2a2a2a;
          transform: translateY(-1px);
        }

        .pdp-size-hint {
          margin: 6px 0 0;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 9px;
          color: rgba(0,0,0,0.4);
          text-align: center;
        }

        /* ── ACCORDIONS ── */
        .pdp-accordion {
          border-top: 1px solid rgba(0,0,0,0.1);
        }

        .pdp-accordion:last-of-type {
          border-bottom: 1px solid rgba(0,0,0,0.1);
        }

        .pdp-accordion-trigger {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 0;
          border: none;
          background: transparent;
          font-family: "Cormorant Garamond", Georgia, serif;
          font-size: 14px;
          font-weight: 400;
          letter-spacing: 0.3px;
          color: #111;
          cursor: pointer;
          text-align: left;
          text-transform: capitalize;
        }

        .pdp-accordion-body {
          padding: 0 0 16px;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 11px;
          font-weight: 400;
          line-height: 1.6;
          color: rgba(0,0,0,0.6);
        }

        /* ── RELATED / MORE WAYS ── */
        .pdp-related {
          margin-top: 32px;
        }

        .pdp-related-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .pdp-related-title {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #111;
        }

        .pdp-view-all {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.4px;
          text-transform: uppercase;
          color: #111;
          text-decoration: none;
          transition: opacity 150ms;
        }

        .pdp-view-all:hover {
          opacity: 0.5;
        }

        .pdp-related-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .pdp-related-card {
          display: block;
          cursor: pointer;
        }

        .pdp-related-img {
          position: relative;
          width: 100%;
          aspect-ratio: 3 / 4;
          overflow: hidden;
          background: #f0ede8;
        }

        .pdp-related-name {
          margin: 8px 0 0;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 9px;
          font-weight: 500;
          color: #111;
          line-height: 1.3;
        }

        .pdp-related-price {
          margin: 4px 0 0;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 10px;
          font-weight: 500;
          color: #111;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 768px) {
          .pdp-columns {
            grid-template-columns: 1fr;
          }

          .pdp-left {
            padding: 16px;
          }

          .pdp-right {
            padding: 24px 16px 48px;
          }

          .pdp-main-img {
            aspect-ratio: 4 / 5;
          }
        }
      `}</style>
    </>
  );
}
