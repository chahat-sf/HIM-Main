"use client";

import { useEffect, useState } from "react";
import styles from "./DragGuide.module.css";

const LEAVE_MS = 280;

export default function DragGuide({
  visible,
  onDismiss,
}: {
  visible: boolean;
  onDismiss: () => void;
}) {
  const [mounted, setMounted] = useState(visible);
  const [leaving, setLeaving] = useState(false);
  const [touchy, setTouchy] = useState(false);

  useEffect(() => {
    setTouchy(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      setLeaving(false);
      return;
    }
    if (!mounted) return;
    setLeaving(true);
    const id = window.setTimeout(() => {
      setMounted(false);
      setLeaving(false);
    }, LEAVE_MS);
    return () => window.clearTimeout(id);
  }, [visible, mounted]);

  if (!mounted) return null;

  const verb = touchy ? "Swipe" : "Drag";

  return (
    <div
      className={`${styles.layer}${leaving ? ` ${styles.leaving}` : ""}`}
      role="status"
      aria-live="polite"
    >
      <div className={styles.vignette} aria-hidden />
      <div className={styles.card}>
        <p className={styles.kicker}>Try it</p>
        <div className={styles.stage} aria-hidden>
          <div className={styles.track} />
          <div className={styles.arrows}>
            <span>
              <svg viewBox="0 0 24 24">
                <path d="M9 6l-6 6 6 6" />
              </svg>
            </span>
            <span>
              <svg viewBox="0 0 24 24">
                <path d="M15 6l6 6-6 6" />
              </svg>
            </span>
          </div>
          <span className={styles.ripple} />
          <div className={styles.hand}>
            <svg viewBox="0 0 32 32" fill="currentColor">
              <path d="M13.2 3.2c-.9 0-1.6.7-1.6 1.6v10.1l-1.7-1.3a2.1 2.1 0 0 0-2.9.3 2.1 2.1 0 0 0 .3 2.9l5.6 4.4c.7.6 1.6.9 2.5.9h5.4a4 4 0 0 0 4-3.6l.5-5.2a2.2 2.2 0 0 0-2.2-2.4h-.2V8.4a1.6 1.6 0 0 0-3.2 0v1.2h-.4V6.4a1.6 1.6 0 0 0-3.2 0v3.2h-.4V4.8c0-.9-.7-1.6-1.6-1.6Z" />
            </svg>
          </div>
        </div>
        <p className={styles.copy}>
          {verb} left or right to spin the look
        </p>
        <button
          type="button"
          className={styles.gotIt}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onDismiss();
          }}
        >
          Got it
        </button>
      </div>
    </div>
  );
}
