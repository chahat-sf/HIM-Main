"use client";

import { useEffect, useRef } from "react";
import Navbar from "./Navbar";
import { useHomeLoad } from "./HomeGate";

const HERO_VIDEO = "/homepage/hero.mp4";
/** Slightly before EOS so browsers still have a decodable frame to paint. */
const HOLD_EPS = 0.05;

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

    const holdTime = () =>
      Math.max(0, (Number.isFinite(duration) ? duration : 0) - HOLD_EPS);

    /** True once the full clip is in the buffer — avoids mid-play stalls. */
    const isFullyBuffered = () => {
      if (!duration || duration <= 0 || !video.buffered.length) return false;
      for (let i = 0; i < video.buffered.length; i++) {
        if (
          video.buffered.start(i) <= 0.05 &&
          video.buffered.end(i) >= duration - 0.1
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
      const pct = Math.round(Math.min(100, (end / duration) * 100));
      homeLoadRef.current?.reportHeroProgress(pct);
      if (isFullyBuffered()) markReady();
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
      if (duration <= 0 || !isFullyBuffered()) return;
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

    const onEnded = () => {
      finished = true;
      video.pause();
      restoreHoldFrame();
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
    video.addEventListener("canplaythrough", markReady);
    video.addEventListener("progress", reportBuffered);
    video.addEventListener("ended", onEnded);
    window.addEventListener("him-start", playOnce);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pageshow", onPageShow);

    if (video.readyState >= 1) onLoadedMetadata();
    reportBuffered();
    if (!ready) video.load();

    return () => {
      disposed = true;
      window.removeEventListener("him-start", playOnce);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", onPageShow);
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("canplaythrough", markReady);
      video.removeEventListener("progress", reportBuffered);
      video.removeEventListener("ended", onEnded);
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

  .him-hero-title {
    font-size: clamp(34px, 10vw, 48px);
    line-height: 0.92;
  }

  .him-hero-text {
    max-width: 260px;
    font-size: 12px;
    margin-top: 10px;
  }

  .him-hero-btn {
    height: 36px;
    font-size: 10px;
    margin-top: 14px;
  }
}
      `}</style>
    </section>
  );
}
