"use client";

import { useEffect, useRef } from "react";
import Navbar from "./Navbar";
import { useHomeLoad } from "./HomeGate";

const HERO_VIDEO = "/homepage/Hero-video-Section.mp4";
/** Slightly before EOS so browsers still have a decodable frame to paint. */
const HOLD_EPS = 0.05;
/** Seconds of lead-in buffer before the gate can unlock. */
const READY_BUFFER_S = 2;
/** Seconds before end when we peek the next section. */
const SCROLL_LEAD_S = 1;
/** Fraction of viewport height to scroll down. */
const SCROLL_FRAC = 0.07;
/** Duration of the eased peek scroll (ms). */
const SCROLL_MS = 1400;
/** Skip auto-scroll if the user already left the hero. */
const USER_SCROLL_FRAC = 0.15;

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export default function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null);

  const homeLoad = useHomeLoad();
  const homeLoadRef = useRef(homeLoad);
  homeLoadRef.current = homeLoad;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let disposed = false;
    let duration = 0;
    let ready = false;
    let started = false;
    let pendingStart = false;
    let finished = false;
    let scrolledAway = false;
    let scrollRaf = 0;

    const holdTime = () =>
      Math.max(0, (Number.isFinite(duration) ? duration : 0) - HOLD_EPS);

    const scrollPeek = () => {
      const from = window.scrollY;
      const delta = window.innerHeight * SCROLL_FRAC;
      const start = performance.now();

      const tick = (now: number) => {
        if (disposed) return;
        const t = Math.min(1, (now - start) / SCROLL_MS);
        window.scrollTo(0, from + delta * easeInOutCubic(t));
        if (t < 1) scrollRaf = requestAnimationFrame(tick);
      };

      scrollRaf = requestAnimationFrame(tick);
    };

    /** Enough lead-in buffered to start without a stall (rest streams after enter). */
    const hasStartBuffer = () => {
      if (!duration || duration <= 0) return false;
      if (video.readyState >= 3) return true; // HAVE_FUTURE_DATA+
      if (!video.buffered.length) return false;
      for (let i = 0; i < video.buffered.length; i++) {
        if (
          video.buffered.start(i) <= 0.05 &&
          video.buffered.end(i) >= Math.min(duration - 0.05, READY_BUFFER_S)
        ) {
          return true;
        }
      }
      return false;
    };

    const reportBuffered = () => {
      if (disposed || !duration) return;
      let end = 0;
      if (video.buffered.length) {
        for (let i = 0; i < video.buffered.length; i++) {
          end = Math.max(end, video.buffered.end(i));
        }
      }
      const target = Math.min(duration, READY_BUFFER_S);
      const pct = Math.round(Math.min(100, (end / Math.max(target, 0.01)) * 100));
      homeLoadRef.current?.reportHeroProgress(pct);
      if (hasStartBuffer()) markReady();
    };

    /** Re-seek so a suspended tab paints the last frame again (Safari/Chrome). */
    const restoreHoldFrame = () => {
      if (disposed || !finished || duration <= 0) return;
      video.pause();
      const t = holdTime();
      // Nudge time if already parked so the decoder refreshes the frame.
      if (Math.abs(video.currentTime - t) < 0.001) {
        video.currentTime = Math.max(0, t - 0.001);
      }
      video.currentTime = t;
    };

    const playOnce = () => {
      if (disposed || started || reduceMotion) return;
      if (!ready) {
        pendingStart = true;
        return;
      }
      started = true;
      pendingStart = false;
      finished = false;
      scrolledAway = false;
      // Only seek if needed — a seek-to-0 hitch right before play feels choppy.
      try {
        if (video.currentTime > 0.02) video.currentTime = 0;
      } catch {
        /* ignore seek errors before metadata */
      }
      // Unmute on gate click — same user gesture as him-start, so browsers allow audio.
      video.muted = false;
      video.removeAttribute("muted");
      void video.play().catch(() => {
        /* autoplay can still fail; gate click usually unlocks */
      });
    };

    const markReady = () => {
      if (disposed || ready) return;
      duration = Number.isFinite(video.duration) ? video.duration : 0;
      if (duration <= 0 || !hasStartBuffer()) return;
      ready = true;
      video.pause();
      try {
        if (video.currentTime > 0.02) video.currentTime = 0;
      } catch {
        /* ignore */
      }
      homeLoadRef.current?.reportHeroProgress(100);
      homeLoadRef.current?.reportHeroReady();
      if (pendingStart) playOnce();
    };

    const onCanPlay = () => {
      reportBuffered();
      if (hasStartBuffer()) markReady();
    };

    const onEnded = () => {
      finished = true;
      video.pause();
      restoreHoldFrame();
    };

    const onTimeUpdate = () => {
      if (disposed || !started || finished || scrolledAway || reduceMotion) return;
      if (!duration || duration <= 0) return;
      const remaining = duration - video.currentTime;
      if (remaining > SCROLL_LEAD_S) return;
      scrolledAway = true;
      if (window.scrollY > window.innerHeight * USER_SCROLL_FRAC) return;
      scrollPeek();
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") restoreHoldFrame();
    };

    const onPageShow = () => {
      restoreHoldFrame();
    };

    const onLoadedMetadata = () => {
      duration = Number.isFinite(video.duration) ? video.duration : 0;
      reportBuffered();
    };

    video.muted = false;
    video.playsInline = true;
    video.preload = "auto";
    video.loop = false;
    video.pause();

    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("canplaythrough", onCanPlay);
    video.addEventListener("progress", reportBuffered);
    video.addEventListener("ended", onEnded);
    video.addEventListener("timeupdate", onTimeUpdate);
    window.addEventListener("him-start", playOnce);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pageshow", onPageShow);

    if (video.readyState >= 1) onLoadedMetadata();
    reportBuffered();
    if (!ready) video.load();

    return () => {
      disposed = true;
      cancelAnimationFrame(scrollRaf);
      window.removeEventListener("him-start", playOnce);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", onPageShow);
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("canplaythrough", onCanPlay);
      video.removeEventListener("progress", reportBuffered);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.pause();
    };
  }, []);

  return (
    <section className="relative w-full h-screen overflow-hidden bg-black">
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        style={{
          transform: "translateZ(0)",
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
        }}
        src={HERO_VIDEO}
        playsInline
        preload="auto"
        aria-label="HIM — Luxury wood-panelled corridor with a lift opening"
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

      <div className="him-hero-copy absolute z-20">
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

      <Navbar />

      <style jsx global>{`
        .him-hero-copy {
          left: clamp(20px, 5.9vw, 112px);
          bottom: clamp(28px, 5vh, 60px);
          max-width: min(90%, 560px);
          color: #fff;
        }

.him-hero-label {
  display: block;
  margin-bottom: 4px;
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
  line-height: 0.88;
  letter-spacing: 0.01em;
}

.him-hero-text {
  margin: 10px 0 0;
  max-width: 340px;
  color: rgba(255, 255, 255, 0.82);
  font-family: Arial, Helvetica, sans-serif;
  font-size: clamp(11px, 0.85vw, 15px);
  font-weight: 400;
  line-height: 1.4;
}

.him-hero-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
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

  .him-hero-label,
  .him-hero-title,
  .him-hero-text {
    display: none;
  }

  .him-hero-btn {
    height: 36px;
    font-size: 10px;
    margin-top: 0;
  }
}
      `}</style>
    </section>
  );
}
