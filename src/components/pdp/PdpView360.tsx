"use client";

import { X } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { Pdp360Assets } from "@/lib/pdp-360";

const FETCH_CONCURRENCY = 8;
const CACHE_LIMIT = 16;
const PREFETCH_AHEAD = 10;
const PREFETCH_BEHIND = 4;
const NEAREST_RANGE = 8;

class PdpFrameRing {
  readonly count: number;
  private readonly frameUrl: (index: number) => string;
  private blobs: (Blob | null)[];
  private bitmaps = new Map<number, ImageBitmap>();
  private decoding = new Map<number, Promise<void>>();
  private fetchDone = 0;
  private token = 0;
  private loading = false;
  private center = 0;
  onFirstFrame: (() => void) | null = null;

  constructor(assets: Pdp360Assets) {
    this.count = assets.count;
    this.frameUrl = assets.frameUrl;
    this.blobs = Array(assets.count).fill(null);
  }

  get ready() {
    return this.fetchDone === this.count;
  }

  load() {
    if (this.loading || this.fetchDone === this.count) {
      if (this.fetchDone === this.count) this.warm(this.center);
      return;
    }
    this.loading = true;
    const token = ++this.token;
    let next = 0;

    const worker = async () => {
      while (token === this.token) {
        const i = next++;
        if (i >= this.count) return;
        if (this.blobs[i]) {
          this.fetchDone++;
          continue;
        }
        try {
          const res = await fetch(this.frameUrl(i));
          if (!res.ok) throw new Error(String(res.status));
          const blob = await res.blob();
          if (token !== this.token) return;
          this.blobs[i] = blob;
          if (i === this.center || (this.center === 0 && i === 0)) {
            void this.decode(i);
          }
        } catch {
          /* skip missing frame */
        }
        this.fetchDone++;
      }
    };

    void Promise.all(Array.from({ length: FETCH_CONCURRENCY }, worker)).then(
      () => {
        if (token !== this.token) return;
        this.loading = false;
        this.warm(this.center);
      },
    );
  }

  warm(index: number) {
    this.prefetch(index, 1);
  }

  beginDrag(index: number) {
    this.prefetch(index, 1);
    this.prefetch(index, -1);
  }

  prefetch(index: number, direction: number) {
    this.center = this.wrap(index);
    const forward = direction >= 0 ? 1 : -1;
    void this.decode(this.center);
    for (let k = 1; k <= PREFETCH_AHEAD; k++) {
      if (this.decoding.size >= 8) return;
      void this.decode(this.wrap(this.center + forward * k));
      if (k <= PREFETCH_BEHIND) {
        void this.decode(this.wrap(this.center - forward * k));
      }
    }
  }

  frame(index: number) {
    const i = this.wrap(index);
    const hit = this.bitmaps.get(i);
    if (hit) return hit;
    for (let k = 1; k <= NEAREST_RANGE; k++) {
      const a = this.bitmaps.get(this.wrap(i - k));
      if (a) return a;
      const b = this.bitmaps.get(this.wrap(i + k));
      if (b) return b;
    }
    return null;
  }

  release() {
    this.token++;
    this.loading = false;
    this.decoding.clear();
    for (const bitmap of this.bitmaps.values()) bitmap.close();
    this.bitmaps.clear();
    this.blobs.fill(null);
    this.fetchDone = 0;
  }

  private wrap(i: number) {
    return ((i % this.count) + this.count) % this.count;
  }

  private decode(i: number): Promise<void> {
    if (this.bitmaps.has(i)) return Promise.resolve();
    const pending = this.decoding.get(i);
    if (pending) return pending;
    const blob = this.blobs[i];
    if (!blob) return Promise.resolve();
    const token = this.token;
    const job = createImageBitmap(blob)
      .then((bitmap) => {
        this.decoding.delete(i);
        if (token !== this.token) {
          bitmap.close();
          return;
        }
        this.bitmaps.set(i, bitmap);
        this.evict();
        if (i === 0) this.onFirstFrame?.();
      })
      .catch(() => {
        this.decoding.delete(i);
      });
    this.decoding.set(i, job);
    return job;
  }

  private evict() {
    while (this.bitmaps.size > CACHE_LIMIT) {
      let farthest = -1;
      let farthestDistance = -1;
      for (const key of this.bitmaps.keys()) {
        if (key === this.center) continue;
        const d = Math.abs(key - this.center);
        const distance = Math.min(d, this.count - d);
        if (distance > farthestDistance) {
          farthestDistance = distance;
          farthest = key;
        }
      }
      if (farthest < 0) break;
      this.bitmaps.get(farthest)?.close();
      this.bitmaps.delete(farthest);
    }
  }
}

type Props = {
  open: boolean;
  assets: Pdp360Assets;
  productName: string;
  onClose: () => void;
};

