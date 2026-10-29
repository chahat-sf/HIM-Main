"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
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
/** Delay after auto-scroll ends before the mouse cue appears (ms). */
const CUE_AFTER_SCROLL_MS = 1000;
/** Re-show the cue after this long with no scroll activity (ms). */
const CUE_IDLE_MS = 15000;
/** Fade-out duration once the user scrolls (ms). */
const CUE_FADE_OUT_MS = 500;
/** Fade-in duration when the cue appears (ms). */
const CUE_FADE_IN_MS = 1100;

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cueVisible, setCueVisible] = useState(false);
  const [cueIn, setCueIn] = useState(false);
  const [cueFading, setCueFading] = useState(false);

  const homeLoad = useHomeLoad();
  const homeLoadRef = useRef(homeLoad);
  homeLoadRef.current = homeLoad;

  const cueVisibleRef = useRef(false);
  const cueFadingRef = useRef(false);
  const peekingRef = useRef(false);
  const setCueVisibleSafe = (v: boolean) => {
    cueVisibleRef.current = v;
    setCueVisible(v);
  };
  const setCueFadingSafe = (v: boolean) => {
    cueFadingRef.current = v;
    setCueFading(v);
  };

  // Lock hero height in px so mobile browser chrome show/hide (dvh/svh churn)
  // does not rescale the video and look like zoom-on-scroll.
  // Relock only on orientation / real width change — not on every scroll resize.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    let lastWidth = window.innerWidth;

    const lockHeight = () => {
      // Prefer layout viewport height (more stable than visualViewport on scroll).
      const h = window.innerHeight;
      if (!h || !Number.isFinite(h)) return;
      section.style.height = `${Math.round(h)}px`;
    };

    lockHeight();

    const onOrientation = () => {
      requestAnimationFrame(() => {
        lastWidth = window.innerWidth;
        lockHeight();
      });
    };

    const onResize = () => {
      const w = window.innerWidth;
      if (w === lastWidth) return; // ignore chrome show/hide height-only churn
      lastWidth = w;
      lockHeight();
    };

    window.addEventListener("orientationchange", onOrientation);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("orientationchange", onOrientation);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // Fade the cue in on the frame after mount so opacity can transition from 0 → 1.
  useEffect(() => {
    if (!cueVisible || cueFading) return;
    setCueIn(false);
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setCueIn(true));
    });
    return () => cancelAnimationFrame(id);
  }, [cueVisible, cueFading]);

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
    let cueArmed = false;
    let scrollRaf = 0;
    let fadeTimer = 0;
    let cueDelayTimer = 0;
    let idleTimer = 0;
    let peekPrevBehavior: string | null = null;

    const holdTime = () =>
      Math.max(0, (Number.isFinite(duration) ? duration : 0) - HOLD_EPS);

    const clearIdleTimer = () => {
      if (!idleTimer) return;
      window.clearTimeout(idleTimer);
      idleTimer = 0;
    };

    const revealCue = () => {
      if (disposed || cueVisibleRef.current) return;
      clearIdleTimer();
      if (fadeTimer) {
        window.clearTimeout(fadeTimer);
        fadeTimer = 0;
      }
      setCueFadingSafe(false);
      setCueVisibleSafe(true);
    };

    const scheduleIdleCue = () => {
      if (disposed || !cueArmed || reduceMotion) return;
      clearIdleTimer();
      idleTimer = window.setTimeout(() => {
        if (disposed || cueVisibleRef.current) return;
        revealCue();
      }, CUE_IDLE_MS);
    };

    const dismissCue = () => {
      if (disposed || !cueVisibleRef.current || cueFadingRef.current) return;
      setCueFadingSafe(true);
      setCueIn(false);
      fadeTimer = window.setTimeout(() => {
        if (disposed) return;
        setCueVisibleSafe(false);
        setCueFadingSafe(false);
        setCueIn(false);
      }, CUE_FADE_OUT_MS);
      scheduleIdleCue();
    };

    const showCueAfterScroll = () => {
      if (disposed || cueVisibleRef.current) return;
      if (cueDelayTimer) window.clearTimeout(cueDelayTimer);
      cueDelayTimer = window.setTimeout(() => {
        if (disposed) return;
        cueArmed = true;
        revealCue();
      }, CUE_AFTER_SCROLL_MS);
    };

    const scrollPeek = () => {
      const from = window.scrollY;
      const delta = window.innerHeight * SCROLL_FRAC;
      const start = performance.now();
      peekingRef.current = true;

      // Flythrough sets html { scroll-behavior: smooth }; that makes each
      // per-frame scrollTo ease toward its target and hitch mid-peek.
      const html = document.documentElement;
      peekPrevBehavior = html.style.scrollBehavior;
      html.style.scrollBehavior = "auto";

      const restoreBehavior = () => {
        if (peekPrevBehavior === null) return;
        html.style.scrollBehavior = peekPrevBehavior;
        peekPrevBehavior = null;
      };

      const finishPeek = () => {
        restoreBehavior();
        peekingRef.current = false;
        showCueAfterScroll();
      };

      const tick = (now: number) => {
        if (disposed) {
          restoreBehavior();
          return;
        }
        const t = Math.min(1, (now - start) / SCROLL_MS);
        window.scrollTo({
          top: from + delta * easeInOutCubic(t),
          left: 0,
          behavior: "auto",
        });
        if (t < 1) {
          scrollRaf = requestAnimationFrame(tick);
        } else {
          finishPeek();
        }
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

    const onUserScrollIntent = () => {
      if (peekingRef.current) return;
      if (cueVisibleRef.current) {
        dismissCue();
        return;
      }
      if (cueArmed) scheduleIdleCue();
    };

    const onScroll = () => {
      if (peekingRef.current) return;
      if (cueVisibleRef.current) {
        if (window.scrollY <= window.innerHeight * SCROLL_FRAC + 8) return;
        dismissCue();
        return;
      }
      if (cueArmed) scheduleIdleCue();
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
    window.addEventListener("wheel", onUserScrollIntent, { passive: true });
    window.addEventListener("touchmove", onUserScrollIntent, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });

    if (video.readyState >= 1) onLoadedMetadata();
    reportBuffered();
    if (!ready) video.load();

    return () => {
      disposed = true;
      peekingRef.current = false;
      cancelAnimationFrame(scrollRaf);
      if (peekPrevBehavior !== null) {
        document.documentElement.style.scrollBehavior = peekPrevBehavior;
        peekPrevBehavior = null;
      }
      if (fadeTimer) window.clearTimeout(fadeTimer);
      if (cueDelayTimer) window.clearTimeout(cueDelayTimer);
      clearIdleTimer();
      window.removeEventListener("him-start", playOnce);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("wheel", onUserScrollIntent);
      window.removeEventListener("touchmove", onUserScrollIntent);
      window.removeEventListener("scroll", onScroll);
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
    <section
      ref={sectionRef}
      className="relative w-full h-svh overflow-hidden bg-black"
    >
      <video
        ref={videoRef}
        className="him-hero-video absolute top-0 h-full w-auto max-w-none"
        style={{
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

        <Link href="/collection" className="him-hero-btn">
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
        </Link>
      </div>

      {cueVisible ? (
        <div
          className={`him-scroll-cue${cueIn && !cueFading ? " is-in" : ""}`}
          role="presentation"
          aria-hidden="true"
        >
          <div className="him-scroll-cue-mouse" />
          <div className="him-scroll-cue-chevrons">
            <span className="him-scroll-cue-chevron" />
            {/* <span className="him-scroll-cue-chevron" /> */}
            {/* <span className="him-scroll-cue-chevron" /> */}
          </div>
          {/* <span className="him-scroll-cue-label">Scroll Down</span> */}
        </div>
      ) : null}

      <Navbar />

      <style jsx global>{`
        /* Center the lift in frame; mobile nudges right for optical center. */
        .him-hero-video {
          left: 50%;
          transform: translate3d(-50%, 0, 0);
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

        .him-scroll-cue {
          position: fixed;
          left: 50%;
          bottom: clamp(20px, 4vh, 36px);
          z-index: 60;
          display: flex;
          flex-direction: column;
          align-items: center;
          transform: translateX(-50%) translateY(10px);
          pointer-events: none;
          opacity: 0;
          transition:
            opacity ${CUE_FADE_OUT_MS}ms ease,
            transform ${CUE_FADE_OUT_MS}ms ease;
        }

        .him-scroll-cue.is-in {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
          transition:
            opacity ${CUE_FADE_IN_MS}ms cubic-bezier(0.22, 1, 0.36, 1),
            transform ${CUE_FADE_IN_MS}ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .him-scroll-cue-mouse {
          width: 36px;
          height: 56px;
          border: 2px solid rgba(255, 255, 255, 0.85);
          border-radius: 20px;
          position: relative;
          display: flex;
          justify-content: center;
          padding-top: 8px;
          isolation: isolate;
          box-shadow:
            0 0 0 1px rgba(255, 255, 255, 0.12),
            0 0 18px rgba(255, 255, 255, 0.12);
          animation: him-scroll-cue-float 3s ease-in-out infinite;
        }

        .him-scroll-cue-mouse::after {
          content: "";
          position: absolute;
          left: 50%;
          top: 50%;
          width: 140px;
          height: 160px;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background: radial-gradient(
            ellipse at center,
            rgba(0, 0, 0, 0.88) 0%,
            rgba(0, 0, 0, 0.62) 36%,
            rgba(0, 0, 0, 0.28) 58%,
            transparent 78%
          );
          filter: blur(16px);
          z-index: -1;
          pointer-events: none;
        }

        .him-scroll-cue-mouse::before {
          content: "";
          width: 4px;
          height: 8px;
          background-color: rgba(255, 255, 255, 0.9);
          border-radius: 4px;
          animation: him-scroll-cue-wheel 1.5s cubic-bezier(0.15, 0.41, 0.69, 0.94)
            infinite;
        }

        .him-scroll-cue-chevrons {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin: 0 0 10px;
        }

        .him-scroll-cue-chevron {
          display: block;
          width: 14px;
          height: 14px;
          border-right: 2px solid rgba(255, 255, 255, 0.6);
          border-bottom: 2px solid rgba(255, 255, 255, 0.6);
          transform: rotate(45deg);
          margin: -6px auto 0;
          animation: him-scroll-cue-pulse 1.5s infinite;
        }

        .him-scroll-cue-chevron:nth-child(1) {
          animation-delay: 0s;
          margin-top: 2px;
        }

        .him-scroll-cue-chevron:nth-child(2) {
          animation-delay: 0.15s;
        }

        .him-scroll-cue-chevron:nth-child(3) {
          animation-delay: 0.3s;
        }

        .him-scroll-cue-label {
          color: rgba(255, 255, 255, 0.55);
          font-family: Arial, Helvetica, sans-serif;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
        }

        @keyframes him-scroll-cue-wheel {
          0% {
            transform: translateY(0);
            opacity: 1;
            height: 8px;
          }
          20% {
            height: 12px;
          }
          100% {
            transform: translateY(20px);
            opacity: 0;
            height: 4px;
          }
        }

        @keyframes him-scroll-cue-float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(5px);
          }
        }

        @keyframes him-scroll-cue-pulse {
          0% {
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }

        @media (max-width: 768px) {
          /* Nudge right so the elevator sits optically centered on phones. */
          .him-hero-video {
            transform: translate3d(calc(-50% + 1.6vw), 0, 0);
          }

          /* Only the CTA remains on mobile — center it in the viewport. */
          .him-hero-copy {
            left: 50%;
            bottom: 36px;
            width: max-content;
            max-width: calc(100% - 40px);
            transform: translateX(-50%);
            text-align: center;
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
            margin-left: auto;
            margin-right: auto;
          }

          .him-scroll-cue {
            bottom: 18px;
            transform: translateX(-50%) translateY(10px) scale(0.85);
            transform-origin: center bottom;
          }

          .him-scroll-cue.is-in {
            transform: translateX(-50%) translateY(0) scale(0.85);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .him-scroll-cue-mouse,
          .him-scroll-cue-mouse::before,
          .him-scroll-cue-chevron {
            animation: none !important;
          }
        }
      `}</style>
    </section>
  );
}
