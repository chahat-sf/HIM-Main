"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import PdpNavbar from "@/components/PdpNavbar";
import Footer from "@/components/Footer";
import Dropdown from "@/components/Dropdown";
import { getProduct } from "@/lib/products";
import { useEffect, useRef, useState } from "react";

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

// ─── Plus / Minus icon for accordions ───────────────────────────────
function PlusIcon({ open }: { open: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <line x1="6" y1="0" x2="6" y2="12" stroke="currentColor" strokeWidth="1"
        style={{ opacity: open ? 0 : 1, transition: "opacity 350ms cubic-bezier(0.22, 1, 0.36, 1)" }} />
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

// ─── Scroll focus: which crop of the hero each right-column beat shows ─
// x / y are the focal point in % of the image box; tuned for pdp-hero.jpg.
type Focus = { scale: number; x: number; y: number };

const FOCUS: Record<string, Focus> = {
  intro: { scale: 1, x: 50, y: 50 },
  details: { scale: 2, x: 50, y: 0 },
  sizeFit: { scale: 2, x: 50, y: 0 },
  shipping: { scale: 1, x: 50, y: 50 },
  related: { scale: 1, x: 50, y: 50 },
  fabric: { scale: 1.9, x: 50, y: 66 },
  howToWear: { scale: 1.3, x: 50, y: 42 },
  care: { scale: 1.75, x: 50, y: 34 },
  provenance: { scale: 1.8, x: 44, y: 44 },
  fit: { scale: 1.45, x: 50, y: 72 },
  studio: { scale: 1, x: 50, y: 50 },
};

/** Translate that centres the focal point, clamped so no image edge shows. */
function focusTransform({ scale, x, y }: Focus) {
  const limit = ((scale - 1) / (2 * scale)) * 100;
  const clamp = (v: number) => Math.max(-limit, Math.min(limit, v));
  return `scale(${scale}) translate(${clamp(50 - x)}%, ${clamp(50 - y)}%)`;
}

const DUMMY_BLOCKS = [
  {
    focus: "fabric",
    title: "The Fabric Story",
    body: "Cut from a brushed cotton-blend developed for drape and recovery. The hand-feel softens with wear while the structure holds through the shoulder and sleeve. Each roll is dyed in small batches so tone stays consistent across colourways.",
  },
  {
    focus: "howToWear",
    title: "How To Wear",
    body: "Layer over a ribbed henley for cooler evenings, or wear open as a light outer. Pair with tailored trousers for evening and straight denim for day. Hardware is tonal so the piece reads clean under a coat.",
  },
  {
    focus: "care",
    title: "Care Notes",
    body: "Machine wash cold on a gentle cycle, inside out. Reshape while damp and dry flat. Avoid tumble drying and high heat. Steam lightly to release creases — do not iron directly over the zip tape.",
  },
  {
    focus: "provenance",
    title: "Provenance",
    body: "Patterned in our studio, cut and finished by a long-standing workshop we work with season after season. Trims are sourced for longevity: YKK zip, bonded tape, and bartack reinforcement at stress points.",
  },
  {
    focus: "fit",
    title: "Fit Philosophy",
    body: "Relaxed through the chest with a slightly tapered hem. Designed to sit clean over a tee without swimming. If you prefer a closer silhouette, size down; for layering room, stay true to size.",
  },
  {
    focus: "studio",
    title: "Studio Notes",
    body: "Photographed on location under soft window light. Colour on screen may vary by device. Swatches are the most accurate reference for Heather Grey and Burgundy before you commit.",
  },
];

const RELATED = [
  { slug: "textured-thermal-white", name: "Textured Thermal - White", price: "16,000", image: "/products/item-4.webp", rating: 4.8, color: "#111" },
  { slug: "textured-thermal-white-2", name: "Textured Thermal - White", price: "16,000", image: "/products/item-4.webp", rating: 4.8, color: "#111" },
  { slug: "textured-thermal-white-3", name: "Textured Thermal - White", price: "16,000", image: "/products/item-4.webp", rating: 4.8, color: "#111" },
];

// ─── Accordion row ───────────────────────────────────────────────────
function Accordion({ label, focus, children }: { label: string; focus?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`pdp-accordion${open ? " open" : ""}`} data-pdp-focus={focus}>
      <button
        type="button"
        className="pdp-accordion-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>{label}</span>
        <PlusIcon open={open} />
      </button>
      <div className="pdp-accordion-panel">
        <div className="pdp-accordion-body">{children}</div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────
function ProductDetailPage({ product: PRODUCT }: { product: ReturnType<typeof getProduct> }) {
  const [selectedColor, setSelectedColor] = useState(PRODUCT.colors[0].name);
  const [selectedSize, setSelectedSize] = useState("");
  const [activeImg, setActiveImg] = useState(0);
  const [added, setAdded] = useState(false);
  const [focusId, setFocusId] = useState("intro");
  const rightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rightRef.current;
    if (!root) return;
    const markers = Array.from(root.querySelectorAll<HTMLElement>("[data-pdp-focus]"));
    if (!markers.length) return;

    // The active beat is the last marker whose top has crossed the band's lower edge (55% down).
    const pick = () => {
      const line = window.innerHeight * 0.55;
      let next = "intro";
      for (const el of markers) {
        if (el.getBoundingClientRect().top <= line) next = el.dataset.pdpFocus ?? next;
      }
      setFocusId(next);
    };

    const observer = new IntersectionObserver(pick, {
      root: null,
      rootMargin: "-35% 0px -45% 0px",
      threshold: [0, 1],
    });
    markers.forEach((el) => observer.observe(el));
    // A fast fling can jump a short marker clean over the band without an intersection change.
    window.addEventListener("scrollend", pick);
    pick();
    return () => {
      observer.disconnect();
      window.removeEventListener("scrollend", pick);
    };
  }, []);

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
      <PdpNavbar />

      <main className="pdp-main">
        <div className="pdp-columns">

          {/* ── LEFT: IMAGE PANEL ──────────────────────── */}
          <div className="pdp-left">
            <div className="pdp-main-img">
              <div
                className="pdp-main-img-focus"
                style={{ transform: focusTransform(FOCUS[focusId] ?? FOCUS.intro) }}
              >
                {PRODUCT.images.map((src, i) => (
                  <Image
                    key={src}
                    src={src}
                    alt={i === activeImg ? PRODUCT.name : ""}
                    fill
                    priority={i === 0}
                    quality={90}
                    sizes="(max-width: 1280px) 50vw, 40vw"
                    className={`pdp-main-img-frame object-cover object-center${i === activeImg ? " active" : ""}`}
                  />
                ))}
              </div>

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
          <div className="pdp-right" ref={rightRef}>
            <h1 className="pdp-title" data-pdp-focus="intro">{PRODUCT.name}</h1>
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
            <Dropdown
              id="pdp-size"
              options={PRODUCT.sizes}
              value={selectedSize}
              onChange={setSelectedSize}
              placeholder="Select Size"
              aria-label="Select size"
              className="pdp-size-dropdown"
            />

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
              <Accordion label="Details" focus="details">
                <p>{PRODUCT.details}</p>
              </Accordion>
              <Accordion label="Size & Fit" focus="sizeFit">
                <p>{PRODUCT.sizeFit}</p>
              </Accordion>
              <Accordion label="Shipping" focus="shipping">
                <p>{PRODUCT.shipping}</p>
              </Accordion>
            </div>

            {/* ── MORE WAYS TO WEAR IT ───────────────── */}
            <section className="pdp-related" aria-labelledby="pdp-related-title" data-pdp-focus="related">
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

            {/* Dummy blocks — lengthen the right column for sticky scroll testing */}
            <section className="pdp-dummy" aria-hidden="true">
              {DUMMY_BLOCKS.map((block) => (
                <article key={block.title} className="pdp-dummy-block" data-pdp-focus={block.focus}>
                  <h3 className="pdp-dummy-title">{block.title}</h3>
                  <p className="pdp-dummy-body">{block.body}</p>
                </article>
              ))}
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
          --pdp-nav-h: 68px;
          padding-top: var(--pdp-nav-h);
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
          position: sticky;
          top: var(--pdp-nav-h);
          align-self: start;
          animation: pdp-fade-in 0.9s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .pdp-main-img {
          position: relative;
          width: 100%;
          height: calc(100svh - var(--pdp-nav-h));
          min-height: calc(100svh - var(--pdp-nav-h));
          overflow: hidden;
          background: #e9e6e1;
        }

        .pdp-main-img-focus {
          position: absolute;
          inset: 0;
          transform-origin: center center;
          transition: transform 0.85s cubic-bezier(0.22, 1, 0.36, 1);
          will-change: transform;
        }

        .pdp-main-img-frame {
          opacity: 0;
          transform: scale(1.02);
          transition:
            opacity 700ms cubic-bezier(0.22, 1, 0.36, 1),
            transform 900ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .pdp-main-img-frame.active {
          opacity: 1;
          transform: scale(1);
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

        .pdp-right > * {
          animation: pdp-fade-up 0.75s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .pdp-right > *:nth-child(1) { animation-delay: 0.08s; }
        .pdp-right > *:nth-child(2) { animation-delay: 0.14s; }
        .pdp-right > *:nth-child(3) { animation-delay: 0.2s; }
        .pdp-right > *:nth-child(4) { animation-delay: 0.26s; }
        .pdp-right > *:nth-child(5) { animation-delay: 0.3s; }
        .pdp-right > *:nth-child(6) { animation-delay: 0.34s; }
        .pdp-right > *:nth-child(7) { animation-delay: 0.38s; }
        .pdp-right > *:nth-child(8) { animation-delay: 0.42s; }
        .pdp-right > *:nth-child(9) { animation-delay: 0.48s; }
        .pdp-right > *:nth-child(10) { animation-delay: 0.54s; }
        .pdp-right > *:nth-child(n+11) { animation-delay: 0.6s; }

        @keyframes pdp-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes pdp-fade-up {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: none;
          }
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

        .pdp-size-dropdown {
          --dd-ink: var(--pdp-ink);
          --dd-muted: var(--pdp-muted);
          --dd-border: var(--pdp-ink);
          --dd-sans: var(--pdp-sans);
        }

        .pdp-size-dropdown button {
          height: max(42px, calc(52 * var(--u)));
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
          transition: background 280ms ease, transform 280ms ease;
        }

        .pdp-add-btn:hover {
          background: #2a2a2a;
        }

        .pdp-add-btn:active {
          transform: scale(0.992);
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
          transition: color 250ms ease;
        }

        .pdp-accordion-trigger:hover {
          color: #3a3a3a;
        }

        .pdp-accordion-trigger svg {
          margin-right: 4px;
        }

        .pdp-accordion-panel {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows 0.5s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .pdp-accordion.open .pdp-accordion-panel {
          grid-template-rows: 1fr;
        }

        .pdp-accordion-body {
          overflow: hidden;
          min-height: 0;
          padding: 0 0 0;
          font-family: var(--pdp-sans);
          font-size: 12px;
          line-height: 1.7;
          color: var(--pdp-muted);
          opacity: 0;
          transform: translateY(-8px);
          transition:
            opacity 0.4s cubic-bezier(0.22, 1, 0.36, 1),
            transform 0.5s cubic-bezier(0.22, 1, 0.36, 1),
            padding 0.5s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .pdp-accordion.open .pdp-accordion-body {
          opacity: 1;
          transform: none;
          padding: 0 0 24px;
        }

        .pdp-accordion-body p {
          margin: 0;
        }

        @media (prefers-reduced-motion: reduce) {
          .pdp-left,
          .pdp-right > *,
          .pdp-main-img-frame,
          .pdp-accordion-panel,
          .pdp-accordion-body,
          .pdp-accordion-trigger svg,
          .pdp-add-btn {
            animation: none !important;
            transition: none !important;
          }

          .pdp-main-img-frame {
            transform: none;
          }

          .pdp-main-img-focus {
            transform: none !important;
            transition: none !important;
          }

          .pdp-accordion-body {
            opacity: 1;
            transform: none;
          }
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

        /* ── DUMMY SCROLL FILL ── */
        .pdp-dummy {
          margin-top: calc(80 * var(--u));
          padding-bottom: calc(40 * var(--u));
        }

        .pdp-dummy-block {
          padding: calc(36 * var(--u)) 0;
          border-top: 1px solid rgba(0, 0, 0, 0.12);
        }

        .pdp-dummy-block:last-child {
          border-bottom: 1px solid rgba(0, 0, 0, 0.12);
        }

        .pdp-dummy-title {
          margin: 0 0 12px;
          font-family: var(--pdp-serif);
          font-size: max(17px, calc(20 * var(--u)));
          font-weight: 500;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--pdp-ink);
        }

        .pdp-dummy-body {
          margin: 0;
          max-width: 42em;
          font-family: var(--pdp-sans);
          font-size: 13px;
          line-height: 1.75;
          color: var(--pdp-muted);
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 768px) {
          .pdp-main {
            --pdp-nav-h: 96px; /* fixed bar + mobile link row */
          }
        }

        @media (max-width: 1280px) {
          .pdp-main {
            --u: 0.8px;
          }

          .pdp-columns {
            grid-template-columns: 50% 50%;
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

export default function ProductDetailRoute() {
  const params = useParams<{ slug: string }>();
  const slug = typeof params?.slug === "string" ? params.slug : "athletic-zip-hoodie";
  const product = getProduct(slug);
  return <ProductDetailPage key={product.slug} product={product} />;
}
