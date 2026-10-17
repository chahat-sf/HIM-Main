"use client";

import { useEffect, useRef, useState } from "react";
import Navbar from "./Navbar";

/* ─────────────── Settings you can tweak ─────────────── */
const FRAME_COUNT = 72;          // number of files in /public/homepage/frames
const SCROLL_LENGTH_VH = 200;    // how long the lift takes to open (450 = 4.5 screens of scrolling)
const HOLD_END = 0.08;           // last 8% of the scroll holds on the final frame
const SMOOTHING = 0.1;           // 0.05 = very floaty, 0.2 = snappy (same speed on every screen)
const ZOOM = 1;                  // 1 = fill screen. Use 1.16 for the extra zoom you had before
const CONCURRENCY = 8;           // how many frames download at once
const TEXT_FADE_SPEED = 8;       // how fast the left text fades while scrolling (higher = faster)

const framePath = (i: number) =>
  `/homepage/frames/frame_${String(i + 1).padStart(4, "0")}.webp`;

export default function HeroSection() {
  const wrapperRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let disposed = false;
    const frames: (ImageBitmap | null)[] = Array(FRAME_COUNT).fill(null);
    let current = 0; // position shown right now (can be between two frames)
    let target = 0;  // position the scroll wants
    let lastPos = -1;
    let lastT = 0;
    let raf = 0;
    let loadedCount = 0;

    const getFrame = (index: number) => {
      for (let i = index; i >= 0; i--) {
        const f = frames[i];
        if (f) return f;
      }
      return null;
    };

    const paint = (img: ImageBitmap, alpha: number) => {
      const cw = canvas.width;
      const ch = canvas.height;
      const scale = Math.max(cw / img.width, ch / img.height) * ZOOM;
      const dw = img.width * scale;
      const dh = img.height * scale;
      ctx.globalAlpha = alpha;
      ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
      ctx.globalAlpha = 1;
    };

    const draw = (force = false) => {
      const pos = Math.min(FRAME_COUNT - 1, Math.max(0, current));
      if (!force && Math.abs(pos - lastPos) < 0.004) return;

      const i = Math.floor(pos);
      const blend = pos - i;
      const a = getFrame(i);
      if (!a) return;
      lastPos = pos;

      paint(a, 1);
      // Cross-fade into the next frame → motion looks continuous, not stepped
      if (blend > 0.02 && i + 1 < FRAME_COUNT) {
        const b = frames[i + 1];
        if (b) paint(b, blend);
      }
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      lastPos = -1;
      draw(true);
    };

    const readScroll = () => {
      const rect = wrapper.getBoundingClientRect();
      const total = wrapper.offsetHeight - window.innerHeight;
      const p = Math.min(1, Math.max(0, -rect.top / total));
      const animP = Math.min(1, p / (1 - HOLD_END));
      target = animP * (FRAME_COUNT - 1);
      if (hintRef.current) {
        hintRef.current.style.opacity = p > 0.02 ? "0" : "1";
      }
      // Left-side hero text fades out as the lift starts to open
      if (copyRef.current) {
        const o = Math.max(0, 1 - p * TEXT_FADE_SPEED);
        copyRef.current.style.opacity = String(o);
        copyRef.current.style.transform = `translate3d(0, ${(1 - o) * -14}px, 0)`;
        copyRef.current.style.pointerEvents = o < 0.2 ? "none" : "auto";
      }
    };

    const tick = (t: number) => {
      const dt = lastT ? Math.min((t - lastT) / 1000, 0.05) : 1 / 60;
      lastT = t;
      const diff = target - current;

      if (reduceMotion || Math.abs(diff) < 0.005) {
        current = target;
        draw();
        raf = 0;
        lastT = 0;
        return;
      }
      // frame-rate independent easing
      current += diff * (1 - Math.pow(1 - SMOOTHING, dt * 60));
      draw();
      raf = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      readScroll();
      if (!raf) raf = requestAnimationFrame(tick);
    };

    /* Load every frame, decode it off the main thread (ImageBitmap) */
    let next = 0;
    const worker = async () => {
      while (!disposed) {
        const i = next++;
        if (i >= FRAME_COUNT) return;
        try {
          const res = await fetch(framePath(i));
          const blob = await res.blob();
          const bmp = await createImageBitmap(blob);
          if (disposed) {
            bmp.close();
            return;
          }
          frames[i] = bmp;
        } catch {
          /* skip a missing frame */
        }
        loadedCount++;
        const pct = Math.round((loadedCount / FRAME_COUNT) * 100);
        if (barRef.current) barRef.current.style.width = `${pct}%`;
        if (textRef.current) textRef.current.textContent = `Loading ${pct}%`;
        if (i === 0) draw(true);
      }
    };

    Promise.all(Array.from({ length: CONCURRENCY }, worker)).then(() => {
      if (disposed) return;
      setReady(true);
      readScroll();
      current = target;
      draw(true);
    });

    resize();
    readScroll();
    current = target;

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", resize);
    return () => {
      disposed = true;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", resize);
      if (raf) cancelAnimationFrame(raf);
      frames.forEach((f) => f?.close());
    };
  }, []);

  return (
    <section
      ref={wrapperRef}
      className="relative w-full"
      style={{ height: `${100 + SCROLL_LENGTH_VH}vh` }}
    >
      {/* Pinned screen — stays in place while the lift opens */}
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-black">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          style={{ transform: "translateZ(0)" }}
          aria-label="HIM — Luxury wood-panelled corridor with a lift opening"
          role="img"
        />

        {/* Overall subtle dark overlay */}
        <div className="absolute inset-0 bg-black/10 z-10 pointer-events-none" />

        {/* Bottom shade */}
        <div
          className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none"
          style={{
            height: "35%",
            background:
              "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 35%, rgba(0,0,0,0) 100%)",
          }}
        />

        {/* Left-side shade so the text stays readable */}
        <div
          className="absolute inset-y-0 left-0 z-10 pointer-events-none"
          style={{
            width: "55%",
            background:
              "linear-gradient(to right, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.2) 55%, rgba(0,0,0,0) 100%)",
          }}
        />

        {/* HERO TEXT — bottom left */}
        <div
          ref={copyRef}
          className="him-hero-copy absolute z-20"
          style={{ willChange: "opacity, transform" }}
        >
          <span className="him-hero-label">NEW SEASON</span>

          <h1 className="him-hero-title">
            Built
            <br />
            for what
            <br />
            moves you.
          </h1>

          <p className="him-hero-text">
            Timeless fits, modern details and colours that go anywhere.
          </p>

          <a href="/shop" className="him-hero-btn">
            <span>EXPLORE COLLECTION</span>
            <svg
              width="12"
              height="9"
              viewBox="0 0 14 10"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M1 5H12.5M8.5 1L12.5 5L8.5 9"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </div>

        {/* Scroll hint */}
        <div
          ref={hintRef}
          className="absolute bottom-10 left-1/2 z-20 -translate-x-1/2 flex flex-col items-center gap-3 text-white/80 pointer-events-none transition-opacity duration-500"
        >
        </div>

        {/* Navbar */}
        <Navbar />

        {/* Loader */}
        <div
          className={`absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-black transition-opacity duration-700 ${
            ready ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          <div className="h-px w-48 bg-white/20">
            <div ref={barRef} className="h-full w-0 bg-white" />
          </div>
          <span ref={textRef} className="text-xs text-white/60">
            Loading 0%
          </span>
        </div>
      </div>

      <style jsx global>{`
        *,
        *::before,
        *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        html,
        body {
          background: #000;
          color: #fff;
        }

        /* ───────── Hero text (left, bottom) ───────── */

        .him-hero-copy {
          left: clamp(20px, 5.9vw, 112px);
          bottom: clamp(28px, 5vh, 60px);
          max-width: min(90%, 560px);
          color: #fff;
        }

        .him-hero-label {
          display: block;
          margin-bottom: clamp(10px, 1.4vh, 16px);
          color: rgba(255, 255, 255, 0.7);
          font-family: Arial, Helvetica, sans-serif;
          font-size: clamp(8px, 0.6vw, 11px);
          font-weight: 400;
          letter-spacing: 1.6px;
          text-transform: uppercase;
        }

        .him-hero-title {
          margin: 0;
          color: #fff;
          font-family: "Cormorant Garamond", "Cinzel", Georgia, serif;
          font-size: clamp(34px, 4.2vw, 76px);
          font-weight: 500;
          font-variant: small-caps;
          line-height: 1.04;
          letter-spacing: 0.01em;
        }

        .him-hero-text {
          margin: clamp(12px, 1.8vh, 20px) 0 0;
          max-width: 340px;
          color: rgba(255, 255, 255, 0.82);
          font-family: Arial, Helvetica, sans-serif;
          font-size: clamp(11px, 0.85vw, 15px);
          font-weight: 400;
          line-height: 1.55;
        }

        .him-hero-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-top: clamp(16px, 2.4vh, 26px);
          height: clamp(32px, 2.7vw, 46px);
          padding: 0 clamp(16px, 1.5vw, 26px);
          background: #fff;
          color: #1a1612;
          font-family: Arial, Helvetica, sans-serif;
          font-size: clamp(9px, 0.7vw, 12px);
          font-weight: 500;
          letter-spacing: 0.4px;
          text-decoration: none;
          text-transform: uppercase;
          transition: background 200ms ease, transform 200ms ease;
        }

        .him-hero-btn:hover {
          background: #f1eee9;
          transform: translateY(-1px);
        }

        @media (max-width: 768px) {
          .him-hero-copy {
            left: 20px;
            bottom: 36px;
          }

          .him-hero-title {
            font-size: clamp(34px, 10vw, 48px);
          }

          .him-hero-text {
            max-width: 260px;
            font-size: 12px;
          }

          .him-hero-btn {
            height: 36px;
            font-size: 10px;
          }
        }
      `}</style>
    </section>
  );
}