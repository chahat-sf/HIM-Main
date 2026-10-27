"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import type { CatalogProduct } from "@/lib/catalog-types";
import ProductCardMedia from "@/components/ProductCardMedia";
import { useWishlist } from "@/hooks/useWishlist";

type ProductCardProps = {
  product: CatalogProduct;
  sizes?: string;
  quality?: number;
};

export default function ProductCard({
  product,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  quality = 90,
}: ProductCardProps) {
  const { has: inWishlist, toggle: toggleWishlist } = useWishlist();
  const wishlisted = inWishlist(product.slug);

  return (
    <article className="product-card group" style={{ position: "relative" }}>
      <div
        className="product-card-img him-card-media"
        style={{ position: "relative" }}
      >
        <Link
          href={`/collection/${product.slug}`}
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
          />
        </Link>
        <button
          type="button"
          data-no-route-loader="true"
          className={`product-card-wish${wishlisted ? " is-active" : ""}`}
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
    </article>
  );
}