export default function PdpView360({
  open,
  assets,
  productName,
  onClose,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<PdpFrameRing | null>(null);
  const posRef = useRef(0);
  const dragRef = useRef<{ id: number; x: number; p0: number } | null>(null);
  const rafRef = useRef(0);
  const [ready, setReady] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [hint, setHint] = useState(true);

  const paint = () => {
    const canvas = canvasRef.current;
    const ring = ringRef.current;
    if (!canvas || !ring) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w <= 0 || h <= 0) return;

    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const bitmap = ring.frame(Math.round(posRef.current));
    if (!bitmap) return;

    // Cover the viewport — fill screen, crop edges as needed.
    const scale = Math.max(w / bitmap.width, h / bitmap.height);
    const dw = bitmap.width * scale;
    const dh = bitmap.height * scale;
    const dx = (w - dw) / 2;
    const dy = (h - dh) / 2;
    ctx.drawImage(bitmap, dx, dy, dw, dh);
  };

  const schedulePaint = () => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      paint();
    });
  };

  useEffect(() => {
    if (!open) return;

    const ring = new PdpFrameRing(assets);
    ringRef.current = ring;
    posRef.current = 0;
    setReady(false);
    setHint(true);
    setDragging(false);

    ring.onFirstFrame = () => {
      setReady(true);
      schedulePaint();
    };
    ring.load();
    // Nudge decode of frame 0 even before full fetch finishes.
    const poll = window.setInterval(() => {
      if (ring.frame(0)) {
        setReady(true);
        schedulePaint();
        window.clearInterval(poll);
      }
    }, 50);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    const onResize = () => schedulePaint();
    window.addEventListener("resize", onResize);

    return () => {
      window.clearInterval(poll);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      document.body.style.overflow = prevOverflow;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      ring.release();
      ringRef.current = null;
      dragRef.current = null;
    };
    // assets.folder identity is enough; avoid re-init on stable open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, assets.folder, onClose]);

  useEffect(() => {
    if (open && ready) schedulePaint();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, ready]);

  if (!open) return null;

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!ready || !ringRef.current) return;
    if ((e.target as Element).closest("button")) return;
    ringRef.current.beginDrag(posRef.current);
    dragRef.current = {
      id: e.pointerId,
      x: e.clientX,
      p0: posRef.current,
    };
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const ring = ringRef.current;
    if (!drag || !ring || drag.id !== e.pointerId) return;

    if (hint && Math.abs(e.clientX - drag.x) >= 8) setHint(false);

    const span = Math.min(900, Math.max(320, window.innerWidth * 0.8));
    const target = drag.p0 + ((drag.x - e.clientX) * ring.count) / span;
    posRef.current = ((target % ring.count) + ring.count) % ring.count;
    ring.prefetch(Math.round(posRef.current), e.clientX < drag.x ? 1 : -1);
    schedulePaint();
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== e.pointerId) return;
    dragRef.current = null;
    setDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  };

  return (
    <div
      className={`pdp-360${dragging ? " is-dragging" : ""}${ready ? " is-ready" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label={`View ${productName} in 360 degrees`}
      onClick={onClose}
    >
      <button
        type="button"
        className="pdp-360-close"
        aria-label="Close 360 view"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        <X size={22} strokeWidth={1.25} absoluteStrokeWidth={false} aria-hidden />
      </button>

      <div
        ref={stageRef}
        className="pdp-360-stage"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <canvas ref={canvasRef} className="pdp-360-canvas" aria-hidden />
        {!ready ? (
          <p className="pdp-360-loading" aria-live="polite">
            Loading 360°…
          </p>
        ) : null}
        {ready && hint ? (
          <p className="pdp-360-hint" aria-hidden>
            Drag to rotate
          </p>
        ) : null}
      </div>

      <style jsx>{`
        .pdp-360 {
          position: fixed;
          inset: 0;
          z-index: 1200;
          width: 100vw;
          height: 100vh;
          height: 100dvh;
          display: block;
          background: #0a0a0a;
          touch-action: none;
          user-select: none;
          -webkit-user-select: none;
        }

        .pdp-360-close {
          position: absolute;
          top: max(16px, env(safe-area-inset-top));
          right: max(16px, env(safe-area-inset-right));
          z-index: 2;
          width: 44px;
          height: 44px;
          display: grid;
          place-items: center;
          border: none;
          border-radius: 0;
          background: transparent;
          color: #fff;
          cursor: pointer;
          pointer-events: auto;
        }

        .pdp-360-stage {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          display: block;
          cursor: grab;
        }

        .pdp-360.is-dragging .pdp-360-stage {
          cursor: grabbing;
        }

        .pdp-360:not(.is-ready) .pdp-360-stage {
          cursor: default;
          pointer-events: none;
        }

        .pdp-360-canvas {
          width: 100%;
          height: 100%;
          display: block;
          pointer-events: none;
        }

        .pdp-360-loading,
        .pdp-360-hint {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          margin: 0;
          font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.72);
          pointer-events: none;
        }

        .pdp-360-loading {
          top: 50%;
          transform: translate(-50%, -50%);
        }

        .pdp-360-hint {
          bottom: max(28px, env(safe-area-inset-bottom));
        }
      `}</style>
    </div>
  );
}
