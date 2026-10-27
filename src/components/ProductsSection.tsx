"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Heart,
  ShoppingBag,
} from "lucide-react";
import { useWishlist } from "@/hooks/useWishlist";
import type { CatalogProduct } from "@/lib/catalog-types";
import ProductCardMedia from "@/components/ProductCardMedia";

// Shared black <-> white scroll-turn colors
const BG_DARK = "#0a0806";
const BG_LIGHT = "#fafafa"; // matches Figma light background
const TEXT_LIGHT = "#f7f3ea";
const TEXT_DARK = "#111111";
/** Same idea as hero SMOOTHING — eases scroll-turn so bg/fg don't hitch on raw scroll. */
const TURN_SMOOTHING = 0.12;

// Linear-interpolates between two hex colors by t (0–1).
function lerpColor(hexA: string, hexB: string, t: number): string {
  const clampT = Math.max(0, Math.min(1, t));
  const a = [
    parseInt(hexA.slice(1, 3), 16),
    parseInt(hexA.slice(3, 5), 16),
    parseInt(hexA.slice(5, 7), 16),
  ];
  const b = [
    parseInt(hexB.slice(1, 3), 16),
    parseInt(hexB.slice(3, 5), 16),
    parseInt(hexB.slice(5, 7), 16),
  ];
  const r = Math.round(a[0] + (b[0] - a[0]) * clampT);
  const g = Math.round(a[1] + (b[1] - a[1]) * clampT);
  const bl = Math.round(a[2] + (b[2] - a[2]) * clampT);
  return `rgb(${r}, ${g}, ${bl})`;
}

/* =====================================================================
   BESTSELLERS CAROUSEL (matches Figma)
===================================================================== */

const CARD_GAP = 16;
const SWIPE_MIN = 40; // px a drag must travel before it changes the image

type CarouselProduct = {
  slug: string;
  name: string;
  price: string;
  image: string;
  images?: string[];
  swatches: string[];
  id?: number;
  priceCents?: number;
};

