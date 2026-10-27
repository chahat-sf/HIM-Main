"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ProgressiveImage from "@/components/ProgressiveImage";
import { toHighImage, toMidImage } from "@/lib/product-image";

const INTERVAL_MS = 2000;
const FADE_MS = 480;

type ProductCardMediaProps = {
  name: string;
  image: string;
  images?: string[];
  sizes: string;
  priority?: boolean;
  quality?: number;
  armed?: boolean;
  /** When provided, the component operates in controlled mode (no auto-cycle). */
  controlledIndex?: number;
  onPrev?: () => void;
  onNext?: () => void;
};

function uniqueCatalogSources(image: string, images?: string[]) {
  const raw: string[] = [];
  if (image) raw.push(image);
  if (images?.length) raw.push(...images);
  const mapped = raw.map(toHighImage).filter(Boolean);
  return [...new Set(mapped)];
}

export default function ProductCardMedia({
  name,
  image,
  images,
  sizes,
  priority = false,
  quality = 80,
  armed: armedProp,
  controlledIndex,
  onPrev,
  onNext,
}: ProductCardMediaProps) {
  const sources = useMemo(
    () => uniqueCatalogSources(image, images),
    [image, images],
  );
  const multi = sources.length > 1;
  const isControlled = controlledIndex !== undefined;

  const [hovering, setHovering] = useState(false);
  const [internalArmed, setInternalArmed] = useState(false);
  const armed = armedProp ?? internalArmed;
  const [autoIndex, setAutoIndex] = useState(0);
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});
  const browserPreload = useRef(new Set<string>());

  const index = isControlled ? controlledIndex! : autoIndex;

  const markLoaded = useCallback((src: string) => {
    setLoaded((prev) => (prev[src] ? prev : { ...prev, [src]: true }));
  }, []);

  const preloadSrc = useCallback(
    (src: string) => {
      if (!src || browserPreload.current.has(src)) return;
      browserPreload.current.add(src);
      // Warm mid tier for hover gallery siblings (cards never fetch high).
      const mid = toMidImage(src);
      const img = new window.Image();
      img.decoding = "async";
      img.onload = () => markLoaded(src);
      img.onerror = () => markLoaded(src);
      img.src = mid;
    },
    [markLoaded],
  );

  // Warm the next frame while hovering or armed; mount all layers once armed.
  useEffect(() => {
    if ((!hovering && !armed) || !multi) return;
    sources.forEach(preloadSrc);
  }, [hovering, armed, multi, sources, preloadSrc]);

  useEffect(() => {
    if ((!hovering && !armed) || !multi) return;
    const next = sources[(index + 1) % sources.length];
    preloadSrc(next);
  }, [hovering, armed, multi, index, sources, preloadSrc]);

  // Auto-cycle only in uncontrolled mode
  useEffect(() => {
    if (isControlled || !hovering || !multi) return;

    const id = window.setInterval(() => {
      setAutoIndex((current) => {
        for (let step = 1; step <= sources.length; step += 1) {
          const candidate = (current + step) % sources.length;
          if (loaded[sources[candidate]]) return candidate;
        }
        return current;
      });
    }, INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [isControlled, hovering, multi, sources, loaded]);

  useEffect(() => {
    if (!hovering && !isControlled) setAutoIndex(0);
  }, [hovering, isControlled]);

  // Mount gallery frames after first hover so the grid doesn't fetch every image up front.
  const visibleSources = armed && multi ? sources : sources.slice(0, 1);
  const activeIndex = hovering || isControlled ? index : 0;

  return (
    <div
      className="product-card-media"
      onMouseEnter={() => {
        setHovering(true);
        if (multi) setInternalArmed(true);
      }}
      onMouseLeave={() => setHovering(false)}
    >
      {visibleSources.map((src, i) => {
        const active = sources.indexOf(src) === activeIndex;
        return (
          <ProgressiveImage
            key={src}
            src={src}
            maxTier="mid"
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
              // Keep transform transition from globals.css — do not override
              // with opacity-only, or hover zoom snaps instead of easing.
              transition: `opacity ${FADE_MS}ms ease, transform 700ms cubic-bezier(0.22, 1, 0.36, 1)`,
              zIndex: active ? 1 : 0,
            }}
            onLoadingComplete={() => markLoaded(src)}
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
