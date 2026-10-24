"use client";

import { useEffect, useRef } from "react";
import Navbar from "./Navbar";
import { useHomeLoad } from "./HomeGate";

/* ─────────────── Settings you can tweak ─────────────── */
const FRAME_COUNT = 125; // files in /public/homepage/frames
const SCROLL_LENGTH_VH = 100; // how long the lift takes to open
const HOLD_END = 0.08; // last 8% of the scroll holds on the final frame
const SMOOTHING = 0.1; // 0.05 = very floaty, 0.2 = snappy
const ZOOM = 1; // 1 = fill screen
const CONCURRENCY = 8; // how many frames download at once
const TEXT_FADE_END = 0.35; // lift progress (0–1) where hero copy is fully faded out
const TEXT_FADE_DRIFT = -14; // px translateY at full fade

// Memory handling: frames are freed once the hero is this many screens above the viewport,
// and are loaded again as soon as the hero is within RELOAD_SCREENS of coming back.
const RELEASE_SCREENS = 2;
const RELOAD_SCREENS = 1;

const framePath = (i: number) =>
  `/homepage/frames/frame_${String(i + 1).padStart(4, "0")}.webp`;

function smoothstep(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

export default function HeroSection() {
  const wrapperRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);

  const homeLoad = useHomeLoad();
  const homeLoadRef = useRef(homeLoad);
  homeLoadRef.current = homeLoad;

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let disposed = false;
    let released = false;
    let loadToken = 0;
    const frames: (ImageBitmap | null)[] = Array(FRAME_COUNT).fill(null);
    let current = 0;
    let target = 0;
    let lastPos = -1;
    let lastT = 0;
    let raf = 0;

    const releaseFrames = () => {
      if (released) return;
      released = true;
      loadToken++;
      frames.forEach((f, i) => {
        f?.close();
        frames[i] = null;
      });
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      lastT = 0;
    };

    const getFrame = (index: number) => {
      for (let i = index; i >= 0; i--) {
        const f = frames[i];
        if (f) return f;
      }
      for (let i = index + 1; i < FRAME_COUNT; i++) {
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
    };

    const applyCopyFade = () => {
      const copy = copyRef.current;
      if (!copy) return;
      const progress = Math.min(1, Math.max(0, current / (FRAME_COUNT - 1)));
      const o = 1 - smoothstep(progress / TEXT_FADE_END);
      copy.style.opacity = String(o);
      copy.style.transform = `translate3d(0, ${(1 - o) * TEXT_FADE_DRIFT}px, 0)`;
      copy.style.pointerEvents = o < 0.2 ? "none" : "auto";
    };

    const tick = (t: number) => {
      const dt = lastT ? Math.min((t - lastT) / 1000, 0.05) : 1 / 60;
      lastT = t;
      const diff = target - current;

      if (reduceMotion || Math.abs(diff) < 0.005) {
        current = target;
        draw();
        applyCopyFade();
        raf = 0;
        lastT = 0;
        return;
      }
      current += diff * (1 - Math.pow(1 - SMOOTHING, dt * 60));
      draw();
      applyCopyFade();
      raf = requestAnimationFrame(tick);
    };

    const loadFrames = (report: boolean, descending: boolean) => {
      const token = ++loadToken;
      const order = Array.from({ length: FRAME_COUNT }, (_, k) =>
        descending ? FRAME_COUNT - 1 - k : k,
      );
      let next = 0;
      let done = 0;

      const worker = async () => {
        while (!disposed && token === loadToken) {
          const k = next++;
          if (k >= FRAME_COUNT) return;
          const i = order[k];

          if (!frames[i]) {
            try {
              const res = await fetch(framePath(i));
              const blob = await res.blob();
              const bmp = await createImageBitmap(blob);
              if (disposed || token !== loadToken) {
                bmp.close();
                return;
              }
              frames[i] = bmp;
              if (!report) draw(true);
            } catch {
              /* skip a missing frame */
            }
          }

          done++;
          if (report) {
            const pct = Math.round((done / FRAME_COUNT) * 100);
            homeLoadRef.current?.reportHeroProgress(pct);
            if (i === 0) draw(true);
          }
        }
      };

      return Promise.all(Array.from({ length: CONCURRENCY }, worker));
    };

    const onScroll = () => {
      const rect = wrapper.getBoundingClientRect();
      const vh = window.innerHeight || 1;

      if (!released) {
        if (rect.bottom < -vh * RELEASE_SCREENS) {
          releaseFrames();
          return;
        }
      } else {
        if (rect.bottom > -vh * RELOAD_SCREENS) {
          released = false;
          loadFrames(false, true);
        } else {
          return;
        }
      }

      readScroll();
      if (!raf) raf = requestAnimationFrame(tick);
    };

    loadFrames(true, false).then(() => {
      if (disposed) return;
      homeLoadRef.current?.reportHeroReady();
      readScroll();
      current = target;
      draw(true);
      applyCopyFade();
    });

    resize();
    readScroll();
    current = target;
    applyCopyFade();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", resize);
    return () => {
      disposed = true;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", resize);
      releaseFrames();
    };
  }, []);

  return (
    <section
      ref={wrapperRef}
      className="relative w-full"
      style={{ height: `${100 + SCROLL_LENGTH_VH}vh` }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-black">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          style={{ transform: "translateZ(0)" }}
          aria-label="HIM — Luxury wood-panelled corridor with a lift opening"
          role="img"
        />

        <div className="absolute inset-0 bg-black/10 z-10 pointer-events-none" />

        <div
          className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none"
          style={{
            height: "35%",
            background:
              "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 35%, rgba(0,0,0,0) 100%)",
          }}
        />

        <div
          className="absolute inset-y-0 left-0 z-10 pointer-events-none"
          style={{
            width: "55%",
            background:
              "linear-gradient(to right, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.2) 55%, rgba(0,0,0,0) 100%)",
          }}
        />

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

          <a href="/collection" className="him-hero-btn">
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

        <div
          ref={hintRef}
          className="absolute bottom-10 left-1/2 z-20 -translate-x-1/2 flex flex-col items-center gap-3 text-white/80 pointer-events-none transition-opacity duration-500"
        />

        <Navbar />
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

        .him-hero-copy {
          left: clamp(20px, 5.9vw, 112px);
          bottom: clamp(28px, 5vh, 60px);
          max-width: min(90%, 560px);
          color: #fff;
        }

        .him-hero-label {
          display: block;
          margin-bottom: clamp(10px, 1.4vh, 16px);
          margin-bottom: -3px;
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
            margin-top: 18px;
          }
        }
      `}</style>
    </section>
  );
}
