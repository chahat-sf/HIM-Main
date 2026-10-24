"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/* ─────────────── Settings you can tweak ─────────────── */
const SRC = "/audio/noir-jazz.mp3";            // your licensed track in /public/audio/
const VOLUME = 0.35;                           // 0 – 1
const STORAGE_KEY = "him-music";               // remembers the visitor pressed "mute"
const TRIGGER_SELECTOR = "[data-music-trigger]"; // the 2nd component — music starts when you scroll to it
const TRIGGER_AT = 0.6;                        // starts when its top reaches 60% down the screen (0 = top, 1 = bottom)
const PAUSE_WHEN_BACK_UP = true;               // scroll back up to the 1st component → music fades out
const QUIET_PATHS = ["/house"];                // pages that have their own sound — music pauses there

function readMuted() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "off";
  } catch {
    return false;
  }
}

function writePref(value: "on" | "off") {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* storage blocked — ignore */
  }
}

export default function BackgroundMusic() {
  const pathname = usePathname();
  const quiet = QUIET_PATHS.some((p) => pathname?.startsWith(p));

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeRef = useRef(0);

  // "scroll" = this page has a trigger component · "gesture" = no trigger, start on first click
  const modeRef = useRef<"pending" | "scroll" | "gesture">("pending");
  const reachedRef = useRef(false);   // the 2nd component has been reached
  const gestureRef = useRef(false);   // visitor has clicked / pressed a key
  const startedRef = useRef(false);   // music has already started in this visit
  const blockedRef = useRef(false);   // browser refused to play (needs a click first)
  const mutedRef = useRef(false);     // visitor pressed mute
  const manualRef = useRef(false);    // visitor pressed play themselves
  const quietRef = useRef(quiet);
  quietRef.current = quiet;

  const [on, setOn] = useState(false);
  const [blocked, setBlocked] = useState(false);

  const fadeTo = (target: number, done?: () => void) => {
    const audio = audioRef.current;
    if (!audio) return;
    window.clearInterval(fadeRef.current);
    fadeRef.current = window.setInterval(() => {
      const diff = target - audio.volume;
      if (Math.abs(diff) <= 0.03) {
        audio.volume = target;
        window.clearInterval(fadeRef.current);
        done?.();
      } else {
        audio.volume = Math.min(1, Math.max(0, audio.volume + Math.sign(diff) * 0.03));
      }
    }, 40);
  };

  const shouldPlay = () => {
    if (quietRef.current || mutedRef.current) return false;
    if (manualRef.current) return true;
    if (modeRef.current === "scroll") {
      return reachedRef.current || (!PAUSE_WHEN_BACK_UP && startedRef.current);
    }
    if (modeRef.current === "gesture") return startedRef.current || gestureRef.current;
    return false;
  };

  const sync = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (shouldPlay()) {
      if (!audio.paused) return;
      try {
        audio.volume = 0;
        await audio.play();
        startedRef.current = true;
        blockedRef.current = false;
        setBlocked(false);
        setOn(true);
        fadeTo(VOLUME);
      } catch {
        // Browsers only allow sound after a click / key press — retry on the next one
        blockedRef.current = true;
        setBlocked(true);
      }
    } else if (!audio.paused) {
      setOn(false);
      fadeTo(0, () => audioRef.current?.pause());
    }
  };

  const toggle = () => {
    if (on) {
      mutedRef.current = true;
      manualRef.current = false;
      writePref("off");
    } else {
      mutedRef.current = false;
      manualRef.current = true;
      writePref("on");
    }
    void sync();
  };

  // Remember if the visitor muted the music earlier
  useEffect(() => {
    mutedRef.current = readMuted();
  }, []);

  // First click / key press / tap: lets a blocked start go through
  useEffect(() => {
    const events = ["pointerdown", "keydown", "touchend"] as const;
    const onGesture = () => {
      gestureRef.current = true;
      if (blockedRef.current || modeRef.current === "gesture") void sync();
    };
    events.forEach((e) => window.addEventListener(e, onGesture, { passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, onGesture));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Find the 2nd component on this page and watch the scroll
  useEffect(() => {
    modeRef.current = "pending";
    reachedRef.current = false;

    let raf = 0;
    let tries = 0;
    let trigger: HTMLElement | null = null;
    let ticking = false;

    const check = () => {
      ticking = false;
      if (!trigger) return;
      const top = trigger.getBoundingClientRect().top;
      const reached = top <= window.innerHeight * TRIGGER_AT;
      if (reached !== reachedRef.current) {
        reachedRef.current = reached;
        void sync();
      }
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      raf = requestAnimationFrame(check);
    };

    const find = () => {
      trigger = document.querySelector<HTMLElement>(TRIGGER_SELECTOR);
      if (trigger) {
        modeRef.current = "scroll";
        const audio = audioRef.current;
        if (audio && audio.preload !== "auto") {
          audio.preload = "auto"; // start downloading so it can play instantly
          if (audio.readyState === 0 && audio.paused) audio.load();
        }
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        check();
      } else if (tries++ < 10) {
        raf = requestAnimationFrame(find); // the page may still be rendering
      } else {
        modeRef.current = "gesture";
        void sync();
      }
    };

    raf = requestAnimationFrame(find);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Pause on pages with their own sound, resume after
  useEffect(() => {
    void sync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiet]);

  // Pause when the tab is hidden
  useEffect(() => {
    const onVisibility = () => {
      const audio = audioRef.current;
      if (!audio) return;
      if (document.hidden) audio.pause();
      else void sync();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => window.clearInterval(fadeRef.current), []);

  return (
    <>
      <audio ref={audioRef} src={SRC} loop preload="none" />

      {!quiet && (
        <button
          type="button"
          className={`him-music${on ? " on" : ""}${blocked && !on ? " hint" : ""}`}
          onClick={toggle}
          aria-label={on ? "Mute music" : "Play music"}
          aria-pressed={on}
        >
          <span />
          <span />
          <span />
          <span />
        </button>
      )}

      <style jsx global>{`
        .him-music {
          position: fixed;
          left: 20px;
          bottom: 20px;
          z-index: 900;
          width: 38px;
          height: 38px;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          gap: 3px;
          padding: 11px 0;
          border: 1px solid rgba(255, 255, 255, 0.4);
          border-radius: 50%;
          background: rgba(10, 6, 5, 0.55);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          cursor: pointer;
          transition: border-color 200ms, background 200ms;
        }

        .him-music:hover {
          border-color: #fff;
          background: rgba(10, 6, 5, 0.8);
        }

        .him-music span {
          width: 2px;
          height: 3px;
          background: #fff;
          border-radius: 1px;
          transition: height 200ms;
        }

        .him-music.on span {
          animation: him-bars 900ms ease-in-out infinite alternate;
        }

        .him-music.on span:nth-child(2) { animation-delay: -300ms; }
        .him-music.on span:nth-child(3) { animation-delay: -600ms; }
        .him-music.on span:nth-child(4) { animation-delay: -150ms; }

        /* soft pulse when the browser is waiting for a click before it can play */
        .him-music.hint {
          animation: him-pulse 1.6s ease-out infinite;
        }

        @keyframes him-bars {
          from { height: 3px; }
          to { height: 14px; }
        }

        @keyframes him-pulse {
          0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.45); }
          100% { box-shadow: 0 0 0 12px rgba(255, 255, 255, 0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .him-music.on span { animation: none; height: 10px; }
          .him-music.hint { animation: none; }
        }
      `}</style>
    </>
  );
}
