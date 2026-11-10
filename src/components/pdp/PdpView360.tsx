"use client";

import { X } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { Pdp360Assets } from "@/lib/pdp-360";

const FETCH_CONCURRENCY = 10;
const DECODE_CONCURRENCY = 8;
const MAX_LONG_EDGE = 1920;

const GATE_BG =
  "radial-gradient(ellipse 70% 55% at 50% 45%, #1a120c 0%, #0a0604 55%, #050302 100%)";

function displaySize(cssW: number, cssH: number) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  let w = Math.max(1, Math.round(cssW * dpr));
  let h = Math.max(1, Math.round(cssH * dpr));
  const long = Math.max(w, h);
  if (long > MAX_LONG_EDGE) {
    const scale = MAX_LONG_EDGE / long;
    w = Math.max(1, Math.round(w * scale));
    h = Math.max(1, Math.round(h * scale));
  }
  return { w, h };
}

/** Cover-fit resize target for a source frame into the display box. */
function coverResize(
  srcW: number,
  srcH: number,
  boxW: number,
  boxH: number,
) {
  const scale = Math.max(boxW / srcW, boxH / srcH);
  return {
    resizeWidth: Math.max(1, Math.round(srcW * scale)),
    resizeHeight: Math.max(1, Math.round(srcH * scale)),
  };
}

class PdpFrameRing {
  readonly count: number;
  private readonly frameUrl: (index: number) => string;
  private bitmaps: (ImageBitmap | null)[];
  private token = 0;
  private decoded = 0;
  onReady: (() => void) | null = null;

  constructor(assets: Pdp360Assets) {
    this.count = assets.count;
    this.frameUrl = assets.frameUrl;
    this.bitmaps = Array(assets.count).fill(null);
  }

  get ready() {
    return this.decoded === this.count && this.count > 0;
  }

  async load(cssW: number, cssH: number) {
    const token = ++this.token;
    this.decoded = 0;
    for (const b of this.bitmaps) b?.close();
    this.bitmaps = Array(this.count).fill(null);

    const { w: boxW, h: boxH } = displaySize(cssW, cssH);
    const blobs: (Blob | null)[] = Array(this.count).fill(null);

    // 1) Fetch all WebPs
    let nextFetch = 0;
    const fetchWorker = async () => {
      while (token === this.token) {
        const i = nextFetch++;
        if (i >= this.count) return;
        try {
          const res = await fetch(this.frameUrl(i));
          if (!res.ok) throw new Error(String(res.status));
          const blob = await res.blob();
          if (token !== this.token) return;
          blobs[i] = blob;
        } catch {
          /* leave null — decode will skip */
        }
      }
    };
    await Promise.all(
      Array.from({ length: FETCH_CONCURRENCY }, () => fetchWorker()),
    );
    if (token !== this.token) return;

    // Probe first available blob for intrinsic size
    let srcW = boxW;
    let srcH = boxH;
    const probe = blobs.find(Boolean);
    if (probe) {
      try {
        const meta = await createImageBitmap(probe);
        if (token !== this.token) {
          meta.close();
          return;
        }
        srcW = meta.width;
        srcH = meta.height;
        meta.close();
      } catch {
        /* use box size */
      }
    }

    const { resizeWidth, resizeHeight } = coverResize(srcW, srcH, boxW, boxH);

    // 2) Decode all at display size
    let nextDecode = 0;
    const decodeWorker = async () => {
      while (token === this.token) {
        const i = nextDecode++;
        if (i >= this.count) return;
        const blob = blobs[i];
        if (!blob) {
          this.decoded++;
          continue;
        }
        try {
          const bitmap = await createImageBitmap(blob, {
            resizeWidth,
            resizeHeight,
            resizeQuality: "high",
          });
          if (token !== this.token) {
            bitmap.close();
            return;
          }
          this.bitmaps[i] = bitmap;
        } catch {
          /* skip */
        }
        this.decoded++;
      }
    };

    await Promise.all(
      Array.from({ length: DECODE_CONCURRENCY }, () => decodeWorker()),
    );
    if (token !== this.token) return;

    // Count only successful bitmaps as decoded for ready check
    this.decoded = this.bitmaps.filter(Boolean).length;
    if (this.decoded > 0) this.onReady?.();
  }

  frame(index: number) {
    const i = ((index % this.count) + this.count) % this.count;
    return this.bitmaps[i] ?? null;
  }

  release() {
    this.token++;
    this.onReady = null;
    for (const b of this.bitmaps) b?.close();
    this.bitmaps = Array(this.count).fill(null);
    this.decoded = 0;
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

    if (
      canvas.width !== Math.round(w * dpr) ||
      canvas.height !== Math.round(h * dpr)
    ) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const bitmap = ring.frame(Math.round(posRef.current));
    if (!bitmap) return;

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

    ring.onReady = () => {
      setReady(true);
      schedulePaint();
    };

    const startLoad = () => {
      const stage = stageRef.current;
      const cssW = stage?.clientWidth || window.innerWidth;
      const cssH = stage?.clientHeight || window.innerHeight;
      void ring.load(cssW, cssH);
    };

    // Wait one frame so the stage has layout size.
    const raf = requestAnimationFrame(startLoad);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    const onResize = () => schedulePaint();
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      document.body.style.overflow = prevOverflow;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      ring.release();
      ringRef.current = null;
      dragRef.current = null;
    };
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
          <div
            className="pdp-360-loader"
            role="status"
            aria-busy="true"
            aria-live="polite"
            aria-label="Loading 360 view"
          >
            {/* Native <img> so animated GIF frames play (next/image can flatten). */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/him-loader.gif"
              alt=""
              width={160}
              height={284}
              aria-hidden
              draggable={false}
            />
          </div>
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
          z-index: 3;
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

        .pdp-360-loader {
          position: absolute;
          inset: 0;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          background: ${GATE_BG};
          pointer-events: none;
        }

        .pdp-360-loader img {
          width: min(160px, 28vw);
          height: auto;
          object-fit: contain;
        }

        .pdp-360-hint {
          position: absolute;
          left: 50%;
          bottom: max(28px, env(safe-area-inset-bottom));
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
      `}</style>
    </div>
  );
}