function ExistingProductsGrid() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const { has: inWishlist, toggle: toggleWishlist } = useWishlist();
  const [products, setProducts] = useState<CarouselProduct[]>([]);
  // Per-card state, keyed by product slug
  const [cardImgIndex, setCardImgIndex] = useState<Record<string, number>>({});
  const [cardArmed, setCardArmed] = useState<Record<string, boolean>>({});

  // Swipe tracking (mouse drag + touch swipe on the image)
  const swipeRef = useRef<{
    id: number;
    x: number;
    y: number;
    slug: string;
    count: number;
    active: boolean;
  } | null>(null);
  const swipedRef = useRef(false);

  const getImgIndex = (slug: string) => cardImgIndex[slug] ?? 0;

  const hoverTimers = useRef<Record<string, number>>({});

  const stopAutoHover = (slug: string) => {
    if (hoverTimers.current[slug]) {
      window.clearInterval(hoverTimers.current[slug]);
      delete hoverTimers.current[slug];
    }
  };

  const startAutoHover = (slug: string, count: number) => {
    if (count <= 1) return;
    stopAutoHover(slug);
    hoverTimers.current[slug] = window.setInterval(() => {
      setCardImgIndex((prev) => {
        const cur = prev[slug] ?? 0;
        return { ...prev, [slug]: (cur + 1) % count };
      });
    }, 2000);
  };

  const armCard = (slug: string) =>
    setCardArmed((p) => (p[slug] ? p : { ...p, [slug]: true }));

  const goToImg = (slug: string, index: number) =>
    setCardImgIndex((p) => ({ ...p, [slug]: index }));

  const stepImg = (slug: string, count: number, dir: 1 | -1) => {
    if (count <= 1) return;
    setCardImgIndex((prev) => {
      const cur = prev[slug] ?? 0;
      return { ...prev, [slug]: (cur + dir + count) % count };
    });
  };

  const onImgHoverScrub = (
    e: React.MouseEvent<HTMLDivElement>,
    slug: string,
    count: number,
  ) => {
    if (count <= 1 || swipeRef.current?.active) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width) return;
    const x = Math.max(0, Math.min(rect.width - 1, e.clientX - rect.left));
    const targetIdx = Math.floor((x / rect.width) * count);
    setCardImgIndex((prev) =>
      prev[slug] === targetIdx ? prev : { ...prev, [slug]: targetIdx },
    );
  };

  const onImgPointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    slug: string,
    count: number,
  ) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    swipeRef.current = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      slug,
      count,
      active: false,
    };
    swipedRef.current = false;
    armCard(slug); // make sure every frame is mounted before the first swipe
  };

  const onImgPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = swipeRef.current;
    if (!s || s.id !== e.pointerId || s.active) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
      swipeRef.current = null; // vertical scroll — leave it to the page
      return;
    }
    if (Math.abs(dx) >= 10 && Math.abs(dx) > Math.abs(dy)) {
      s.active = true;
      swipedRef.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  const onImgPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = swipeRef.current;
    if (!s || s.id !== e.pointerId) return;
    swipeRef.current = null;
    if (!s.active) return;
    const dx = e.clientX - s.x;
    if (Math.abs(dx) >= SWIPE_MIN) stepImg(s.slug, s.count, dx < 0 ? 1 : -1);
    // keep "swiped" true just long enough to swallow the click that follows
    window.setTimeout(() => {
      swipedRef.current = false;
    }, 0);
  };

  const onImgPointerCancel = () => {
    swipeRef.current = null;
  };

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/products")
      .then((res) => res.json())
      .then((body: { items?: CatalogProduct[] }) => {
        if (cancelled) return;
        const items = (body.items ?? []).map((p) => ({
          slug: p.slug,
          name: p.name,
          price: `₹${p.price.replace(/\.00$/, "")}`,
          image: p.image,
          images: p.images,
          swatches: p.swatches,
          id: p.id,
          priceCents: p.priceCents,
        }));
        setProducts(items);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Scroll-turn: dark -> light. Eased toward scroll target so the shift isn't stepped.
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let target = 0;
    let current = 0;
    let raf = 0;
    let lastT = 0;

    const paint = (t: number) => {
      const section = sectionRef.current;
      if (!section) return;
      section.style.backgroundColor = lerpColor(BG_DARK, BG_LIGHT, t);
      section.style.borderLeftColor = lerpColor("#000000", BG_LIGHT, t);
      section.style.borderRightColor = lerpColor("#000000", BG_LIGHT, t);
      section.style.setProperty("--fg", lerpColor(TEXT_LIGHT, TEXT_DARK, t));
    };

    const readTarget = () => {
      const section = sectionRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const viewportH = window.innerHeight || 1;
      const turnStart = viewportH;
      const turnEnd = viewportH * 0.3;
      const turnProgress = (turnStart - rect.top) / (turnStart - turnEnd);
      target = Math.max(0, Math.min(1, turnProgress));
    };

    const tick = (now: number) => {
      const dt = lastT ? Math.min((now - lastT) / 1000, 0.05) : 1 / 60;
      lastT = now;
      const diff = target - current;

      if (reduceMotion || Math.abs(diff) < 0.001) {
        current = target;
        paint(current);
        raf = 0;
        lastT = 0;
        return;
      }

      current += diff * (1 - Math.pow(1 - TURN_SMOOTHING, dt * 60));
      paint(current);
      raf = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      readTarget();
      if (!raf) raf = requestAnimationFrame(tick);
    };

    readTarget();
    current = target;
    paint(current);

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const scrollByCard = (direction: 1 | -1) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const firstCard = scroller.firstElementChild as HTMLElement | null;
    const step = (firstCard?.offsetWidth ?? 240) + CARD_GAP;
    scroller.scrollBy({ left: step * direction, behavior: "smooth" });
  };

  const arrowStyle: React.CSSProperties = {
    width: "22px",
    height: "22px",
    padding: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    border: "1px solid var(--fg)",
    background: "transparent",
    color: "var(--fg)",
    opacity: 0.75,
    cursor: "pointer",
  };

  return (
    <section
      ref={sectionRef}
      className="bestsellers-section w-full"
      style={
        {
          backgroundColor: "#080604",
          ["--fg" as string]: TEXT_LIGHT,
        } as React.CSSProperties
      }
    >
      {/* SECTION HEADER */}
      <div
        className="bestsellers-header flex items-center justify-between"
        style={{ height: "72px" }}
      >
        <h2
          style={{
            margin: 0,
            color: "var(--fg)",
            fontFamily: "Inter, Arial, Helvetica, sans-serif",
            fontSize: "13px",
            fontWeight: 700,
            letterSpacing: "1px",
            textTransform: "uppercase",
          }}
        >
          BESTSELLERS
        </h2>

        <div className="flex items-center" style={{ gap: "8px" }}>
          <button type="button" aria-label="Previous" style={arrowStyle} onClick={() => scrollByCard(-1)}>
            <ChevronLeft size={10} strokeWidth={1.25} absoluteStrokeWidth={false} aria-hidden />
          </button>
          <button type="button" aria-label="Next" style={arrowStyle} onClick={() => scrollByCard(1)}>
            <ChevronRight size={10} strokeWidth={1.25} absoluteStrokeWidth={false} aria-hidden />
          </button>
        </div>
      </div>

      {/* CAROUSEL */}
      <div
        ref={scrollerRef}
        className="bestsellers-scroller"
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: `${CARD_GAP}px`,
          overflowX: "auto",
          overflowY: "hidden",
          overscrollBehaviorX: "contain",
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          touchAction: "pan-x pan-y",
          paddingBottom: "2px",
        }}
      >
        {products.map((product, index) => {
          const allImages = (() => {
            const raw: string[] = [];
            if (product.image) raw.push(product.image);
            if (product.images?.length) raw.push(...product.images);
            return [...new Set(raw)];
          })();
          const hasMulti = allImages.length > 1;
          const armed = !!cardArmed[product.slug];
          const activeIdx = getImgIndex(product.slug);

          return (
            <article
              key={`${product.slug}-${index}`}
              className="bestsellers-card group relative"
              style={{ flex: "0 0 auto", scrollSnapAlign: "start", overflow: "visible" }}
              onPointerEnter={(e) => {
                if (e.pointerType === "mouse") {
                  armCard(product.slug);
                  startAutoHover(product.slug, allImages.length);
                }
              }}
              onPointerLeave={(e) => {
                if (e.pointerType === "mouse") {
                  stopAutoHover(product.slug);
                  goToImg(product.slug, 0);
                }
              }}
            >
              {/* IMAGE AREA — swipe / drag here to change the image */}
              <div
                className="bs-img-wrapper"
                style={{
                  position: "relative",
                  aspectRatio: "3 / 4",
                  // multi-image cards: horizontal gestures belong to the swipe, vertical still scrolls the page
                  touchAction: hasMulti ? "pan-y" : "pan-x pan-y",
                }}
                onPointerDown={hasMulti ? (e) => onImgPointerDown(e, product.slug, allImages.length) : undefined}
                onPointerMove={hasMulti ? onImgPointerMove : undefined}
                onPointerUp={hasMulti ? onImgPointerUp : undefined}
                onPointerCancel={hasMulti ? onImgPointerCancel : undefined}
                onMouseMove={hasMulti ? (e) => onImgHoverScrub(e, product.slug, allImages.length) : undefined}
                onClickCapture={(e) => {
                  // a swipe must not open the product page
                  if (swipedRef.current) {
                    e.preventDefault();
                    e.stopPropagation();
                  }
                }}
              >
                {/* Click the image → go to PDP */}
                <Link
                  href={`/collection/${product.slug}`}
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                  style={{
                    display: "block",
                    textDecoration: "none",
                    position: "absolute",
                    inset: 0,
                  }}
                  tabIndex={-1}
                  aria-hidden="true"
                >
                  <div
                    className="him-card-media"
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "#e6e4df",
                      overflow: "hidden",
                    }}
                  >
                    <ProductCardMedia
                      name={product.name}
                      image={product.image}
                      images={product.images}
                      priority={index < 3}
                      quality={90}
                      sizes="(max-width: 768px) 70vw, 28vw"
                      armed={armed}
                      controlledIndex={hasMulti && armed ? activeIdx : undefined}
                    />
                  </div>
                </Link>

                {/* ── PREV / NEXT SWIPE BUTTONS ON HOVER ── */}
                {hasMulti && (
                  <>
                    <button
                      type="button"
                      aria-label="Previous image"
                      className="bs-img-nav bs-img-nav--prev"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        stopAutoHover(product.slug);
                        stepImg(product.slug, allImages.length, -1);
                      }}
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      <ChevronLeft size={14} strokeWidth={1.25} absoluteStrokeWidth={false} aria-hidden />
                    </button>
                    <button
                      type="button"
                      aria-label="Next image"
                      className="bs-img-nav bs-img-nav--next"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        stopAutoHover(product.slug);
                        stepImg(product.slug, allImages.length, 1);
                      }}
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      <ChevronRight size={14} strokeWidth={1.25} absoluteStrokeWidth={false} aria-hidden />
                    </button>
                  </>
                )}

                {/* SLIDER BARS — shows the current image, hover/tap a bar to jump to it */}
                {hasMulti && (
                  <div
                    className="bs-img-dots"
                    role="tablist"
                    aria-label={`${product.name} images`}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    {allImages.map((_, di) => (
                      <button
                        key={di}
                        type="button"
                        role="tab"
                        aria-selected={di === activeIdx}
                        aria-label={`Show image ${di + 1}`}
                        className={`bs-img-dot${di === activeIdx ? " active" : ""}`}
                        onMouseEnter={() => {
                          armCard(product.slug);
                          stopAutoHover(product.slug);
                          goToImg(product.slug, di);
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          armCard(product.slug);
                          stopAutoHover(product.slug);
                          goToImg(product.slug, di);
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* WISHLIST — outside Link → no navigation */}
                <button
                  type="button"
                  data-no-route-loader="true"
                  aria-label={
                    inWishlist(product.slug)
                      ? `Remove ${product.name} from wishlist`
                      : `Add ${product.name} to wishlist`
                  }
                  aria-pressed={inWishlist(product.slug)}
                  className="absolute flex items-center justify-center transition-opacity duration-200 hover:opacity-60"
                  style={{
                    right: "10px",
                    top: "10px",
                    width: "20px",
                    height: "20px",
                    padding: 0,
                    border: 0,
                    background: "transparent",
                    color: inWishlist(product.slug) ? "#7a1420" : "#3a3a3a",
                    cursor: "pointer",
                    zIndex: 5,
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    void toggleWishlist({
                      productId: product.id ?? null,
                      slug: product.slug,
                      name: product.name,
                      price: Math.round((product.priceCents ?? 0) / 100) || 0,
                      image: product.image,
                      swatches: product.swatches,
                    });
                  }}
                >
                  <Heart
                    size={13}
                    strokeWidth={1.25}
                    absoluteStrokeWidth={false}
                    fill={inWishlist(product.slug) ? "currentColor" : "none"}
                    aria-hidden
                  />
                </button>
              </div>

              {/* PRODUCT INFO */}
              <div style={{ paddingTop: "10px", color: "var(--fg)" }}>
                <div className="flex items-start justify-between" style={{ gap: "8px" }}>
                  <div>
                    <Link
                      href={`/collection/${product.slug}`}
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontFamily: "Inter, Arial, Helvetica, sans-serif",
                          fontSize: "13px",
                          fontWeight: 500,
                          lineHeight: 1.3,
                        }}
                      >
                        {product.name}
                      </p>
                    </Link>

                    {product.swatches.length > 0 && (
                      <div
                        className="flex items-center"
                        style={{ gap: "4px", marginTop: "6px" }}
                      >
                        {product.swatches.map((swatch, i) => (
                          <span
                            key={`${swatch}-${i}`}
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              background: swatch,
                              display: "inline-block",
                              flex: "0 0 auto",
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* BAG BUTTON */}
                  <Link
                    href={`/collection/${product.slug}`}
                    aria-label={`View ${product.name}`}
                    className="flex items-center justify-center transition-opacity duration-200 hover:opacity-60"
                    style={{
                      width: "20px",
                      height: "23px",
                      padding: 0,
                      borderRadius: "3px",
                      border: "1px solid var(--fg)",
                      background: "transparent",
                      color: "var(--fg)",
                      flex: "0 0 auto",
                      opacity: 0.8,
                    }}
                  >
                    <ShoppingBag size={11} strokeWidth={1.25} absoluteStrokeWidth={false} aria-hidden />
                  </Link>
                </div>

                {/* PRICE */}
                <p
                  style={{
                    margin: "8px 0 0",
                    fontFamily: "Inter, Arial, Helvetica, sans-serif",
                    fontSize: "13px",
                    fontWeight: 500,
                    lineHeight: 1,
                  }}
                >
                  {product.price}
                </p>
              </div>
            </article>
          );
        })}
      </div>

      <style jsx>{`
        .bestsellers-section {
          border-left: 25px solid #000;
          border-right: 25px solid #000;
          padding: 0 30px 56px;
        }
        .bestsellers-scroller {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .bestsellers-scroller::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
        }
        /* ~3.3 cards visible on desktop so the 4th peeks in, like Figma */
        .bestsellers-card {
          width: calc((100% - ${CARD_GAP * 3}px) / 3.3);
          min-width: 0;
        }

        /* ── Image swipe nav buttons on hover ── */
        .bs-img-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 5;
          display: grid;
          place-items: center;
          width: 30px;
          height: 30px;
          padding: 0;
          border: none;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.88);
          color: #111;
          cursor: pointer;
          opacity: 0;
          pointer-events: none;
          transition: opacity 180ms ease, background 150ms ease, transform 150ms ease;
          box-shadow: 0 1px 6px rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(4px);
        }
        .bestsellers-card:hover .bs-img-nav {
          opacity: 1;
          pointer-events: auto;
        }
        .bs-img-nav:hover {
          background: #fff;
          transform: translateY(-50%) scale(1.06);
        }
        .bs-img-nav--prev { left: 8px; }
        .bs-img-nav--next { right: 8px; }

        /* ── Slider bars (also tappable) ── */
        .bs-img-dots {
          position: absolute;
          bottom: 3px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 4;
          display: flex;
          align-items: center;
          gap: 5px;
          opacity: 0;
          pointer-events: none;
          transition: opacity 180ms ease;
        }
        .bestsellers-card:hover .bs-img-dots {
          opacity: 1;
          pointer-events: auto;
        }
        /* touch screens have no hover — keep the bars visible */
        @media (hover: none) {
          .bs-img-dots {
            opacity: 1;
            pointer-events: auto;
          }
        }
        .bs-img-dot {
          position: relative;
          width: 18px;
          height: 14px; /* bigger tap area than the 2px bar */
          padding: 0;
          border: 0;
          background: transparent;
          cursor: pointer;
          transition: width 200ms ease;
        }
        .bs-img-dot::before {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          top: 50%;
          height: 2px;
          margin-top: -1px;
          border-radius: 1px;
          background: rgba(255, 255, 255, 0.45);
          transition: background 200ms ease;
        }
        .bs-img-dot:hover::before {
          background: rgba(255, 255, 255, 0.8);
        }
        .bs-img-dot.active {
          width: 24px;
        }
        .bs-img-dot.active::before {
          background: #fff;
        }
        @media (max-width: 1024px) {
          /* Left inset lives on the section (doesn’t scroll away).
             Scroller bleeds to the right edge; padding-right only after last slide. */
          .bestsellers-section {
            border-left-width: 12px;
            border-right-width: 0;
            padding: 0 0 40px 16px;
          }
          .bestsellers-header {
            padding-right: 16px;
          }
          .bestsellers-scroller {
            padding-left: 0;
            padding-right: 16px;
          }
          .bestsellers-card {
            width: calc((100% - ${CARD_GAP}px) / 2.3);
          }
        }
        @media (max-width: 640px) {
          .bestsellers-section {
            border-left-width: 0;
            border-right-width: 0;
            padding: 0 0 32px 14px;
          }
          .bestsellers-header {
            padding-right: 14px;
          }
          .bestsellers-scroller {
            padding-left: 0;
            padding-right: 14px;
          }
          .bestsellers-card {
            width: 72%;
          }
        }
      `}</style>
    </section>
  );
}

/* =====================================================================
   EDITORIAL FLOATING COLLAGE (UPDATED)
===================================================================== */

interface CollageImage {
  src: string;
  alt: string;
  aspectRatio: string;
  offsetTop: string;
  priority?: boolean;
  zoom?: number; // optional: overrides the default zoom for one image
}

const COLLAGE_ZOOM = 1.12;     // crops the white border (1.0 = no crop, raise it if white still shows)
const COLLAGE_GAP = 6;         // px between images (was 8)
const DESKTOP_COLUMNS = 4;     // set to 3 for much bigger images on desktop

const ROW_MOTION = [
  { duration: "10s", delay: "-2s", magnitude: "46px" },
  { duration: "12.5s", delay: "-4s", magnitude: "50px" },
  { duration: "9s", delay: "-1s", magnitude: "32px" },
  { duration: "11.5s", delay: "-5s", magnitude: "42px" },
  { duration: "10.5s", delay: "-3s", magnitude: "38px" },
  { duration: "9.5s", delay: "-2s", magnitude: "28px" },
];

const COLLAGE_IMAGES: CollageImage[] = [
  {
    src: "/products/man-image-100.webp",
    alt: "Man leaning out of a car window",
    aspectRatio: "3 / 4",
    offsetTop: "0px",
    priority: true,
  },
  {
    src: "/THE-ARCHIVIST/1.webp",
    alt: "Man in a trucker cap",
    aspectRatio: "4 / 5",
    offsetTop: "96px",
    priority: true,
  },
  {
    src: "/products/inner-images/man-image-106-3.webp",
    alt: "Dice and a matchbook on a table",
    aspectRatio: "1 / 1",
    offsetTop: "0px",
    priority: true,
  },
  {
    src: "/THE-ARCHIVIST/2.webp", // was man-image-109 (duplicate) — change if your file name differs
    alt: "Man in white outfit beside a car",
    aspectRatio: "3 / 4",
    offsetTop: "150px",
  },
  {
    src: "/THE-ARCHIVIST/5.webp",
    alt: "Man on a red sofa",
    aspectRatio: "4 / 3",
    offsetTop: "24px",
  },
  {
    src: "/products/13.png",
    alt: "Man playing guitar reclined",
    aspectRatio: "3 / 4",
    offsetTop: "12px",
  },
  {
    src: "/products/17.png",
    alt: "Couple against a blue sky",
    aspectRatio: "2 / 3",
    offsetTop: "24px",
  },
  {
    src: "/products/inner-images/man-image-105-2.webp",
    alt: "Roadside billboard sign reading him",
    aspectRatio: "4 / 5",
    offsetTop: "24px",
  },
  {
    src: "/products/22.png",
    alt: "Man against a stone wall",
    aspectRatio: "3 / 4",
    offsetTop: "36px",
  },
  {
    src: "/products/29.png",
    alt: "Wide leg trousers, man walking",
    aspectRatio: "2 / 3",
    offsetTop: "12px",
  },
  {
    src: "/products/man-image-108.webp",
    alt: "Man in shirt on a motorbike",
    aspectRatio: "3 / 4",
    offsetTop: "36px",
  },
  {
    src: "/products/man-image-109.webp",
    alt: "Close portrait with sunglasses",
    aspectRatio: "4 / 5",
    offsetTop: "24px",
  },
];

function useResponsiveColumnCount() {
  const [columns, setColumns] = useState(DESKTOP_COLUMNS);

  useEffect(() => {
    const computeColumns = () => {
      const width = window.innerWidth;

      if (width < 640) return 2;
      if (width < 1024) return 3;

      return DESKTOP_COLUMNS;
    };

    const update = () => setColumns(computeColumns());

    update();

    window.addEventListener("resize", update);

    return () => window.removeEventListener("resize", update);
  }, []);

  return columns;
}

function EditorialCollage() {
  const columns = useResponsiveColumnCount();

  const sectionRef = useRef<HTMLElement | null>(null);

  const columnRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const parallaxFactors = [0.02, -0.016, 0.024, -0.02];
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let target = 0;
    let current = 0;
    let sectionHeight = 1;
    let raf = 0;
    let lastT = 0;

    const paint = (t: number) => {
      columnRefs.current.forEach((col, i) => {
        if (!col) return;
        const factor = parallaxFactors[i % parallaxFactors.length];
        col.style.transform = `translate3d(0, ${t * factor * sectionHeight}px, 0)`;
      });
    };

    const readTarget = () => {
      const section = sectionRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      sectionHeight = rect.height || 1;
      const viewportH = window.innerHeight || 1;
      const progress = (viewportH - rect.top) / (viewportH + rect.height);
      target = Math.max(-1, Math.min(1, progress));
    };

    const tick = (now: number) => {
      const dt = lastT ? Math.min((now - lastT) / 1000, 0.05) : 1 / 60;
      lastT = now;
      const diff = target - current;

      if (reduceMotion || Math.abs(diff) < 0.001) {
        current = target;
        paint(current);
        raf = 0;
        lastT = 0;
        return;
      }

      current += diff * (1 - Math.pow(1 - TURN_SMOOTHING, dt * 60));
      paint(current);
      raf = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      readTarget();
      if (!raf) raf = requestAnimationFrame(tick);
    };

    readTarget();
    current = target;
    paint(current);

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const columnGroups: CollageImage[][] = Array.from(
    { length: columns },
    () => []
  );

  COLLAGE_IMAGES.forEach((img, i) => {
    columnGroups[i % columns].push(img);
  });

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden"
      style={{
        backgroundColor: BG_DARK,
        minHeight: "120vh",
        padding: "0 12px",
      }}
    >
      {/* TOP TYPOGRAPHY OVERLAY */}

      <div
        className="absolute left-0 top-0 z-20 w-full"
        style={{
          padding: "28px 34px 0",
          pointerEvents: "none",
        }}
      >
        <h2
          style={{
            margin: "16px 0 0",
            color: "var(--Janna, var(--color-grey-90-2, #F4ECD8))",
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "clamp(30px, 5vw, 120px)",
            fontStyle: "normal",
            fontWeight: 300,
            lineHeight: 0.5,
            letterSpacing: "-1.4px",
            textTransform: "uppercase",
          }}
        >
          Made for the man
        </h2>
      </div>
      <div
        style={{
          position: "absolute",
          top: "72px",
          right: "clamp(24px, 8vw, 100px)",
          zIndex: 25,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          textAlign: "right",
          pointerEvents: "auto",
        }}
      >
        <p
          style={{
            margin: 0,
            color: "var(--Janna, var(--color-grey-90-2, #F4ECD8))",
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: "clamp(8px, 0.65vw, 10px)",
            fontWeight: 500,
            lineHeight: 1.5,
            letterSpacing: "0.5px",
            textTransform: "uppercase",
          }}
        >
          Different
          <br />
          in mood
          <br />
          always in
          <br />
          motion.
        </p>

        <Link
          href="/collection"
          style={{
            display: "inline-block",
            marginTop: "10px",
            padding: "0 0 3px",
            border: "none",
            borderBottom: "1px solid rgba(244,236,216,0.6)",
            background: "transparent",
            color: "var(--Janna, var(--color-grey-90-2, #F4ECD8))",
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: "13px",
            fontWeight: 500,
            letterSpacing: "0.4px",
            textTransform: "uppercase",
            textDecoration: "none",
            cursor: "pointer",
          }}
        >
          Explore the edit →
        </Link>
      </div>

      {/* OVERLAPPING BOTTOM TYPOGRAPHY OVERLAY */}

      <div
        className="absolute bottom-[18%] left-0 z-30 w-full"
        style={{
          padding: "0 34px",
          pointerEvents: "none",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <h2
          style={{
            margin: "16px 0 0",
            color: "var(--Janna, var(--color-grey-90-2, #F4ECD8))",
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "clamp(30px, 5vw, 120px)",
            fontStyle: "normal",
            fontWeight: 300,
            lineHeight: 0.5,
            letterSpacing: "-1.4px",
            textTransform: "uppercase",
          }}
        >
          Who stands out
        </h2>
      </div>

      {/* FLOATING COLLAGE GRID */}

      <div
        className="relative z-10 flex h-full w-full"
        style={{
          gap: `${COLLAGE_GAP}px`,
          padding: "70px 0 40px",
        }}
      >
        {columnGroups.map((group, colIndex) => (
          <div
            key={colIndex}
            ref={(el) => {
              columnRefs.current[colIndex] = el;
            }}
            className="flex flex-1 flex-col"
            style={{
              gap: `${COLLAGE_GAP}px`,
              willChange: "transform",
            }}
          >
            {group.map((img, imgIndex) => {
              const row = ROW_MOTION[imgIndex % ROW_MOTION.length];
              const rowGoesUp = imgIndex % 2 === 0;
              const magnitudeNum = parseFloat(row.magnitude);
              const signedDistance = `${rowGoesUp ? "-" : ""}${row.magnitude}`;
              const reservedTop = rowGoesUp ? magnitudeNum : 0;
              const reservedBottom = rowGoesUp ? 0 : magnitudeNum;

              return (
                <div
                  key={`${img.src}-${imgIndex}`}
                  className="collage-float-item relative w-full overflow-hidden"
                  style={
                    {
                      aspectRatio: img.aspectRatio || "3 / 4",
                      width: "100%",

                      marginTop:
                        imgIndex === 0
                          ? `calc(${img.offsetTop} + ${reservedTop}px)`
                          : `${reservedTop}px`,

                      marginBottom: `${reservedBottom}px`,

                      willChange: "transform",

                      animationDuration: row.duration,

                      animationDelay: row.delay,

                      animationDirection: "alternate",

                      animationName: "collageFloat",

                      animationTimingFunction: "ease-in-out",

                      animationIterationCount: "infinite",

                      ["--float-distance" as string]: signedDistance,
                    } as React.CSSProperties
                  }
                >
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    priority={img.priority}
                    quality={90}
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover object-center"
                    style={{
                      transform: `scale(${img.zoom ?? COLLAGE_ZOOM})`,
                      transformOrigin: "center center",
                    }}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes collageFloat {
          from {
            transform: translate3d(0, 0, 0);
          }

          to {
            transform: translate3d(
              0,
              var(--float-distance, 40px),
              0
            );
          }
        }

        @media (prefers-reduced-motion: reduce), (pointer: coarse), (max-width: 768px) {
          .collage-float-item {
            animation: none !important;
            will-change: auto !important;
          }
        }
      `}</style>
    </section>
  );
}

/* =====================================================================
   NEW LAST SECTION — RED MAN / HIM PROVISIONS
===================================================================== */

function ProvisionsSection() {
  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ background: "#090504" }}
    >
      <div
        className="relative w-full overflow-hidden"
        style={{
          height: "clamp(420px, 41vw, 610px)",
          minHeight: "420px",
        }}
      >
        {/* BACKGROUND IMAGE */}
        <Image
          src="/products/red-man-imagee.webp"
          alt="Him Provisions"
          fill
          priority={false}
          quality={95}
          sizes="100vw"
          className="object-cover"
          style={{
            objectPosition: "42% center",
            transform: "scale(0.94) translateY(-2%)",
          }}
        />

        {/* DARK OVERLAY */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.12) 35%, rgba(0,0,0,0.55) 65%, rgba(0,0,0,0.72) 100%)",
          }}
        />

        {/* RIGHT-SIDE TEXT CONTENT */}
        <div
          className="absolute inset-0 z-10 flex items-center justify-end"
          style={{
            padding: "clamp(24px, 5vw, 64px)",
          }}
        >
          <div
            style={{
              width: "min(520px, 52%)",
              marginLeft: "auto",
            }}
          >
            {/* SMALL LABEL */}
            <div
              style={{
                marginBottom: "12px",
                color: "rgba(255,255,255,0.75)",
                fontFamily: "Arial, Helvetica, sans-serif",
                fontSize: "10px",
                fontWeight: 500,
                lineHeight: 1,
                letterSpacing: "1.5px",
                textTransform: "uppercase",
              }}
            >
              The HIM Provisions
            </div>

            {/* MAIN HEADING */}
            <h2
              style={{
                margin: 0,
                color: "#FFF",
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(34px, 4.2vw, 55px)",
                fontStyle: "normal",
                fontWeight: 400,
                lineHeight: 0.98,
                letterSpacing: "-1.2px",
                textTransform: "uppercase",
                maxWidth: "520px",
              }}
            >
              Elevate Your
              <br />
              Everyday with HIM
            </h2>

            {/* DESCRIPTION */}
            <p
              style={{
                margin: "18px 0 0",
                color: "rgba(255,255,255,0.8)",
                fontFamily: '"Segoe UI", sans-serif',
                fontSize: "14px",
                fontWeight: 300,
                lineHeight: "22px",
              }}
            >
              Simplicity looks good on HIM.
            </p>

            {/* BUTTON */}
            <Link href="/collection" className="no-underline">
              <button
                type="button"
                style={{
                  marginTop: "22px",
                  height: "36px",
                  padding: "0 24px",
                  border: "none",
                  borderRadius: 0,
                  background: "#fff",
                  color: "#27221e",
                  fontFamily: "Arial, Helvetica, sans-serif",
                  fontSize: "10px",
                  fontWeight: 500,
                  letterSpacing: "0.3px",
                  lineHeight: 1,
                  cursor: "pointer",
                  transition: "transform 200ms ease, background 200ms ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.background = "#f1eee9";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.background = "#ffffff";
                }}
              >
                EXPLORE NOW&nbsp;{" "}
                <ArrowRight
                  size={12}
                  strokeWidth={1.25}
                  absoluteStrokeWidth={false}
                  aria-hidden
                  style={{ display: "inline-block", verticalAlign: "middle" }}
                />
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =====================================================================
   DEFAULT EXPORT
===================================================================== */

export default function ProductsSection() {
  return (
    <>
      <ExistingProductsGrid />

      <EditorialCollage />

      {/* LAST SECTION */}
      <ProvisionsSection />
    </>
  );
}