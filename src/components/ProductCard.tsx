"use client";

import Link from "next/link";
import { useRef, useState, type PointerEvent } from "react";
import { ChevronLeft, ChevronRight, Heart } from "lucide-react";
import type { CatalogProduct } from "@/lib/catalog-types";
import ProductCardMedia from "@/components/ProductCardMedia";
import { useWishlist } from "@/hooks/useWishlist";

const SWIPE_MIN = 40;

type ProductCardProps = {
  product: CatalogProduct;
  sizes?: string;
  quality?: number;
};

function uniqueImages(image: string, images?: string[]) {
  const raw: string[] = [];
  if (image) raw.push(image);
  if (images?.length) raw.push(...images);
  return [...new Set(raw.filter(Boolean))];
}

export default function ProductCard({
  product,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  quality = 90,
}: ProductCardProps) {
  const { has: inWishlist, toggle: toggleWishlist } = useWishlist();
  const wishlisted = inWishlist(product.slug);
  const [wishPop, setWishPop] = useState(false);

  const allImages = uniqueImages(product.image, product.images);
  const hasMulti = allImages.length > 1;

  const [armed, setArmed] = useState(false);
  const [index, setIndex] = useState(0);
  const swipedRef = useRef(false);
  const swipeRef = useRef<{
    id: number;
    x: number;
    y: number;
    count: number;
    active: boolean;
  } | null>(null);

  const arm = () => setArmed(true);

  const step = (dir: 1 | -1) => {
    if (!hasMulti) return;
    setIndex((cur) => (cur + dir + allImages.length) % allImages.length);
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!hasMulti) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    swipeRef.current = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      count: allImages.length,
      active: false,
    };
    swipedRef.current = false;
    arm();
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const s = swipeRef.current;
    if (!s || s.id !== e.pointerId || s.active) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
      swipeRef.current = null;
      return;
    }
    if (Math.abs(dx) >= 10 && Math.abs(dx) > Math.abs(dy)) {
      s.active = true;
      swipedRef.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const s = swipeRef.current;
    if (!s || s.id !== e.pointerId) return;
    swipeRef.current = null;
    if (!s.active) return;
    const dx = e.clientX - s.x;
    if (Math.abs(dx) >= SWIPE_MIN) step(dx < 0 ? 1 : -1);
    window.setTimeout(() => {
      swipedRef.current = false;
    }, 0);
  };

  return (
    <article className="product-card group" style={{ position: "relative" }}>
      <div
        className="product-card-img him-card-media"
        style={{
          position: "relative",
          touchAction: hasMulti ? "pan-y" : "pan-x pan-y",
        }}
        onPointerDown={hasMulti ? onPointerDown : undefined}
        onPointerMove={hasMulti ? onPointerMove : undefined}
        onPointerUp={hasMulti ? onPointerUp : undefined}
        onPointerCancel={() => {
          swipeRef.current = null;
        }}
        onClickCapture={(e) => {
          if (swipedRef.current) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
        <Link
          href={`/collection/${product.slug}`}
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          style={{ position: "absolute", inset: 0, display: "block" }}
          tabIndex={-1}
          aria-hidden="true"
        >
          <ProductCardMedia
            name={product.name}
            image={product.image}
            images={product.images}
            quality={quality}
            sizes={sizes}
            armed={armed}
            controlledIndex={hasMulti ? index : undefined}
          />
        </Link>

        {hasMulti && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              className="product-card-nav product-card-nav--prev"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                arm();
                step(-1);
              }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <ChevronLeft
                size={14}
                strokeWidth={1.25}
                absoluteStrokeWidth={false}
                aria-hidden
              />
            </button>
            <button
              type="button"
              aria-label="Next image"
              className="product-card-nav product-card-nav--next"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                arm();
                step(1);
              }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <ChevronRight
                size={14}
                strokeWidth={1.25}
                absoluteStrokeWidth={false}
                aria-hidden
              />
            </button>

            <div
              className="product-card-dots"
              role="tablist"
              aria-label={`${product.name} images`}
              onPointerDown={(e) => e.stopPropagation()}
            >
              {allImages.map((_, di) => (
                <button
                  key={di}
                  type="button"
                  role="tab"
                  aria-selected={di === index}
                  aria-label={`Show image ${di + 1}`}
                  className={`product-card-dot${di === index ? " active" : ""}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    arm();
                    setIndex(di);
                  }}
                />
              ))}
            </div>
          </>
        )}

        <button
          type="button"
          data-no-route-loader="true"
          className={`product-card-wish${wishlisted ? " is-active" : ""}${wishPop ? " is-pop" : ""}`}
          aria-label={
            wishlisted
              ? `Remove ${product.name} from wishlist`
              : `Add ${product.name} to wishlist`
          }
          aria-pressed={wishlisted}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setWishPop(true);
            void toggleWishlist({
              productId: product.id,
              slug: product.slug,
              name: product.name,
              price: Math.round(product.priceCents / 100) || 0,
              image: product.image,
              swatches: product.swatches,
            });
          }}
          onAnimationEnd={() => setWishPop(false)}
        >
          <Heart
            size={14}
            strokeWidth={1.25}
            absoluteStrokeWidth={false}
            fill={wishlisted ? "currentColor" : "none"}
            aria-hidden
          />
        </button>
      </div>

      <div className="product-card-body">
        <Link
          href={`/collection/${product.slug}`}
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <p className="product-card-name">{product.name}</p>
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

      <style jsx>{`
        .product-card-nav {
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
          transition:
            opacity 180ms ease,
            background 150ms ease,
            transform 150ms ease;
          box-shadow: 0 1px 6px rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(4px);
        }

        .product-card:hover .product-card-nav {
          opacity: 1;
          pointer-events: auto;
        }

        .product-card-nav:hover {
          background: #fff;
          transform: translateY(-50%) scale(1.06);
        }

        .product-card-nav--prev {
          left: 8px;
        }

        .product-card-nav--next {
          right: 8px;
        }

        .product-card-dots {
          position: absolute;
          bottom: 8px;
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

        .product-card:hover .product-card-dots {
          opacity: 1;
          pointer-events: auto;
        }

        .product-card-dot {
          position: relative;
          width: 18px;
          height: 14px;
          padding: 0;
          border: 0;
          background: transparent;
          cursor: pointer;
          transition: width 200ms ease;
        }

        .product-card-dot::before {
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

        .product-card-dot:hover::before {
          background: rgba(255, 255, 255, 0.8);
        }

        .product-card-dot.active {
          width: 24px;
        }

        .product-card-dot.active::before {
          background: #fff;
        }

        /* Mobile: swipe only — hide chevrons; keep dots as position cues */
        @media (hover: none), (max-width: 768px) {
          .product-card-nav {
            display: none !important;
          }

          .product-card-dots {
            opacity: 1;
            pointer-events: none;
          }

          .product-card-dot {
            pointer-events: none;
          }
        }
      `}</style>
    </article>
  );
}
