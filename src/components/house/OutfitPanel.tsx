"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef, useState } from "react";
import { OUTFIT_COUNT, OUTFIT_NAMES } from "./characters";
import styles from "./OutfitPanel.module.css";

gsap.registerPlugin(useGSAP);

export { OUTFIT_COUNT };

export default function OutfitPanel({
  selected,
  onSelect,
  outfits = OUTFIT_NAMES,
}: {
  selected: number;
  onSelect: (index: number) => void;
  outfits?: string[];
}) {
  const items = outfits.slice(0, OUTFIT_COUNT);
  /** Layout flag — only true after the exit tween finishes. */
  const [minimized, setMinimized] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelsRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const openRef = useRef(false);
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
    const reduce = reduceMotion();
    const duration = reduce || !animate ? 0.01 : 0.4;

    killTween();
    openRef.current = true;
    setMinimized(false);

    gsap.set(launcher, { autoAlpha: 0, y: 0, scale: 1, pointerEvents: "none" });
    gsap.set(panels, { display: "flex", autoAlpha: 1, pointerEvents: "auto" });
    gsap.set(panelCards, { autoAlpha: 1, y: 0, scale: 1, clearProps: animate ? "" : "all" });

    if (!animate) return;

    const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
    tweenRef.current = tl;
    tl.fromTo(
      panelCards,
      { autoAlpha: 0, y: 14, scale: 0.96 },
      { autoAlpha: 1, y: 0, scale: 1, duration, stagger: reduce ? 0 : 0.07 },
      0,
    );
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

    // Keep full width until the panels finish leaving. Launcher is absolute
    // over the panel top, so fading it in does not grow the stack height.
    setMinimized(false);
    gsap.set(panels, { display: "flex", pointerEvents: "none" });
    gsap.set(launcher, { autoAlpha: 0, y: 0, scale: 0.96, pointerEvents: "none" });

    const tl = gsap.timeline({
      defaults: { ease: "power2.in" },
      onComplete: () => {
        gsap.set(panels, { display: "none", autoAlpha: 0 });
        gsap.set(launcher, { autoAlpha: 1, y: 0, scale: 1, pointerEvents: "auto" });
        setMinimized(true);
        tweenRef.current = null;
      },
    });
    tweenRef.current = tl;

    tl.to(
      panelCards,
      {
        autoAlpha: 0,
        y: 8,
        scale: 0.98,
        duration,
        stagger: reduce ? 0 : 0.04,
        ease: "power2.in",
      },
      0,
    );
    tl.to(panels, { autoAlpha: 0, duration: duration * 0.85, ease: "power2.in" }, 0);
    tl.to(
      launcher,
      {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: reduce ? 0.01 : 0.28,
        ease: "power2.out",
        pointerEvents: "auto",
      },
      reduce ? 0 : duration * 0.55,
    );
  };

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      openRef.current = false;
      gsap.set(root, { autoAlpha: 0, x: -16 });
      showMinimized(false);

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

  const collapse = contextSafe(() => {
    if (!openRef.current) return;
    showMinimized(true);
  });

  const expand = contextSafe(() => {
    if (openRef.current) return;
    showExpanded(true);
  });

  const label = items[selected] ?? items[0] ?? "Outfit";

  return (
    <div
      ref={rootRef}
      className={`${styles.stack}${minimized ? ` ${styles.minimized}` : ""}`}
      data-cast
      data-minimized={minimized ? "true" : "false"}
    >
      <div ref={panelsRef} className={styles.panels}>
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
          <ul
            className={styles.list}
            role="listbox"
            aria-label="Choose outfit"
            onWheel={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
          >
            {items.map((name, i) => (
              <li key={name}>
                <button
                  type="button"
                  className={styles.option}
                  role="option"
                  aria-selected={selected === i}
                  aria-pressed={selected === i}
                  onClick={() => {
                    onSelect(i);
                    collapse();
                  }}
                  onPointerDown={(event) => event.stopPropagation()}
                >
                  {name}
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <button
        ref={launcherRef}
        type="button"
        className={styles.launcher}
        aria-expanded={!minimized}
        aria-label="Show outfit panel"
        onClick={expand}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <span className={styles.launcherTitle}>Outfit</span>
        <span className={styles.launcherValue}>{label}</span>
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
