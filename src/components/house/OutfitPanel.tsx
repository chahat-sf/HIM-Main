"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useEffect, useRef, useState } from "react";
import styles from "./OutfitPanel.module.css";

gsap.registerPlugin(useGSAP);

const DEFAULT_OUTFITS = ["Outfit 1", "Outfit 2", "Outfit 3"];

const STATS = [
  { label: "Style", value: 0.75 },
  { label: "Comfort", value: 0.5 },
  { label: "Confidence", value: 0.85 },
] as const;

export const OUTFIT_COUNT = 3;

const NARROW = "(max-width: 768px)";

export default function OutfitPanel({
  selected,
  onSelect,
  outfits = DEFAULT_OUTFITS,
  showOutfits = true,
}: {
  selected: number;
  onSelect: (index: number) => void;
  outfits?: string[];
  /** Outfit list only when multiple windows; single-window shows stats alone. */
  showOutfits?: boolean;
}) {
  const items = outfits.slice(0, OUTFIT_COUNT);
  /** Layout flag — only true after the exit tween finishes. */
  const [minimized, setMinimized] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelsRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const fillsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const openRef = useRef(true);
  const tweenRef = useRef<gsap.core.Timeline | null>(null);

  const { contextSafe } = useGSAP({ scope: rootRef });

  const reduceMotion = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const killTween = () => {
    tweenRef.current?.kill();
    tweenRef.current = null;
  };

  const showExpanded = (animate: boolean) => {
    const panels = panelsRef.current;
    const launcher = launcherRef.current;
    if (!panels || !launcher) return;

    const panelCards = panels.querySelectorAll<HTMLElement>("[data-panel]");
    const fills = fillsRef.current.filter(Boolean) as HTMLSpanElement[];
    const reduce = reduceMotion();
    const duration = reduce || !animate ? 0.01 : 0.4;

    killTween();
    openRef.current = true;
    setMinimized(false);

    gsap.set(launcher, { autoAlpha: 0, y: 0, scale: 1, pointerEvents: "none" });
    gsap.set(panels, { display: "flex", autoAlpha: 1, pointerEvents: "auto" });
    gsap.set(panelCards, { autoAlpha: 1, y: 0, scale: 1, clearProps: animate ? "" : "all" });

    if (!animate) {
      gsap.set(fills, { scaleX: 1, transformOrigin: "left center" });
      return;
    }

    const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
    tweenRef.current = tl;
    tl.fromTo(
      panelCards,
      { autoAlpha: 0, y: 14, scale: 0.96 },
      { autoAlpha: 1, y: 0, scale: 1, duration, stagger: reduce ? 0 : 0.07 },
      0,
    );
    if (fills.length) {
      tl.fromTo(
        fills,
        { scaleX: 0, transformOrigin: "left center" },
        { scaleX: 1, duration: reduce ? 0.01 : 0.5, stagger: 0.05, ease: "power3.out" },
        0.1,
      );
    }
  };

  const showMinimized = (animate: boolean) => {
    const panels = panelsRef.current;
    const launcher = launcherRef.current;
    if (!panels || !launcher) return;

    const panelCards = gsap.utils.toArray<HTMLElement>(
      panels.querySelectorAll("[data-panel]"),
    );
    const reduce = reduceMotion();
    const duration = reduce || !animate ? 0.01 : 0.32;

    killTween();
    openRef.current = false;

    if (!animate) {
      gsap.set(panelCards, { autoAlpha: 0, y: 0, scale: 1 });
      gsap.set(panels, { display: "none", autoAlpha: 0, pointerEvents: "none" });
      gsap.set(launcher, { autoAlpha: 1, y: 0, scale: 1, pointerEvents: "auto" });
      setMinimized(true);
      return;
    }

    // Keep full width until the panels finish leaving.
    setMinimized(false);
    gsap.set(panels, { display: "flex", pointerEvents: "none" });
    gsap.set(launcher, { pointerEvents: "none" });

    const tl = gsap.timeline({
      defaults: { ease: "power2.in" },
      onComplete: () => {
        gsap.set(panels, { display: "none", autoAlpha: 0 });
        setMinimized(true);
        tweenRef.current = null;
      },
    });
    tweenRef.current = tl;

    tl.to(
      panelCards,
      {
        autoAlpha: 0,
        y: 12,
        scale: 0.96,
        duration,
        stagger: reduce ? 0 : 0.05,
        ease: "power2.in",
      },
      0,
    );
    tl.to(panels, { autoAlpha: 0, duration: duration * 0.75, ease: "power2.in" }, 0.04);
    tl.fromTo(
      launcher,
      { autoAlpha: 0, y: 10, scale: 0.92 },
      {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: reduce ? 0.01 : 0.34,
        ease: "power2.out",
        pointerEvents: "auto",
      },
      reduce ? 0 : 0.14,
    );
  };

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const narrow = window.matchMedia(NARROW).matches;
      openRef.current = !narrow;

      gsap.set(root, { autoAlpha: 0, x: -16 });
      if (narrow) showMinimized(false);
      else showExpanded(false);

      gsap.to(root, {
        autoAlpha: 1,
        x: 0,
        duration: reduceMotion() ? 0.01 : 0.7,
        ease: "power3.out",
        delay: 0.08,
      });

      return () => killTween();
    },
    { scope: rootRef },
  );

  useEffect(() => {
    const media = window.matchMedia(NARROW);
    const onChange = () => {
      if (media.matches && openRef.current) showMinimized(true);
      else if (!media.matches && !openRef.current) showExpanded(true);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
    // Intentional once: handlers read latest openRef / DOM refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const collapse = contextSafe(() => {
    if (!openRef.current) return;
    showMinimized(true);
  });

  const expand = contextSafe(() => {
    if (openRef.current) return;
    showExpanded(true);
  });

  const label = items[selected] ?? items[0] ?? "Outfit";
  const launcherTitle = showOutfits ? "Outfit" : "Stats";
  const launcherValue = showOutfits ? label : "Details";

  return (
    <div
      ref={rootRef}
      className={`${styles.stack}${minimized ? ` ${styles.minimized}` : ""}`}
      data-cast
      data-minimized={minimized ? "true" : "false"}
    >
      <div ref={panelsRef} className={styles.panels}>
        {showOutfits && (
          <section className={styles.panel} data-panel aria-label="Outfit">
            <div className={styles.titleRow}>
              <h2 className={styles.title}>Outfit</h2>
              <button
                type="button"
                className={styles.minimize}
                aria-expanded={!minimized}
                aria-label="Hide outfit panel"
                onClick={collapse}
                onPointerDown={(event) => event.stopPropagation()}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
                  <path
                    d="M18 15l-6-6-6 6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
            <ul className={styles.list} role="listbox" aria-label="Choose outfit">
              {items.map((name, i) => (
                <li key={name}>
                  <button
                    type="button"
                    className={styles.option}
                    role="option"
                    aria-selected={selected === i}
                    aria-pressed={selected === i}
                    onClick={() => onSelect(i)}
                    onPointerDown={(event) => event.stopPropagation()}
                  >
                    {name}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className={styles.panel} data-panel aria-label="Stats">
          {!showOutfits && (
            <div className={styles.titleRow}>
              <h2 className={styles.title}>Stats</h2>
              <button
                type="button"
                className={styles.minimize}
                aria-expanded={!minimized}
                aria-label="Hide stats panel"
                onClick={collapse}
                onPointerDown={(event) => event.stopPropagation()}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
                  <path
                    d="M18 15l-6-6-6 6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          )}
          <div className={styles.stats}>
            {STATS.map((stat, index) => (
              <div key={stat.label} className={styles.statRow}>
                <span className={styles.statLabel}>{stat.label}</span>
                <div
                  className={styles.track}
                  role="meter"
                  aria-label={stat.label}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(stat.value * 100)}
                >
                  <span
                    ref={(node) => {
                      fillsRef.current[index] = node;
                    }}
                    className={styles.fill}
                    style={{ width: `${Math.round(stat.value * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <button
        ref={launcherRef}
        type="button"
        className={styles.launcher}
        aria-expanded={!minimized}
        aria-label={`Show ${launcherTitle.toLowerCase()} panel`}
        onClick={expand}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <span className={styles.launcherTitle}>{launcherTitle}</span>
        <span className={styles.launcherValue}>{launcherValue}</span>
        <svg className={styles.chevron} width="14" height="14" viewBox="0 0 24 24" aria-hidden>
          <path
            d="M6 9l6 6 6-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
