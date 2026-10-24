"use client";

import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { CatalogProduct } from "@/lib/catalog-types";
import { useWishlist } from "@/hooks/useWishlist";

// ─── Shared arrow SVG ───────────────────────────────────────────────
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

const BASE_FILTERS = ["ALL"] as const;

function categoryHref(filter: string) {
  return filter === "ALL" ? "/collection" : `/collection?category=${filter}`;
}

const EXPLORE_ITEMS = [
  { label: "ALL MEN'S", href: "/collection", image: "/lookbook/man-on-lunch.webp" },
  { label: "JACKETS", href: "/collection?category=JACKETS", image: "/lookbook/man-on-bike.webp" },
  { label: "SUITS", href: "/collection?category=SUITS", image: "/lookbook/man-on-car.webp" },
  { label: "BLAZERS", href: "/collection?category=BLAZERS", image: "/lookbook/Where-The-Sun-Settles.webp" },
];

function HeartIcon({ filled }: { filled?: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M20.8 8.8c0 5.2-8.8 10.2-8.8 10.2S3.2 14 3.2 8.8A4.7 4.7 0 0 1 8 4c1.8 0 3.2.9 4 2.2C12.8 4.9 14.2 4 16 4a4.7 4.7 0 0 1 4.8 4.8Z" />
    </svg>
  );
}

// ─── Single product card ─────────────────────────────────────────────
function ProductCard({ product }: { product: CatalogProduct }) {
  const { has: inWishlist, toggle: toggleWishlist } = useWishlist();
  const wishlisted = inWishlist(product.slug);

  return (
    <Link href={`/collection/${product.slug}`} className="product-card group" style={{ textDecoration: "none" }}>
      {/* Image */}
      <div className="product-card-img">
        <Image
          src={product.image}
          alt={product.name}
          fill
          quality={70}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.03]"
        />
        <button
          type="button"
          className={`product-card-wish${wishlisted ? " is-active" : ""}`}
          aria-label={
            wishlisted
              ? `Remove ${product.name} from wishlist`
              : `Add ${product.name} to wishlist`
          }
          aria-pressed={wishlisted}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void toggleWishlist({
              productId: product.id,
              slug: product.slug,
              name: product.name,
              price: Math.round(product.priceCents / 100) || 0,
              image: product.image,
              swatches: product.swatches,
            });
          }}
        >
          <HeartIcon filled={wishlisted} />
        </button>
      </div>

      {/* Info */}
      <div className="product-card-body">
        <p className="product-card-name">{product.name}</p>

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
                  border: "1px solid rgba(0,0,0,0.15)",
                  display: "inline-block",
                  flex: "0 0 auto",
                }}
              />
            ))}
          </div>
        )}

        <p className="product-card-price">₹{product.price}</p>
      </div>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────
function CollectionPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/products")
      .then((res) => res.json())
      .then((body: { items?: CatalogProduct[] }) => {
        if (!cancelled) setProducts(body.items ?? []);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(() => {
    const set = new Set(
      products.map((p) => p.category).filter(Boolean),
    );
    return [...BASE_FILTERS, ...Array.from(set).sort()];
  }, [products]);

  const rawCategory = searchParams.get("category");
  const activeFilter =
    rawCategory && categories.includes(rawCategory) ? rawCategory : "ALL";

  const filtered =
    activeFilter === "ALL"
      ? products
      : products.filter((p) => p.category === activeFilter);

  const setActiveFilter = (filter: string) => {
    router.replace(categoryHref(filter), { scroll: false });
  };

  return (
    <>
      <Navbar />

      <main className="collection-main">

        {/* ── HERO BANNER ─────────────────────────────────────────── */}
        <div className="collection-hero">
          <Image
            src="/products/red-man-image.webp"
            alt="All New Essentials"
            fill
            priority
            quality={70}
            sizes="100vw"
            className="object-cover"
            style={{ objectPosition: "50% 30%" }}
          />
          {/* overlay */}
          <div className="collection-hero-overlay" />

          <div className="collection-hero-text">
            <span className="collection-hero-label">ALL NEW ESSENTIALS</span>
            <h1 className="collection-hero-title">
              Essential Pieces,
              <br />
              Elevated by Design.
            </h1>
            <p className="collection-hero-desc">
              Where thoughtful design meets timeless sophistication. Every piece reflects a commitment to quality, comfort, and the art of dressing well.
            </p>
          </div>
        </div>

        {/* ── FILTER BAR ──────────────────────────────────────────── */}
        <div className="collection-bar">
          <div className="collection-bar-left">
            {categories.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setActiveFilter(f)}
                className={`collection-filter-btn${activeFilter === f ? " active" : ""}`}
              >
                {f}
              </button>
            ))}
          </div>
          <span className="collection-count">
            {loading ? "…" : `${filtered.length} PRODUCTS`}
          </span>
        </div>

        {/* ── PRODUCT GRID ─────────────────────────────────────────── */}
        <div className="collection-grid">
          {filtered.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>

        {/* ── LOAD MORE ────────────────────────────────────────────── */}
        <div className="collection-load-more">
          <button type="button" className="load-more-btn">
            LOAD MORE PRODUCTS &nbsp;<Arrow />
          </button>
        </div>

        {/* ── MORE WAYS TO WEAR IT ─────────────────────────────────── */}
        <section className="mwwi-section">
          <div className="mwwi-header">
            <div>
              <span className="mwwi-eyebrow">EXPLORE MORE</span>
              <h2 className="mwwi-title">More Ways to Wear It</h2>
            </div>

            <Link href="/lookbook" className="mwwi-view-all">
              <span>VIEW ALL</span>
              <Arrow />
            </Link>
          </div>

          <div className="mwwi-strip">
            {EXPLORE_ITEMS.map((item) => (
              <Link key={item.label} href={item.href} className="mwwi-item group">
                <div className="mwwi-img">
                  <Image
                    src={item.image}
                    alt={item.label}
                    fill
                    quality={70}
                    sizes="(max-width: 768px) 70vw, 25vw"
                    className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                </div>

                <div className="mwwi-label">
                  <span>{item.label}</span>
                  <Arrow />
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <Footer />

      <style jsx global>{`
        /* ── Reset & base ── */
        .collection-main {
          background: #fff;
          color: #111;
          min-height: 100vh;
        }

        /* ── HERO ── */
        .collection-hero {
          position: relative;
          width: 100%;
          height: clamp(420px, 52vw, 620px);
          overflow: hidden;
          background: #111;
        }

        .collection-hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to right,
            rgba(0,0,0,0.62) 0%,
            rgba(0,0,0,0.35) 55%,
            rgba(0,0,0,0.1) 100%
          );
          z-index: 1;
        }

        .collection-hero-text {
          position: absolute;
          inset: 0;
          z-index: 2;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: clamp(28px, 5vw, 72px);
          color: #fff;
        }

        .collection-hero-label {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.7);
          margin-bottom: 12px;
        }

        .collection-hero-title {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  margin: 0;
  font-family: "Cormorant Garamond", Georgia, serif;
  font-size: clamp(30px, 4.5vw, 64px);
  font-weight: 400;
  line-height: 0.95;
  letter-spacing: -0.5px;
  text-transform: uppercase;
  color: #fff;
}

.collection-hero-title span {
  display: block;
  white-space: nowrap;
}

        .collection-hero-desc {
          margin: 16px 0 0;
          max-width: 380px;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 11px;
          font-weight: 400;
          line-height: 1.6;
          color: rgba(255,255,255,0.75);
        }

        /* ── FILTER BAR ── */
        .collection-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 clamp(16px, 4vw, 56px);
          height: 52px;
          border-bottom: 1px solid rgba(0,0,0,0.1);
          background: #fff;
          position: sticky;
          top: 0;
          z-index: 30;
        }

        .collection-bar-left {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .collection-filter-btn {
          padding: 5px 12px;
          border: 1px solid transparent;
          background: transparent;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          color: rgba(0,0,0,0.45);
          cursor: pointer;
          transition: all 150ms ease;
        }

        .collection-filter-btn:hover,
        .collection-filter-btn.active {
          color: #111;
          border-color: #111;
        }

        .collection-count {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 9px;
          font-weight: 400;
          letter-spacing: 0.5px;
          color: rgba(0,0,0,0.4);
        }

        /* ── PRODUCT GRID ── */
        .collection-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: rgba(0,0,0,0.08);
          padding: 1px;
          margin: 0 clamp(16px, 4vw, 56px);
          margin-top: 24px;
        }

        .product-card {
          display: block;
          background: #fff;
          cursor: pointer;
          overflow: hidden;
        }

        .product-card-img {
          position: relative;
          width: 100%;
          aspect-ratio: 3 / 4;
          overflow: hidden;
          background: #f0ede8;
        }

        .product-card-wish {
          position: absolute;
          top: 10px;
          right: 10px;
          z-index: 2;
          width: 32px;
          height: 32px;
          padding: 0;
          border: none;
          border-radius: 0;
          background: rgba(255, 255, 255, 0.88);
          color: #3a3a3a;
          display: grid;
          place-items: center;
          cursor: pointer;
          transition: color 150ms ease, background 150ms ease, opacity 150ms ease;
        }

        .product-card-wish:hover {
          background: #fff;
          color: #111;
        }

        .product-card-wish.is-active {
          color: #7a1420;
        }

        .product-card-body {
          padding: 12px 14px 18px;
        }

        .product-card-name {
          margin: 0;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 11px;
          font-weight: 500;
          color: #111;
          line-height: 1.3;
        }

        .product-card-price {
          margin: 8px 0 0;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 12px;
          font-weight: 600;
          color: #111;
        }

        /* ── LOAD MORE ── */
        .collection-load-more {
          display: flex;
          justify-content: center;
          padding: 40px 0;
        }

        .load-more-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 28px;
          border: 1px solid #111;
          background: transparent;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          color: #111;
          cursor: pointer;
          transition: background 180ms ease, color 180ms ease;
        }

        .load-more-btn:hover {
          background: #111;
          color: #fff;
        }

        /* ── MORE WAYS TO WEAR IT ── */
        .mwwi-section {
          padding: clamp(10px, 2.5vw, 68px) clamp(16px, 4vw, 56px) clamp(48px, 5vw, 80px);
          background: #f6f5f3;
          border-top: 1px solid rgba(0,0,0,0.08);
        }

        .mwwi-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: clamp(18px, 2vw, 28px);
        }

        .mwwi-eyebrow {
          display: block;
          margin-bottom: 6px;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: rgba(0,0,0,0.6);
        }

        .mwwi-title {
          margin: 0;
          font-family: "Cormorant Garamond", "Cinzel", Georgia, serif;
          font-size: clamp(30px, 3.4vw, 52px);
          font-weight: 400;
          font-variant: small-caps;
          line-height: 1;
          letter-spacing: 0.01em;
          color: #17140f;
        }

        .mwwi-view-all {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 30px;
          padding: 0 16px;
          border: 1px solid #17140f;
          border-radius: 999px;
          background: transparent;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          text-decoration: none;
          color: #17140f;
          white-space: nowrap;
          transition: background 180ms ease, color 180ms ease;
        }

        .mwwi-view-all:hover {
          background: #17140f;
          color: #fff;
        }

        .mwwi-strip {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: clamp(8px, 1vw, 16px);
        }

        .mwwi-item {
          display: block;
          min-width: 0;
          background: #fff;
          border-radius: 3px;
          overflow: hidden;
          text-decoration: none;
          color: #111;
        }

        .mwwi-img {
          position: relative;
          width: 100%;
          aspect-ratio: 4 / 3;
          overflow: hidden;
          background: #e8e5df;
        }

        .mwwi-label {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: clamp(34px, 3vw, 44px);
          padding: 0 clamp(10px, 1vw, 14px);
          font-family: Arial, Helvetica, sans-serif;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.3px;
          text-transform: uppercase;
          color: #111;
        }

        .mwwi-label svg {
          color: rgba(0,0,0,0.4);
          transition: transform 200ms ease, color 200ms ease;
        }

        .mwwi-item:hover .mwwi-label svg {
          color: #111;
          transform: translateX(3px);
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 768px) {
          .collection-grid {
            grid-template-columns: repeat(2, 1fr);
            margin: 0 12px;
            margin-top: 16px;
          }

          .collection-hero-title {
            font-size: clamp(28px, 8vw, 44px);
          }

          /* More ways to wear it → swipeable row on phones */
          .mwwi-strip {
            display: flex;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            scrollbar-width: none;
          }

          .mwwi-strip::-webkit-scrollbar {
            display: none;
          }

          .mwwi-item {
            flex: 0 0 72%;
            scroll-snap-align: start;
          }
        }

        @media (max-width: 480px) {
          .collection-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}

export default function CollectionPage() {
  return (
    <Suspense fallback={null}>
      <CollectionPageInner />
    </Suspense>
  );
}