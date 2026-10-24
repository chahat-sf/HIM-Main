"use client";

import Image from "next/image";
import Link from "next/link";
import PdpNavbar from "@/components/PdpNavbar";
import Footer from "@/components/Footer";
import Dropdown from "@/components/Dropdown";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import type { CatalogProduct } from "@/lib/catalog-types";
import { productDetailsProse } from "@/lib/catalog-types";
import { DUMMY_BLOCKS, FOCUS, focusTransform } from "@/lib/pdp-chrome";

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

// ─── Outfit PDP (sticky left + scroll-linked zoom) ───────────────────
export default function PdpOutfit({
  product,
  related,
}: {
  product: CatalogProduct;
  related: CatalogProduct[];
}) {
  const slug = product.slug;
  const PRODUCT = {
    name: product.name,
    price: product.price,
    description: product.description,
    colors: product.colors,
    sizes: product.sizes,
    images: product.images,
    details: productDetailsProse(product),
    sizeFit: product.sizeFit,
    shipping: product.shipping,
  };

  const [selectedColor, setSelectedColor] = useState(
    PRODUCT.colors[0]?.name ?? "",
  );
  const [selectedSize, setSelectedSize] = useState("");
  const [activeImg, setActiveImg] = useState(0);
  const [added, setAdded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [bagError, setBagError] = useState("");
  const [focusId, setFocusId] = useState("intro");
  const rightRef = useRef<HTMLDivElement>(null);
  const { addItem } = useCart();
  const { has: inWishlist, toggle: toggleWishlist } = useWishlist();
  const wishlisted = inWishlist(slug);

  // Reset per-product state whenever the slug changes
  useEffect(() => {
    setSelectedColor(PRODUCT.colors[0]?.name ?? "");
    setSelectedSize("");
    setActiveImg(0);
    setAdded(false);
    setAdding(false);
    setBagError("");
    setFocusId("intro");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

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

  const handleAddToBag = async () => {
    if (!selectedSize) {
      setBagError("Please select a size");
      return;
    }
    if (adding) return;

    setBagError("");
    setAdding(true);

    const priceRupees = Math.round(product.priceCents / 100) || 0;

    try {
      await addItem({
        productId: product.id,
        slug,
        name: product.name,
        size: selectedSize,
        color: selectedColor,
        price: priceRupees,
        qty: 1,
        image: product.image || PRODUCT.images[0] || "/products/man-image-100.webp",
        swatches: PRODUCT.colors.map((c) => c.hex),
      });
      setAdded(true);
      setSelectedSize("");
      window.setTimeout(() => setAdded(false), 2000);
    } catch {
      setBagError("Unable to add to bag. Please try again.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <>
      <PdpNavbar />

      <main className="pdp-main">
        <div className="pdp-columns">

          {/* ── LEFT: IMAGE PANEL ──────────────────────── */}
          <div className="pdp-left">
            <div className="pdp-left-inner">
              {/* Vertical thumbnail strip — desktop only */}
              <div className="pdp-thumbs" role="listbox" aria-label="Product images">
                {PRODUCT.images.map((src, i) => (
                  <button
                    key={src}
                    type="button"
                    role="option"
                    aria-selected={activeImg === i}
                    aria-label={`View image ${i + 1}`}
                    className={`pdp-thumb${activeImg === i ? " active" : ""}`}
                    onClick={() => setActiveImg(i)}
                  >
                    <Image
                      src={src}
                      alt=""
                      fill
                      quality={60}
                      sizes="80px"
                      className="object-cover object-center"
                    />
                  </button>
                ))}
              </div>

              {/* Main hero image */}
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
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 45vw, 36vw"
                      className={`pdp-main-img-frame object-cover object-center${i === activeImg ? " active" : ""}`}
                    />
                  ))}
                </div>

                {/* Mobile prev/next arrows */}
                {imageCount > 1 && (
                  <>
                    <button
                      type="button"
                      className="pdp-mob-arrow pdp-mob-arrow--prev"
                      onClick={() => rotate(-1)}
                      aria-label="Previous image"
                    >
                      <svg width="8" height="14" viewBox="0 0 8 14" fill="none" aria-hidden="true">
                        <path d="M7 1L1 7L7 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="pdp-mob-arrow pdp-mob-arrow--next"
                      onClick={() => rotate(1)}
                      aria-label="Next image"
                    >
                      <svg width="8" height="14" viewBox="0 0 8 14" fill="none" aria-hidden="true">
                        <path d="M1 1L7 7L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </>
                )}

                {/* Mobile dot indicators */}
                {imageCount > 1 && (
                  <div className="pdp-mob-dots" role="tablist" aria-label="Image indicators">
                    {PRODUCT.images.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        role="tab"
                        aria-selected={activeImg === i}
                        aria-label={`Go to image ${i + 1}`}
                        className={`pdp-mob-dot${activeImg === i ? " active" : ""}`}
                        onClick={() => setActiveImg(i)}
                      />
                    ))}
                  </div>
                )}

                {/* Desktop rotate control */}
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
          </div>

          {/* ── RIGHT: PRODUCT INFO PANEL ──────────────── */}
          <div className="pdp-right" ref={rightRef}>
            <h1 className="pdp-title" data-pdp-focus="intro">{PRODUCT.name}</h1>
            <p className="pdp-price">Rs. {PRODUCT.price}</p>

            <div className="pdp-divider" />

            {PRODUCT.colors.length > 0 && (
              <>
                <p className="pdp-field-label">
                  COLOR:{" "}
                  <span className="pdp-field-value">{selectedColor}</span>
                </p>
                <div className="pdp-color-row">
                  {PRODUCT.colors.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      aria-label={c.name}
                      aria-pressed={selectedColor === c.name}
                      onClick={() => {
                        setSelectedColor(c.name);
                        setBagError("");
                      }}
                      className={`pdp-color-swatch${selectedColor === c.name ? " active" : ""}`}
                      style={{ background: c.hex }}
                    />
                  ))}
                </div>
                <div className="pdp-divider" />
              </>
            )}

            {/* Size selector */}
            <div className="pdp-size-head">
              <label htmlFor="pdp-size" className="pdp-field-label">SIZE</label>
              <button type="button" className="pdp-size-chart">SIZE CHART</button>
            </div>
            <Dropdown
              id="pdp-size"
              options={PRODUCT.sizes}
              value={selectedSize}
              onChange={(value) => {
                setSelectedSize(value);
                setBagError("");
              }}
              placeholder="Select Size"
              aria-label="Select size"
              className="pdp-size-dropdown"
            />

            {/* Add to bag + wishlist */}
            <div className="pdp-bag-row">
              <button
                type="button"
                onClick={() => void handleAddToBag()}
                disabled={adding}
                aria-disabled={!selectedSize || adding}
                className={`pdp-add-btn${!selectedSize ? " is-waiting-size" : ""}`}
              >
                {adding
                  ? "ADDING…"
                  : added
                    ? "ADDED TO BAG"
                    : "ADD TO BAG"}
              </button>
              <button
                type="button"
                className={`pdp-wish-btn${wishlisted ? " is-active" : ""}`}
                aria-label={
                  wishlisted ? "Remove from wishlist" : "Add to wishlist"
                }
                aria-pressed={wishlisted}
                onClick={() => {
                  void toggleWishlist({
                    productId: product.id,
                    slug,
                    name: product.name,
                    price: Math.round(product.priceCents / 100) || 0,
                    image:
                      product.image ||
                      PRODUCT.images[0] ||
                      "/products/man-image-100.webp",
                    swatches: PRODUCT.colors.map((c) => c.hex),
                  });
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill={wishlisted ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="1.4"
                  aria-hidden="true"
                >
                  <path d="M20.8 8.8c0 5.2-8.8 10.2-8.8 10.2S3.2 14 3.2 8.8A4.7 4.7 0 0 1 8 4c1.8 0 3.2.9 4 2.2C12.8 4.9 14.2 4 16 4a4.7 4.7 0 0 1 4.8 4.8Z" />
                </svg>
              </button>
            </div>
            {bagError && <p className="pdp-bag-error">{bagError}</p>}

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
                <h2 id="pdp-related-title" className="pdp-related-title">Style it your way</h2>
                <Link href="/collection" className="pdp-view-all">VIEW ALL</Link>
              </div>

              <div className="pdp-related-grid">
                {related.map((r) => (
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
                    <Stars rating={4.8} />
                    {r.swatches[0] && (
                      <span
                        className="pdp-related-dot"
                        style={{ background: r.swatches[0] }}
                        aria-hidden="true"
                      />
                    )}
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

        .pdp-left-inner {
          display: flex;
          flex-direction: row;
          height: calc(100svh - var(--pdp-nav-h));
        }

        /* ── Thumbnail strip ── */
        .pdp-thumbs {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 12px 10px;
          overflow-y: auto;
          scrollbar-width: none;
          background: #fff;
          flex-shrink: 0;
          width: 72px;
        }

        .pdp-thumbs::-webkit-scrollbar {
          display: none;
        }

        .pdp-thumb {
          position: relative;
          width: 52px;
          height: 64px;
          flex-shrink: 0;
          padding: 0;
          border: 1px solid transparent;
          background: #e9e6e1;
          cursor: pointer;
          transition: border-color 200ms ease;
          overflow: hidden;
        }

        .pdp-thumb:hover {
          border-color: rgba(0, 0, 0, 0.3);
        }

        .pdp-thumb.active {
          border-color: var(--pdp-ink);
        }

        .pdp-main-img {
          position: relative;
          flex: 1;
          height: 100%;
          overflow: hidden;
          background: #e9e6e1;
        }

        /* ── Mobile arrows (hidden on desktop) ── */
        .pdp-mob-arrow {
          display: none;
        }

        /* ── Mobile dot indicators (hidden on desktop) ── */
        .pdp-mob-dots {
          display: none;
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

        /* Add to bag + wishlist */
        .pdp-bag-row {
          display: flex;
          gap: 10px;
          margin-top: calc(31 * var(--u));
          align-items: stretch;
        }

        .pdp-add-btn {
          flex: 1;
          width: auto;
          height: max(44px, calc(56 * var(--u)));
          margin-top: 0;
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

        .pdp-wish-btn {
          flex: 0 0 max(44px, calc(56 * var(--u)));
          width: max(44px, calc(56 * var(--u)));
          height: max(44px, calc(56 * var(--u)));
          border: 1px solid rgba(17, 17, 17, 0.22);
          background: transparent;
          color: var(--pdp-ink);
          display: grid;
          place-items: center;
          cursor: pointer;
          transition: color 200ms ease, border-color 200ms ease, background 200ms ease;
        }

        .pdp-wish-btn:hover {
          border-color: var(--pdp-ink);
        }

        .pdp-wish-btn.is-active {
          color: #7a1420;
          border-color: #7a1420;
        }

        .pdp-add-btn:hover {
          background: #2a2a2a;
        }

        .pdp-add-btn:active {
          transform: scale(0.992);
        }

        .pdp-add-btn:disabled,
        .pdp-add-btn.is-waiting-size {
          opacity: 0.4;
          cursor: default;
          transform: none;
        }

        .pdp-add-btn:disabled:hover,
        .pdp-add-btn.is-waiting-size:hover {
          background: var(--pdp-ink);
        }

        .pdp-bag-error {
          margin: 10px 0 0;
          font-family: var(--pdp-sans);
          font-size: 11px;
          letter-spacing: 0.04em;
          color: #b42318;
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
          .pdp-add-btn,
          .pdp-thumb,
          .pdp-mob-arrow,
          .pdp-mob-dot {
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
            --pdp-nav-h: 92px;
          }

          /* Single column — image on top, info below */
          .pdp-columns {
            display: block;
          }

          /* Left panel is no longer sticky on mobile */
          .pdp-left {
            position: relative;
            top: 0;
          }

          .pdp-left-inner {
            flex-direction: column;
            height: auto;
          }

          /* Hide vertical thumb strip on mobile */
          .pdp-thumbs {
            display: none;
          }

          /* Hero takes full width, square-ish aspect */
          .pdp-main-img {
            width: 100%;
            height: 0;
            padding-bottom: 100%;
            flex: none;
          }

          /* Hide desktop rotate control on mobile */
          .pdp-rotate {
            display: none;
          }

          /* Show mobile prev/next arrows */
          .pdp-mob-arrow {
            display: grid;
            place-items: center;
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            z-index: 3;
            width: 36px;
            height: 36px;
            padding: 0;
            border: none;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.9);
            color: #111;
            cursor: pointer;
            box-shadow: 0 1px 6px rgba(0,0,0,0.12);
            backdrop-filter: blur(4px);
            transition: background 150ms ease;
          }

          .pdp-mob-arrow:hover {
            background: #fff;
          }

          .pdp-mob-arrow--prev {
            left: 14px;
          }

          .pdp-mob-arrow--next {
            right: 14px;
          }

          /* Show dot indicators */
          .pdp-mob-dots {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 6px;
            position: absolute;
            bottom: 14px;
            left: 0;
            right: 0;
            z-index: 3;
          }

          .pdp-mob-dot {
            width: 20px;
            height: 2px;
            padding: 0;
            border: none;
            border-radius: 1px;
            background: rgba(0, 0, 0, 0.2);
            cursor: pointer;
            transition: background 200ms ease, width 200ms ease;
          }

          .pdp-mob-dot.active {
            background: var(--pdp-ink);
            width: 28px;
          }

          /* Right panel becomes full-width below the image */
          .pdp-right {
            padding: 24px 16px 64px;
          }

          .pdp-title {
            font-size: 24px;
          }

          .pdp-divider {
            margin: 20px 0 24px;
          }

          .pdp-accordions {
            margin-top: 24px;
          }

          .pdp-accordion-trigger {
            height: 52px;
            font-size: 16px;
          }

          .pdp-related {
            margin-top: 48px;
          }

          .pdp-related-title {
            font-size: 17px;
          }

          .pdp-related-grid {
            gap: 10px;
          }
        }

        @media (min-width: 769px) and (max-width: 1280px) {
          .pdp-main {
            --u: 0.8px;
          }

          .pdp-columns {
            grid-template-columns: 50% 50%;
          }

          .pdp-rotate {
            top: 16px;
          }

          .pdp-thumbs {
            width: 60px;
            padding: 10px 8px;
          }

          .pdp-thumb {
            width: 44px;
            height: 54px;
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


