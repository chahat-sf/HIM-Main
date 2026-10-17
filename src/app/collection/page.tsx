"use client";

import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState } from "react";

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

// ─── Product data ────────────────────────────────────────────────────
const PRODUCTS = [
  { slug: "textured-thermal-white",   name: "Textured Thermal – White",   price: "₹16,000", category: "SHIRTS",  image: "/products/item-4.webp",  rating: 4.8, reviews: 124 },
  { slug: "textured-thermal-white-2", name: "Textured Thermal – White",   price: "₹16,000", category: "SHIRTS",  image: "/products/item-4.webp",  rating: 4.8, reviews: 124 },
  { slug: "textured-thermal-white-3", name: "Textured Thermal – White",   price: "₹16,000", category: "TSHIRTS", image: "/products/item-4.webp",  rating: 4.8, reviews: 124 },
  { slug: "textured-thermal-white-4", name: "Textured Thermal – White",   price: "₹16,000", category: "JEANS",   image: "/products/item-4.webp",  rating: 4.8, reviews: 124 },
  { slug: "textured-thermal-white-5", name: "Textured Thermal – White",   price: "₹16,000", category: "SHIRTS",  image: "/products/item-4.webp",  rating: 4.8, reviews: 124 },
  { slug: "textured-thermal-white-6", name: "Textured Thermal – White",   price: "₹16,000", category: "TSHIRTS", image: "/products/item-4.webp",  rating: 4.8, reviews: 124 },
];

const FILTERS = ["ALL", "SHIRTS", "TSHIRTS", "JEANS"];

const LOOKBOOK_STORIES = [
  { image: "/lookbook/man-on-lunch.webp",             category: "PEOPLE",   title: "Where the Sun Settles" },
  { image: "/lookbook/man-on-bike.webp",              category: "JOURNEYS", title: "On Set: Lane Splitters" },
  { image: "/lookbook/man-on-car.webp",               category: "CULTURE",  title: "Archives from Brooklyn" },
  { image: "/lookbook/Where-The-Sun-Settles.webp",    category: "PEOPLE",   title: "Made for Movement" },
  { image: "/lookbook/On-Set-Lane-Splitters.webp",    category: "JOURNEYS", title: "Outside and Better" },
];

// ─── Star rating ─────────────────────────────────────────────────────
function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ color: "#c9a84c", fontSize: "10px", letterSpacing: "1px" }}>
      {"★".repeat(Math.floor(rating))}
      {rating % 1 >= 0.5 ? "½" : ""}
    </span>
  );
}

// ─── Single product card ─────────────────────────────────────────────
function ProductCard({ product }: { product: (typeof PRODUCTS)[0] }) {
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
      </div>

      {/* Info */}
      <div className="product-card-body">
        <p className="product-card-name">{product.name}</p>
        <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "4px" }}>
          <Stars rating={product.rating} />
          <span style={{ fontSize: "9px", color: "rgba(0,0,0,0.4)", fontFamily: "Arial, sans-serif" }}>
            ({product.reviews})
          </span>
        </div>
        <p className="product-card-price">{product.price}</p>
      </div>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────
export default function CollectionPage() {
  const [activeFilter, setActiveFilter] = useState("ALL");

  const filtered =
    activeFilter === "ALL"
      ? PRODUCTS
      : PRODUCTS.filter((p) => p.category === activeFilter);

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
              Everyday<br />Essentials,<br />Built Different.
            </h1>
            <p className="collection-hero-desc">
              Explore our full range of essentials designed for comfort,
              quality and a life in motion. Timeless pieces for the modern man.
            </p>
          </div>
        </div>

        {/* ── FILTER BAR ──────────────────────────────────────────── */}
        <div className="collection-bar">
          <div className="collection-bar-left">
            {FILTERS.map((f) => (
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
          <span className="collection-count">{filtered.length} PRODUCTS</span>
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
        <div className="mwwi-section">
          <div className="mwwi-header">
            <span className="mwwi-title">MORE WAYS TO WEAR IT</span>
            <Link href="/lookbook" className="mwwi-view-all">
              VIEW ALL &nbsp;<Arrow />
            </Link>
          </div>

          <div className="mwwi-strip">
            {LOOKBOOK_STORIES.map((story) => (
              <div key={story.title} className="mwwi-item group">
                <div className="mwwi-img">
                  <Image
                    src={story.image}
                    alt={story.title}
                    fill
                    quality={70}
                    sizes="(max-width: 640px) 80vw, 22vw"
                    className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                </div>
                <p className="mwwi-cat">{story.category}</p>
                <p className="mwwi-name">{story.title}</p>
              </div>
            ))}
          </div>
        </div>
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
          margin: 0;
          font-family: "Cormorant Garamond", Georgia, serif;
          font-size: clamp(32px, 4.5vw, 64px);
          font-weight: 400;
          line-height: 1.02;
          letter-spacing: -0.5px;
          text-transform: uppercase;
          color: #fff;
          max-width: 520px;
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
          margin: 6px 0 0;
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
          padding: 0 clamp(16px, 4vw, 56px) 60px;
          background: #fff;
          border-top: 1px solid rgba(0,0,0,0.08);
        }

        .mwwi-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 60px;
        }

        .mwwi-title {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #111;
        }

        .mwwi-view-all {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: #111;
          text-decoration: none;
          transition: opacity 150ms ease;
        }

        .mwwi-view-all:hover {
          opacity: 0.5;
        }

        .mwwi-strip {
          display: flex;
          gap: 14px;
          overflow-x: auto;
          scrollbar-width: none;
        }

        .mwwi-strip::-webkit-scrollbar {
          display: none;
        }

        .mwwi-item {
          flex: 0 0 auto;
          width: clamp(160px, 20vw, 240px);
          cursor: pointer;
        }

        .mwwi-img {
          position: relative;
          width: 100%;
          aspect-ratio: 3 / 4;
          overflow: hidden;
          background: #e8e5df;
        }

        .mwwi-cat {
          margin: 10px 0 0;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 8px;
          font-weight: 400;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: rgba(0,0,0,0.4);
        }

        .mwwi-name {
          margin: 4px 0 0;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 11px;
          font-weight: 500;
          color: #111;
          line-height: 1.3;
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
