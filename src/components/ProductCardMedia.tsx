"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toCardImage } from "@/lib/card-image";

const INTERVAL_MS = 2000;
const FADE_MS = 480;

type ProductCardMediaProps = {
  name: string;
  image: string;
  images?: string[];
  sizes: string;
  priority?: boolean;
  quality?: number;
};

function uniqueCardSources(image: string, images?: string[]) {
  const raw: string[] = [];
  if (image) raw.push(image);
  if (images?.length) raw.push(...images);
  const mapped = raw.map(toCardImage).filter(Boolean);
  return [...new Set(mapped)];
}

export default function ProductCardMedia({
  name,
  image,
  images,
  sizes,
  priority = false,
  quality = 75,
}: ProductCardMediaProps) {
  const sources = useMemo(
    () => uniqueCardSources(image, images),
    [image, images],
  );
  const multi = sources.length > 1;

  const [hovering, setHovering] = useState(false);
  const [armed, setArmed] = useState(false);
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});
  const browserPreload = useRef(new Set<string>());

  const markLoaded = useCallback((src: string) => {
    setLoaded((prev) => (prev[src] ? prev : { ...prev, [src]: true }));
  }, []);

  const preloadSrc = useCallback(
    (src: string) => {
      if (!src || browserPreload.current.has(src)) return;
      browserPreload.current.add(src);
      const img = new window.Image();
      img.decoding = "async";
      img.onload = () => markLoaded(src);
      img.onerror = () => markLoaded(src);
      img.src = src;
    },
    [markLoaded],
  );

  // Warm the next frame while hovering; mount all layers once hover starts.
  useEffect(() => {
    if (!hovering || !multi) return;
    sources.forEach(preloadSrc);
  }, [hovering, multi, sources, preloadSrc]);

  useEffect(() => {
    if (!hovering || !multi) return;
    const next = sources[(index + 1) % sources.length];
    preloadSrc(next);
  }, [hovering, multi, index, sources, preloadSrc]);

  useEffect(() => {
    if (!hovering || !multi) return;

    const id = window.setInterval(() => {
      setIndex((current) => {
        for (let step = 1; step <= sources.length; step += 1) {
          const candidate = (current + step) % sources.length;
          if (loaded[sources[candidate]]) return candidate;
        }
        return current;
      });
    }, INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [hovering, multi, sources, loaded]);

  useEffect(() => {
    if (!hovering) setIndex(0);
  }, [hovering]);

  // Mount gallery frames after first hover so the grid doesn't fetch every image up front.
  const visibleSources = armed && multi ? sources : sources.slice(0, 1);
  const activeIndex = hovering ? index : 0;

  return (
    <div
      className="product-card-media"
      onMouseEnter={() => {
        setHovering(true);
        if (multi) setArmed(true);
      }}
      onMouseLeave={() => setHovering(false)}
    >
      {visibleSources.map((src, i) => {
        const active = sources.indexOf(src) === activeIndex;
        return (
          <Image
            key={src}
            src={src}
            alt={active ? name : ""}
            fill
            priority={priority && i === 0}
            quality={quality}
            sizes={sizes}
            className="object-cover object-top"
            style={{
              objectFit: "cover",
              objectPosition: "top center",
              opacity: active ? 1 : 0,
              transition: `opacity ${FADE_MS}ms ease`,
              zIndex: active ? 1 : 0,
            }}
            onLoad={() => markLoaded(src)}
          />
        );
      })}

      <style jsx>{`
        .product-card-media {
          position: absolute;
          inset: 0;
        }

        .product-card-media :global(img) {
          pointer-events: none;
        }

        @media (prefers-reduced-motion: reduce) {
          .product-card-media :global(img) {
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}
