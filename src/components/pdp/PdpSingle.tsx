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
import { buildPdpMedia } from "@/lib/catalog-types";

function PlayBadge() {
  return (
    <span className="pdp-thumb-play" aria-hidden="true">
      <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor">
        <path d="M3 1.5v9l8-4.5L3 1.5Z" />
      </svg>
    </span>
  );
}

function PlusIcon({ open }: { open: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <line
        x1="6"
        y1="0"
        x2="6"
        y2="12"
        stroke="currentColor"
        strokeWidth="1"
        style={{
          opacity: open ? 0 : 1,
          transition: "opacity 350ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      />
      <line x1="0" y1="6" x2="12" y2="6" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="pdp-related-stars" aria-label={`${rating} out of 5`}>
      {"★".repeat(Math.floor(rating))}
    </span>
  );
}

function Accordion({
  label,
  defaultOpen = false,
  children,
}: {
  label: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`pdp-accordion${open ? " open" : ""}`}>
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

/**
 * Single-article PDP: same 40/60 shell + buy box as outfit,
 * but left is a stacked image column (scrolls) and right is sticky.
 */
export default function PdpSingle({
  product,
  related,
}: {
  product: CatalogProduct;
  related: CatalogProduct[];
}) {
  const slug = product.slug;
  const MEDIA = buildPdpMedia(product);
  const PRODUCT = {
    name: product.name,
    title: product.title,
    price: product.price,
    description: product.description,
    colors: product.colors,
    sizes: product.sizes,
    images: product.images,
    details: product.details,
    fabric: product.fabric,
  };

  const [selectedColor, setSelectedColor] = useState(
    PRODUCT.colors[0]?.name ?? "",
  );
  const [selectedSize, setSelectedSize] = useState("");
  const [activeImg, setActiveImg] = useState(0);
  const [added, setAdded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [bagError, setBagError] = useState("");
  const shotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLElement | null>(null);
  const { addItem } = useCart();
  const { has: inWishlist, toggle: toggleWishlist } = useWishlist();
  const wishlisted = inWishlist(slug);
  const imageCount = MEDIA.length;

  const goCarousel = (step: number) => {
    if (imageCount < 1) return;
    setActiveImg((i) => {
      const next = (i + step + imageCount) % imageCount;
      const el = carouselRef.current;
      if (el) {
        const w = el.clientWidth;
        el.scrollTo({ left: next * w, behavior: "smooth" });
      }
      return next;
    });
  };

  const onCarouselScroll = () => {
    const el = carouselRef.current;
    if (!el || el.clientWidth < 1) return;
    const next = Math.round(el.scrollLeft / el.clientWidth);
    setActiveImg((i) => (next === i ? i : Math.max(0, Math.min(imageCount - 1, next))));
  };

  useEffect(() => {
    setSelectedColor(PRODUCT.colors[0]?.name ?? "");
    setSelectedSize("");
    setActiveImg(0);
    setAdded(false);
    setAdding(false);
    setBagError("");
    carouselRef.current?.scrollTo({ left: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 769px)");
    if (!mq.matches) return;

    const shots = shotRefs.current.filter(Boolean) as HTMLDivElement[];
    if (!shots.length) return;

    const pick = () => {
      if (!mq.matches) return;
      const line = window.innerHeight * 0.45;
      let next = 0;
      shots.forEach((el, i) => {
        if (el.getBoundingClientRect().top <= line) next = i;
      });
      setActiveImg(next);
    };

    const observer = new IntersectionObserver(pick, {
      root: null,
      rootMargin: "-30% 0px -50% 0px",
      threshold: [0, 1],
    });
    shots.forEach((el) => observer.observe(el));
    window.addEventListener("scroll", pick, { passive: true });
    mq.addEventListener("change", pick);
    pick();
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", pick);
      mq.removeEventListener("change", pick);
    };
  }, [slug, MEDIA.length]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.querySelectorAll<HTMLVideoElement>("video[data-pdp-media]").forEach((vid) => {
      const idx = Number(vid.dataset.pdpIndex);
      if (idx === activeImg) {
        void vid.play().catch(() => {});
      } else {
        vid.pause();
      }
    });
  }, [activeImg, slug]);

  const scrollToShot = (index: number) => {
    setActiveImg(index);
    shotRefs.current[index]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

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

  const category = product.category?.trim() || "";
  const categoryHref = category
    ? `/collection?category=${encodeURIComponent(category)}`
    : "/collection";
  const progressPct =
    imageCount > 0 ? ((activeImg + 1) / imageCount) * 100 : 0;

  return (
    <>
      <PdpNavbar />

      <main ref={rootRef} className="pdp-main pdp-single">
        <nav className="pdp-s-crumbs" aria-label="Breadcrumb">
          <ol className="pdp-s-crumbs-list">
            <li>
              <Link href="/">HOME</Link>
            </li>
            <li aria-hidden="true" className="pdp-s-crumbs-sep">
              &gt;
            </li>
            <li>
              <Link href="/collection">COLLECTION</Link>
            </li>
            {category ? (
              <>
                <li aria-hidden="true" className="pdp-s-crumbs-sep">
                  &gt;
                </li>
                <li>
                  <Link href={categoryHref}>{category}</Link>
                </li>
              </>
            ) : null}
          </ol>
        </nav>

        <div className="pdp-columns">
          {/* Left: desktop thumbs + stack; mobile carousel */}
          <div className="pdp-left pdp-single-left">
            {/* Mobile carousel (hidden on desktop) — native swipe via scroll-snap */}
            <div className="pdp-s-carousel">
              <div className="pdp-s-carousel-viewport">
                <div
                  ref={carouselRef}
                  className="pdp-s-carousel-stage"
                  onScroll={onCarouselScroll}
                >
                  {MEDIA.map((item, i) => (
                    <div
                      key={item.kind === "image" ? item.src : `video-${item.src}`}
                      className="pdp-s-carousel-slide"
                    >
                      {item.kind === "image" ? (
                        <Image
                          src={item.src}
                          alt={
                            i === 0
                              ? PRODUCT.name
                              : `${PRODUCT.name} view ${i + 1}`
                          }
                          fill
                          priority={i === 0}
                          quality={90}
                          sizes="100vw"
                          draggable={false}
                          className="pdp-s-carousel-frame object-contain object-center"
                        />
                      ) : (
                        <video
                          data-pdp-media
                          data-pdp-index={i}
                          className="pdp-s-carousel-frame pdp-media-video"
                          src={item.src}
                          poster={item.poster}
                          muted
                          playsInline
                          controls
                          loop
                          preload="metadata"
                          aria-label={`${PRODUCT.name} video`}
                        />
                      )}
                    </div>
                  ))}
                </div>
                {imageCount > 1 && (
                  <>
                    <button
                      type="button"
                      className="pdp-s-carousel-arrow pdp-s-carousel-arrow--prev"
                      aria-label="Previous image"
                      onClick={() => goCarousel(-1)}
                    >
                      <svg
                        width="10"
                        height="16"
                        viewBox="0 0 10 16"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M8.5 1L1.5 8l7 7"
                          stroke="currentColor"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="pdp-s-carousel-arrow pdp-s-carousel-arrow--next"
                      aria-label="Next image"
                      onClick={() => goCarousel(1)}
                    >
                      <svg
                        width="10"
                        height="16"
                        viewBox="0 0 10 16"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M1.5 1L8.5 8l-7 7"
                          stroke="currentColor"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </>
                )}
              </div>
              {imageCount > 1 && (
                <div
                  className="pdp-s-carousel-progress"
                  role="progressbar"
                  aria-valuemin={1}
                  aria-valuemax={imageCount}
                  aria-valuenow={activeImg + 1}
                  aria-label={`Image ${activeImg + 1} of ${imageCount}`}
                >
                  <span
                    className="pdp-s-carousel-progress-fill"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              )}
            </div>

            <div className="pdp-single-left-inner">
              <div
                className="pdp-thumbs"
                role="listbox"
                aria-label="Product images"
              >
                {MEDIA.map((item, i) => (
                  <button
                    key={item.kind === "image" ? item.src : `video-${item.src}`}
                    type="button"
                    role="option"
                    aria-selected={activeImg === i}
                    aria-label={
                      item.kind === "video"
                        ? "View product video"
                        : `View image ${i + 1}`
                    }
                    className={`pdp-thumb him-card-media${activeImg === i ? " active" : ""}${item.kind === "video" ? " is-video" : ""}`}
                    onClick={() => scrollToShot(i)}
                  >
                    <Image
                      src={item.kind === "image" ? item.src : item.poster}
                      alt=""
                      fill
                      quality={60}
                      sizes="80px"
                      className="object-cover object-top"
                      style={{ objectFit: "cover", objectPosition: "top center" }}
                    />
                    {item.kind === "video" ? <PlayBadge /> : null}
                  </button>
                ))}
              </div>

              <div className="pdp-single-stack">
                {MEDIA.map((item, i) => (
                  <div
                    key={item.kind === "image" ? item.src : `video-${item.src}`}
                    className="pdp-single-shot"
                    ref={(el) => {
                      shotRefs.current[i] = el;
                    }}
                    style={{ scrollMarginTop: "var(--pdp-nav-h)" }}
                  >
                    {item.kind === "image" ? (
                      <Image
                        src={item.src}
                        alt={
                          i === 0
                            ? PRODUCT.name
                            : `${PRODUCT.name} view ${i + 1}`
                        }
                        width={1200}
                        height={1500}
                        priority={i < 2}
                        quality={90}
                        sizes="(max-width: 768px) 100vw, 40vw"
                        className="pdp-single-shot-img"
                      />
                    ) : (
                      <video
                        data-pdp-media
                        data-pdp-index={i}
                        className="pdp-media-video pdp-single-shot-img"
                        src={item.src}
                        poster={item.poster}
                        muted
                        playsInline
                        controls
                        loop
                        preload="metadata"
                        aria-label={`${PRODUCT.name} video`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: same buy box as outfit — sticky while left scrolls */}
          <div className="pdp-right pdp-single-right">
            <h1 className="pdp-title">{PRODUCT.name}</h1>
            {PRODUCT.title ? (
              <p className="pdp-subtitle">{PRODUCT.title}</p>
            ) : null}
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

            <div className="pdp-size-head">
              <label htmlFor="pdp-s-size" className="pdp-field-label">
                SIZE
              </label>
              <button type="button" className="pdp-size-chart">
                SIZE CHART
              </button>
            </div>
            <Dropdown
              id="pdp-s-size"
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

            <div className="pdp-accordions">
              <Accordion label={`About ${PRODUCT.title}`} defaultOpen>
                {PRODUCT.description && <p>{PRODUCT.description}</p>}
                {PRODUCT.details.length > 0 && (
                  <ul className="pdp-details-list">
                    {PRODUCT.details.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </Accordion>
              <Accordion label="Fabric">
                <p>{PRODUCT.fabric}</p>
              </Accordion>
            </div>
          </div>
        </div>

        {/* Below the gallery so page scroll advances left images first */}
        <section className="pdp-related" aria-labelledby="pdp-related-title">
          <div className="pdp-related-header">
            <h2 id="pdp-related-title" className="pdp-related-title">
              Style it your way
            </h2>
            <Link href="/collection" className="pdp-view-all">
              VIEW ALL
            </Link>
          </div>

          <div className="pdp-related-grid">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/collection/${r.slug}`}
                className="pdp-related-card group"
              >
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
      </main>

      <Footer />

      <style jsx global>{`
        .pdp-main {
          --pdp-ink: #111;
          --pdp-muted: #6b6b6b;
          --pdp-rule: #1a1a1a;
          --pdp-serif: var(--font-room-serif, "Cormorant Garamond"), Georgia,
            serif;
          --pdp-sans: "Helvetica Neue", Helvetica, Arial, sans-serif;
          background: #fff;
          color: var(--pdp-ink);
          --u: calc(min(100vw, 1440px) / 1440);
          /* Match PdpNavbar.module.css --pdp-nav-h (logo bar; mobile adds explore strip) */
          --pdp-nav-h: 68px;
          padding-top: var(--pdp-nav-h);
        }

        .pdp-columns {
          display: grid;
          grid-template-columns: 40% 60%;
          align-items: start;
        }

        /* Breadcrumbs — compact Kith-style caps; full-bleed section rule */
        .pdp-s-crumbs {
          position: relative;
          z-index: 1;
          width: 100%;
          box-sizing: border-box;
          padding: 18px calc(24 * var(--u));
          background: #fff;
          /* Kith breadcrumb band: border-t above crumbs */
          border-top: 1px solid #d9d9d9;
          /* Collapse with PdpNavbar’s bottom edge into one crisp rule */
          margin-top: -1px;
        }

        .pdp-s-crumbs-list {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 6px;
          margin: 0;
          padding: 0;
          list-style: none;
          font-family: var(--pdp-sans);
          font-size: 10px;
          font-weight: 400;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(17, 17, 17, 0.55);
        }

        .pdp-s-crumbs-list a {
          color: inherit;
          text-decoration: none;
          transition: color 180ms ease;
        }

        .pdp-s-crumbs-list a:hover {
          color: var(--pdp-ink);
        }

        .pdp-s-crumbs-sep {
          color: rgba(0, 0, 0, 0.28);
          font-weight: 300;
        }

        /* Mobile carousel — desktop hidden */
        .pdp-s-carousel {
          display: none;
        }

        /* Single: left scrolls (stacked shots), right sticks */
        .pdp-single .pdp-single-left {
          position: relative;
          top: auto;
          align-self: stretch;
          background: #fff;
          animation: pdp-fade-in 0.9s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .pdp-single-left-inner {
          display: flex;
          flex-direction: row;
          align-items: flex-start;
        }

        .pdp-single .pdp-thumbs {
          position: sticky;
          top: var(--pdp-nav-h);
          align-self: flex-start;
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 0 10px 12px;
          max-height: calc(100svh - var(--pdp-nav-h));
          overflow-y: auto;
          scrollbar-width: none;
          background: #fff;
          flex-shrink: 0;
          width: 72px;
          z-index: 2;
        }

        .pdp-single .pdp-thumbs::-webkit-scrollbar {
          display: none;
        }

        .pdp-single .pdp-thumb {
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

        .pdp-single .pdp-thumb:hover {
          border-color: rgba(0, 0, 0, 0.3);
        }

        .pdp-single .pdp-thumb.active {
          border-color: var(--pdp-ink);
        }

        .pdp-single .pdp-thumb-play {
          position: absolute;
          inset: 0;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          background: rgba(0, 0, 0, 0.28);
          pointer-events: none;
        }

        .pdp-single-stack {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: #fff;
        }

        .pdp-single-shot {
          position: relative;
          width: 100%;
          line-height: 0;
          background: #e9e6e1;
        }

        .pdp-single-shot-img {
          width: 100%;
          height: auto;
          display: block;
        }

        .pdp-single-shot .pdp-media-video {
          width: 100%;
          height: auto;
          display: block;
          aspect-ratio: 4 / 5;
          object-fit: cover;
          object-position: center;
          background: #e9e6e1;
        }

        /* Buy box sticks; page scroll moves the left image stack */
        .pdp-single .pdp-single-right {
          position: sticky;
          top: var(--pdp-nav-h);
          align-self: start;
          overflow: visible;
        }

        .pdp-right {
          width: 100%;
          max-width: none;
          box-sizing: border-box;
          /* Top flush with gallery; side/bottom keep buy-box breathing room */
          padding: 0 calc(96 * var(--u)) calc(96 * var(--u));
        }

        .pdp-right > * {
          animation: pdp-fade-up 0.75s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .pdp-right > *:nth-child(1) {
          animation-delay: 0.08s;
        }
        .pdp-right > *:nth-child(2) {
          animation-delay: 0.14s;
        }
        .pdp-right > *:nth-child(3) {
          animation-delay: 0.2s;
        }
        .pdp-right > *:nth-child(4) {
          animation-delay: 0.26s;
        }
        .pdp-right > *:nth-child(5) {
          animation-delay: 0.3s;
        }
        .pdp-right > *:nth-child(6) {
          animation-delay: 0.34s;
        }
        .pdp-right > *:nth-child(7) {
          animation-delay: 0.38s;
        }
        .pdp-right > *:nth-child(8) {
          animation-delay: 0.42s;
        }
        .pdp-right > *:nth-child(9) {
          animation-delay: 0.48s;
        }
        .pdp-right > *:nth-child(10) {
          animation-delay: 0.54s;
        }
        .pdp-right > *:nth-child(n + 11) {
          animation-delay: 0.6s;
        }

        @keyframes pdp-fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
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

        .pdp-subtitle {
          margin: calc(10 * var(--u)) 0 0;
          font-family: var(--pdp-sans);
          font-size: 12px;
          font-weight: 400;
          line-height: 1.35;
          letter-spacing: 0.04em;
          color: var(--pdp-muted);
        }

        .pdp-price {
          margin: calc(16 * var(--u)) 0 0;
          font-family: var(--pdp-sans);
          font-size: max(16px, calc(20 * var(--u)));
          font-weight: 500;
          letter-spacing: 0.04em;
          color: var(--pdp-ink);
        }

        .pdp-divider {
          width: 100%;
          height: 1px;
          background: var(--pdp-rule);
          margin: calc(18 * var(--u)) 0 calc(22 * var(--u));
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
          transition: color 200ms ease, border-color 200ms ease,
            background 200ms ease;
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

        .pdp-details-list {
          list-style: none;
          margin: 12px 0 0;
          padding: 0;
        }

        .pdp-details-list li {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .pdp-details-list li::before {
          content: "";
          flex-shrink: 0;
          width: 8px;
          height: 8px;
          margin-top: 0.55em;
          background: currentColor;
          -webkit-mask: url("/brand/loader-star.svg") center / contain no-repeat;
          mask: url("/brand/loader-star.svg") center / contain no-repeat;
        }

        .pdp-details-list li + li {
          margin-top: 6px;
        }

        .pdp-related {
          max-width: none;
          margin: 0;
          padding: calc(64 * var(--u)) calc(96 * var(--u)) calc(96 * var(--u));
          border-top: 1px solid rgba(0, 0, 0, 0.08);
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

        @media (prefers-reduced-motion: reduce) {
          .pdp-single-left,
          .pdp-right > *,
          .pdp-accordion-panel,
          .pdp-accordion-body,
          .pdp-add-btn {
            animation: none !important;
            transition: none !important;
          }

          .pdp-accordion-body {
            opacity: 1;
            transform: none;
          }
        }

        @media (max-width: 768px) {
          /* Must match PdpNavbar mobile --pdp-nav-h (56 + 36) */
          .pdp-main {
            --pdp-nav-h: 92px;
          }

          .pdp-s-crumbs {
            padding: 16px;
          }

          .pdp-columns {
            display: block;
          }

          .pdp-single-left-inner {
            display: none;
          }

          .pdp-s-carousel {
            display: block;
            background: #fff;
          }

          .pdp-s-carousel-viewport {
            position: relative;
            width: 100%;
            background: #e9e6e1;
          }

          .pdp-s-carousel-stage {
            display: flex;
            width: 100%;
            aspect-ratio: 4 / 5;
            overflow-x: auto;
            overflow-y: hidden;
            scroll-snap-type: x mandatory;
            scroll-behavior: smooth;
            -webkit-overflow-scrolling: touch;
            touch-action: pan-x;
            scrollbar-width: none;
            overscroll-behavior-x: contain;
          }

          .pdp-s-carousel-stage::-webkit-scrollbar {
            display: none;
          }

          .pdp-s-carousel-slide {
            position: relative;
            flex: 0 0 100%;
            width: 100%;
            height: 100%;
            scroll-snap-align: start;
            scroll-snap-stop: always;
            background: #e9e6e1;
          }

          .pdp-s-carousel-frame {
            user-select: none;
            -webkit-user-drag: none;
            pointer-events: none;
          }

          .pdp-s-carousel-frame.pdp-media-video {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            object-fit: contain;
            object-position: center;
            pointer-events: auto;
            background: #e9e6e1;
          }

          .pdp-s-carousel-arrow {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            z-index: 2;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 48px;
            padding: 0;
            border: none;
            background: transparent;
            color: rgba(0, 0, 0, 0.55);
            cursor: pointer;
            -webkit-tap-highlight-color: transparent;
          }

          .pdp-s-carousel-arrow:hover,
          .pdp-s-carousel-arrow:active {
            color: rgba(0, 0, 0, 0.85);
          }

          .pdp-s-carousel-arrow--prev {
            left: 2px;
          }

          .pdp-s-carousel-arrow--next {
            right: 2px;
          }

          .pdp-s-carousel-progress {
            position: relative;
            height: 2px;
            margin: 0;
            background: rgba(0, 0, 0, 0.12);
            overflow: hidden;
          }

          .pdp-s-carousel-progress-fill {
            display: block;
            height: 100%;
            background: #111;
            transition: width 280ms ease;
          }

          .pdp-single .pdp-single-right {
            position: static;
          }

          .pdp-right {
            padding: 24px 16px 64px;
          }

          .pdp-related {
            padding: 40px 16px 64px;
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

          .pdp-single .pdp-thumbs {
            width: 60px;
            padding: 0 8px 10px;
          }

          .pdp-single .pdp-thumb {
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
            padding: 48px 20px 64px;
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
