"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type DeferredMountProps = {
  children: ReactNode;
  /** Placeholder height while waiting. */
  minHeight?: string;
  rootMargin?: string;
};

/** Mount children only when near the viewport (below-fold lazy mount). */
export default function DeferredMount({
  children,
  minHeight = "50vh",
  rootMargin = "240px 0px",
}: DeferredMountProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin, threshold: 0.01 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);

  return (
    <div ref={ref} style={{ minHeight: show ? undefined : minHeight }}>
      {show ? children : null}
    </div>
  );
}
