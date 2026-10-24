"use client";

import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RouteLoading from "@/components/RouteLoading";
import { useWishlist } from "@/hooks/useWishlist";

const SERIF = '"Cormorant Garamond", Georgia, serif';
const SANS = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const BG = "#0a0a0a";
const INK = "#ffffff";
const MUTED = "rgba(255,255,255,0.45)";
const MUTED_SOFT = "rgba(255,255,255,0.55)";
const BORDER = "rgba(255,255,255,0.28)";
const GUTTER = "clamp(16px, 4vw, 60px)";
const CONTENT_MAX = "1120px";
const GOLD = "#c4a574";

function fmt(n: number) {
  return "₹ " + n.toLocaleString("en-IN");
}

export default function WishlistPage() {
  const { items, loading, remove } = useWishlist();

  if (loading) {
    return <RouteLoading />;
  }

  return (
    <>
      <Navbar />

      <main className="wish-page">
        <section className="wish-hero" aria-label="Wishlist">
          <Image
            src="/products/man-image-103.webp"
            alt=""
            fill
            priority
            quality={80}
            sizes="100vw"
            className="object-cover"
            style={{ objectPosition: "center 20%" }}
          />
          <div className="wish-hero-overlay" />
          <div className="wish-hero-content">
            <p className="wish-hero-eyebrow">SAVED</p>
            <h1 className="wish-hero-title">WISHLIST</h1>
            <p className="wish-hero-sub">
              PIECES SET ASIDE
              <br />
              FOR LATER.
            </p>
          </div>
        </section>

        <div className="wish-body">
          {items.length === 0 ? (
            <div className="wish-empty">
              <p className="wish-empty-title">Your wishlist is empty.</p>
              <Link href="/collection" className="wish-btn">
                BROWSE THE COLLECTION
              </Link>
            </div>
          ) : (
            <>
              <div className="wish-header">
                <p className="wish-count">
                  {items.length} {items.length === 1 ? "ITEM" : "ITEMS"}
                </p>
                <Link href="/collection" className="wish-link">
                  CONTINUE SHOPPING
                </Link>
              </div>

              <div className="wish-grid">
                {items.map((item) => (
                  <article key={item.id} className="wish-card">
                    <Link
                      href={`/collection/${item.slug}`}
                      className="wish-card-img him-card-media"
                    >
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        quality={80}
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-cover object-top"
                        style={{ objectFit: "cover", objectPosition: "top center" }}
                      />
                    </Link>
                    <div className="wish-card-meta">
                      <Link
                        href={`/collection/${item.slug}`}
                        className="wish-card-name"
                      >
                        {item.name}
                      </Link>
                      <p className="wish-card-price">{fmt(item.price)}</p>
                      {item.swatches.length > 0 && (
                        <div className="wish-swatches">
                          {item.swatches.map((c, i) => (
                            <span
                              key={`${item.slug}-${c}-${i}`}
                              style={{ background: c }}
                            />
                          ))}
                        </div>
                      )}
                      <button
                        type="button"
                        className="wish-remove"
                        onClick={() => void remove(item.slug)}
                      >
                        Remove
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />

      <style jsx global>{`
        .wish-page {
          background: ${BG};
          min-height: 100vh;
          color: ${INK};
        }

        .wish-hero {
          position: relative;
          height: clamp(220px, 32vw, 380px);
          overflow: hidden;
          background: #000;
        }
        .wish-hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(0, 0, 0, 0.2) 0%,
            rgba(0, 0, 0, 0.55) 55%,
            rgba(0, 0, 0, 0.85) 100%
          );
          pointer-events: none;
        }
        .wish-hero-content {
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
        .wish-hero-eyebrow {
          margin: 0 0 8px;
          font-family: ${SANS};
          font-size: 9px;
          letter-spacing: 1.8px;
          text-transform: uppercase;
          color: ${MUTED};
        }
        .wish-hero-title {
          margin: 0;
          font-family: ${SERIF};
          font-size: clamp(40px, 7vw, 84px);
          font-weight: 400;
          letter-spacing: 0.02em;
          line-height: 0.92;
          text-transform: uppercase;
        }
        .wish-hero-sub {
          margin: 14px 0 0;
          font-family: ${SANS};
          font-size: clamp(9px, 0.85vw, 11px);
          letter-spacing: 1.6px;
          text-transform: uppercase;
          color: ${MUTED_SOFT};
          line-height: 1.55;
        }

        .wish-body {
          max-width: ${CONTENT_MAX};
          margin: 0 auto;
          padding: clamp(28px, 4vw, 48px) ${GUTTER} clamp(56px, 8vw, 96px);
          box-sizing: border-box;
        }

        .wish-empty {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 20px;
          padding: 24px 0;
        }
        .wish-empty-title {
          margin: 0;
          font-family: ${SANS};
          font-size: 13px;
          color: ${MUTED_SOFT};
        }
        .wish-btn {
          display: inline-flex;
          align-items: center;
          padding: 14px 22px;
          background: ${GOLD};
          color: #111;
          font-family: ${SANS};
          font-size: 10px;
          letter-spacing: 1.4px;
          text-decoration: none;
          text-transform: uppercase;
        }

        .wish-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 24px;
          gap: 12px;
        }
        .wish-count {
          margin: 0;
          font-family: ${SANS};
          font-size: 9px;
          letter-spacing: 1.4px;
          text-transform: uppercase;
          color: ${MUTED};
        }
        .wish-link {
          font-family: ${SANS};
          font-size: 9px;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: ${MUTED_SOFT};
          text-decoration: none;
          border-bottom: 1px solid ${MUTED_SOFT};
        }
        .wish-link:hover {
          color: ${INK};
          border-bottom-color: ${INK};
        }

        .wish-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: clamp(16px, 2vw, 24px);
        }
        .wish-card {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .wish-card-img {
          position: relative;
          display: block;
          aspect-ratio: 3 / 4;
          background: #1a1a1a;
          overflow: hidden;
        }
        .wish-card-name {
          font-family: ${SANS};
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          color: ${INK};
          text-decoration: none;
        }
        .wish-card-price {
          margin: 6px 0 0;
          font-family: ${SANS};
          font-size: 12px;
          color: ${MUTED_SOFT};
        }
        .wish-swatches {
          display: flex;
          gap: 5px;
          margin-top: 8px;
        }
        .wish-swatches span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.25);
        }
        .wish-remove {
          margin-top: 10px;
          padding: 0;
          border: none;
          background: none;
          font-family: ${SANS};
          font-size: 9px;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: ${MUTED};
          border-bottom: 1px solid ${MUTED};
          cursor: pointer;
          align-self: flex-start;
        }
        .wish-remove:hover {
          color: ${INK};
          border-bottom-color: ${INK};
        }

        @media (max-width: 1023px) {
          .wish-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        @media (max-width: 767px) {
          .wish-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </>
  );
}
