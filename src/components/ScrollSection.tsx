"use client";

/**
 * ScrollSection — full port of the reference HTML interactive-room system.
 *
 * ENTRY (scene = "entry")
 *  • wall image fills the screen; window hole shows the room behind it.
 *  • Pointer parallax tilts wall / room in opposite directions.
 *  • Enter button: reference-exact glow, radial bg, text-shadow, two ping
 *    rings, hover scale + brightened glow.
 *  • Prev/next arrows (right-center) cycle the entry slide.
 *
 * ENTERING (scene = "entering")
 *  • Canvas-based camera pushes into the window over 2.2 s using a custom
 *    cubic-bezier; simultaneously the room layer scales up to fill the frame,
 *    brightness eases from dim to full, warm bloom swells then fades,
 *    and the character canvas dissolves in over the last third of the flight.
 *
 * CHARACTER (scene = "character")
 *  • Video turntable: the hidden <video> is scrubbed by currentTime each
 *    RAF tick — works immediately with no ffmpeg required.
 *  • Auto-rotate ramps up from 0 over ~1.8 s; dragging is 1:1 and instant;
 *    releasing mid-drag flicks and decays back to resting speed.
 *  • GTA-style SVG character wheel (left side) with 4 placeholder slots;
 *    character switch triggers the punch/veil animation from the reference.
 *  • Back arrow (top-left) returns to entry.
 *  • Drag-hint fades in at the bottom.
 */

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type Scene = "entry" | "entering" | "character";

interface CharacterDef {
  id: string;
  name: string;
  /** Rotation start expressed as 0–1 fraction of video duration */
  start: number;
  /** Avatar thumbnail path */
  thumb: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────────────────

const SLIDES = [
  { src: "/homepage/window-1.webp",  alt: "HIM private tailoring room" },
  { src: "/homepage/windoww-2.webp", alt: "HIM wardrobe and clothing room" },
] as const;

/** One video, four viewing-angle placeholders. Swap thumbs when real clips arrive. */
const CHARACTERS: CharacterDef[] = [
  { id: "c1", name: "Character 01", start: 0,     thumb: "/homepage/window-1.webp" },
  { id: "c2", name: "Character 02", start: 0.122, thumb: "/homepage/windoww-2.webp" },
  { id: "c3", name: "Character 03", start: 0.25,  thumb: "/homepage/window-1.webp" },
  { id: "c4", name: "Character 04", start: 0.877, thumb: "/homepage/windoww-2.webp" },
];

const VIDEO_SRC = "/videos/video-1.mp4";

// Camera / animation timing (mirrors the reference HTML)
const ENTER_MS   = 2200;   // full enter transition length
const CAM_DONE   = 0.9;    // camera arrives at 90% progress; rest is settle
const UI_DELAY   = 500;    // ms after enter before wheel appears
const SPIN_RAMP  = 1800;   // ms to ramp turntable from 0 to full speed
const AUTO_FPS   = 12;     // resting turntable speed in frames/sec
const DRAG_TURN  = 0.8;    // viewport-widths needed to complete one full rotation
const SPIN_DECAY = 2.2;    // how quickly a flick velocity decays

// Reference bezier for the camera push (same as the HTML)
const CAM_BZ = [0.6, 0.0, 0.2, 1.0] as const;

// ─────────────────────────────────────────────────────────────────────────────
// MATH HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const clamp  = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const lerp   = (a: number, b: number, t: number)   => a + (b - a) * t;
const smooth = (t: number) => t * t * (3 - 2 * t);
const mod    = (n: number, m: number) => ((n % m) + m) % m;

/** Cubic-bezier approximation via Newton iteration (same approach as the HTML). */
function makeBezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3*x1, bx = 3*(x2-x1)-cx, ax = 1-cx-bx;
  const cy = 3*y1, by = 3*(y2-y1)-cy, ay = 1-cy-by;
  const X  = (t: number) => ((ax*t+bx)*t+cx)*t;
  const Y  = (t: number) => ((ay*t+by)*t+cy)*t;
  const dX = (t: number) => (3*ax*t+2*bx)*t+cx;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 9; i++) {
      const e = X(t) - x;
      if (Math.abs(e) < 1e-6) break;
      const d = dX(t);
      if (Math.abs(d) < 1e-6) break;
      t -= e / d;
    }
    return Y(t);
  };
}
const camEase = makeBezier(...CAM_BZ);

// ─────────────────────────────────────────────────────────────────────────────
// DRAW HELPER — cover-fit a source onto a canvas context
// ─────────────────────────────────────────────────────────────────────────────

function drawCover(
  ctx: CanvasRenderingContext2D,
  src: CanvasImageSource,
  srcW: number, srcH: number,
  dstW: number, dstH: number,
) {
  if (!srcW || !srcH) return;
  const scale = Math.max(dstW / srcW, dstH / srcH);
  const w = srcW * scale, h = srcH * scale;
  ctx.drawImage(src, (dstW - w) / 2, (dstH - h) / 2, w, h);
}

// ─────────────────────────────────────────────────────────────────────────────
// CHARACTER WHEEL (SVG)
// ─────────────────────────────────────────────────────────────────────────────

interface WheelProps {
  characters: CharacterDef[];
  activeIdx: number;
  onSelect: (i: number) => void;
  visible: boolean;
}

function CharacterWheel({ characters, activeIdx, onSelect, visible }: WheelProps) {
  const N  = characters.length;
  const CX = 150, CY = 150, R = 138;
  const step = (2 * Math.PI) / N;

  const P = (r: number, a: number): [number, number] =>
    [CX + r * Math.cos(a), CY + r * Math.sin(a)];
  const f = (v: number) => v.toFixed(2);

  const wedges = useMemo(() => characters.map((ch, i) => {
    const mid = -Math.PI / 2 + i * step;
    const a1 = mid - step / 2, a2 = mid + step / 2;
    const [x1, y1] = P(R, a1), [x2, y2] = P(R, a2);
    const wedgePath = `M${CX} ${CY}L${f(x1)} ${f(y1)}A${R} ${R} 0 0 1 ${f(x2)} ${f(y2)}Z`;
    const rr = R + 6.5, dl = 0.045;
    const [rx1, ry1] = P(rr, a1 + dl), [rx2, ry2] = P(rr, a2 - dl);
    const rimPath = `M${f(rx1)} ${f(ry1)}A${rr} ${rr} 0 0 1 ${f(rx2)} ${f(ry2)}`;
    const [px, py] = P(R * 0.62, mid);
    const s = R * 1.5;
    const iy = py + s * 0.1;
    const [bx, by] = P(R * 0.3, mid);
    return { ch, i, mid, wedgePath, rimPath, px, py: iy, s, bx, by };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [characters]);

  return (
    <div
      style={{
        position: "absolute",
        left: "clamp(20px, 4vw, 60px)",
        top: "50%",
        transform: `translateY(-50%)`,
        zIndex: 20,
        width: "clamp(200px, 21vw, 300px)",
        opacity: visible ? 1 : 0,
        transition: "opacity 1.1s cubic-bezier(0.22,0.7,0.18,1) 80ms",
        pointerEvents: visible ? "auto" : "none",
        filter: "drop-shadow(0 14px 34px rgba(0,0,0,0.65))",
      }}
    >
      <svg
        viewBox="0 0 300 300"
        style={{ width: "100%", overflow: "visible" }}
        role="group"
        aria-label="Choose a character"
      >
        <defs>
          {wedges.map(({ i, wedgePath }) => (
            <clipPath key={i} id={`wc-${i}`}>
              <path d={wedgePath} />
            </clipPath>
          ))}
        </defs>

        {/* disc */}
        <circle cx={CX} cy={CY} r={R + 9}
          fill="rgba(10,5,3,0.62)"
          stroke="rgba(214,172,106,0.28)"
          strokeWidth="1.2"
        />

        {wedges.map(({ ch, i, wedgePath, rimPath, px, py: imgY, s, bx, by }) => {
          const active = i === activeIdx;
          return (
            <g
              key={ch.id}
              onClick={() => onSelect(i)}
              style={{ cursor: "pointer", outline: "none" }}
              role="button"
              tabIndex={0}
              aria-label={ch.name}
              aria-pressed={active}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(i); } }}
            >
              {/* portrait crop */}
              <g clipPath={`url(#wc-${i})`}>
                <rect x="0" y="0" width="300" height="300" fill="#1a0d06" />
                <image
                  href={ch.thumb}
                  x={f(px - s / 2)} y={f(imgY - s / 2)}
                  width={f(s)} height={f(s)}
                  preserveAspectRatio="xMidYMid slice"
                />
              </g>

              {/* glow when active */}
              <path d={wedgePath} fill="rgb(255,172,84)"
                opacity={active ? 0.12 : 0}
                style={{ transition: "opacity 0.5s ease" }}
              />
              {/* shade overlay */}
              <path d={wedgePath} fill="rgb(8,4,2)"
                opacity={active ? 0 : 0.5}
                style={{ transition: "opacity 0.35s ease" }}
              />
              {/* divider edge */}
              <path d={wedgePath} fill="none" stroke="rgb(10,5,3)"
                strokeWidth="3.5" strokeLinejoin="round"
              />
              {/* active rim arc */}
              <path d={rimPath} fill="none"
                stroke="#d6ac6a" strokeWidth="5" strokeLinecap="round"
                opacity={active ? 1 : 0}
                style={{
                  transition: "opacity 0.4s ease",
                  filter: "drop-shadow(0 0 6px rgba(255,172,84,0.85))",
                }}
              />
              {/* number badge */}
              <g transform={`translate(${f(bx)} ${f(by)})`}>
                <circle r="11.5"
                  fill={active ? "#d6ac6a" : "rgba(10,5,3,0.86)"}
                  stroke={active ? "#d6ac6a" : "rgba(214,172,106,0.55)"}
                  strokeWidth="1"
                  style={{ transition: "fill 0.3s, stroke 0.3s" }}
                />
                <text
                  textAnchor="middle" dominantBaseline="central"
                  fill={active ? "#1a0d05" : "#f4e7cc"}
                  fontSize="12" fontFamily="'Jost', 'Helvetica Neue', Arial, sans-serif"
                  style={{ transition: "fill 0.3s" }}
                >
                  {i + 1}
                </text>
              </g>
            </g>
          );
        })}

        <circle cx={CX} cy={CY} r="4.5"
          fill="rgb(10,5,3)"
          stroke="rgba(214,172,106,0.6)"
          strokeWidth="1.2"
        />
      </svg>

      {/* active character name */}
      <p
        style={{
          margin: "6px 0 0",
          textAlign: "center",
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontWeight: 600,
          fontSize: "clamp(20px, 1.7vw, 25px)",
          lineHeight: 1.1,
          letterSpacing: "0.015em",
          color: "#fff5e0",
          textShadow: "0 1px 14px rgba(0,0,0,0.9), 0 0 3px rgba(0,0,0,0.7)",
        }}
      >
        {characters[activeIdx].name}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function ScrollSection() {
  // ── Scene state ──────────────────────────────────────────────────────
  const [scene, setScene]       = useState<Scene>("entry");
  const [slideIdx, setSlideIdx] = useState(0);
  const [charIdx, setCharIdx]   = useState(0);
  const [uiVisible, setUiVisible] = useState(false);

  // CSS-driven overlays
  const [dipOpacity, setDipOpacity]   = useState(0);
  const [veilPulse,  setVeilPulse]    = useState(false);
  const [punchAnim,  setPunchAnim]    = useState(false);

  // ── DOM refs ─────────────────────────────────────────────────────────
  const sectionRef  = useRef<HTMLDivElement>(null);
  const wallRef     = useRef<HTMLDivElement>(null);
  const roomRef     = useRef<HTMLDivElement>(null);
  const bloomRef    = useRef<HTMLDivElement>(null);
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const videoRef    = useRef<HTMLVideoElement>(null);

  // ── Animation + physics state (never triggers re-render) ────────────
  const camRef = useRef({
    g: 0,          // camera progress 0→1
    px: 0, py: 0,  // actual parallax (smoothed)
    tx: 0, ty: 0,  // target parallax
    hover: 0,
    hoverT: 0,
  });
  const motionRef = useRef({
    pos: 0,         // turntable position 0–1 (fraction of video)
    vel: 0,         // fraction / second
    spinning: false,
    spinT0: 0,
    dragging: false,
    dragId: -1,
    dragX0: 0,
    dragP0: 0,
    dragLX: 0,
    dragLT: 0,
    dragV: 0,
  });
  const layoutRef = useRef({
    vw: 0, vh: 0,
    imgW: 1280, imgH: 720,  // natural size of window images (updated on load)
    c: 1,
    W: 0, H: 0,
    baseX: 0, baseY: 0,
    Smax: 1,
    // approximate window hole as center 33% of the image
    hCX: 0.5, hCY: 0.5,
    hW: 0.33, hH: 0.72,
  });
  const enterT0Ref = useRef<number | null>(null);
  const rafRef     = useRef(0);
  const lastRef    = useRef(performance.now());

  // ── Geometry ─────────────────────────────────────────────────────────
  const doLayout = useCallback(() => {
    const sec = sectionRef.current;
    if (!sec) return;
    const L = layoutRef.current;
    L.vw = sec.clientWidth;
    L.vh = sec.clientHeight;
    L.c = Math.max(L.vw / L.imgW, L.vh / L.imgH) * 1.015;
    L.W = L.imgW * L.c;
    L.H = L.imgH * L.c;
    L.baseX = (L.vw - L.W) / 2;
    L.baseY = (L.vh - L.H) / 2;
    // window hole approximate pixel bounds inside the image
    const hx0 = L.imgW * 0.417, hx1 = L.imgW * 0.582;
    const hy0 = L.imgH * 0.19,  hy1 = L.imgH * 0.965;
    L.hCX = (hx0 + hx1) / 2 / L.imgW;
    L.hCY = (hy0 + hy1) / 2 / L.imgH;
    L.hW  = (hx1 - hx0) / L.imgW;
    L.hH  = (hy1 - hy0) / L.imgH;
    const hw = L.hW * L.W, hh = L.hH * L.H;
    L.Smax = 1.06 * Math.max(L.vw / hw, L.vh / hh);
  }, []);

  // ── Camera render ────────────────────────────────────────────────────
  const renderCamera = useCallback(() => {
    const wall  = wallRef.current;
    const room  = roomRef.current;
    const bloom = bloomRef.current;
    if (!wall || !room) return;

    const L   = layoutRef.current;
    const cam = camRef.current;
    const g   = cam.g;
    const fall = 1 - g;

    const S = Math.exp(Math.log(Math.max(1, L.Smax)) * g) * (1 + 0.014 * cam.hover * fall);

    const cx0 = L.baseX + L.hCX * L.W;
    const cy0 = L.baseY + L.hCY * L.H;

    // Wall: zoom so the window centre tracks to the viewport centre
    const wx = lerp(cx0, L.vw / 2, g) - cam.px * 6 * fall;
    const wy = lerp(cy0, L.vh / 2, g) - cam.py * 4 * fall;
    const wtx = wx - L.baseX - S * L.hCX * L.W;
    const wty = wy - L.baseY - S * L.hCY * L.H;
    wall.style.transform   = `translate3d(${wtx}px,${wty}px,0) scale(${S})`;
    const wallB = 1 - 0.55 * smooth(clamp(g / 0.9, 0, 1));
    wall.style.filter = `brightness(${wallB.toFixed(3)})`;

    // Room: covers the hole region, brightens as we approach
    const rx = lerp(cx0, L.baseX + L.W / 2, g) + cam.px * 3 * fall;
    const ry = lerp(cy0, L.baseY + L.H / 2, g) + cam.py * 2 * fall;
    const k  = g >= 1 ? 1 : Math.max(0.82, lerp(0.82, 1, g));
    room.style.transform = `translate3d(${rx - k * L.W / 2 - L.baseX}px,${ry - k * L.H / 2 - L.baseY}px,0) scale(${k})`;
    const roomB = lerp(0.5, 1, smooth(clamp(g / 0.85, 0, 1)));
    room.style.filter = g >= 1 ? "" : `brightness(${roomB.toFixed(3)})`;

    // Bloom
    if (bloom) {
      const br = Math.min(0.95 * L.hH * L.H * S, 2.4 * Math.max(L.vw, L.vh));
      bloom.style.setProperty("--bx", wx + "px");
      bloom.style.setProperty("--by", wy + "px");
      bloom.style.setProperty("--br", br + "px");
      bloom.style.opacity = (
        g >= 1 ? 0 : (0.24 + 0.3 * cam.hover) * fall + 0.5 * Math.pow(Math.sin(Math.PI * g), 2)
      ).toFixed(3);
    }
  }, []);

  // ── Canvas draw ───────────────────────────────────────────────────────
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const video  = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const dw  = canvas.width  / dpr;
    const dh  = canvas.height / dpr;
    ctx.clearRect(0, 0, dw, dh);

    if (video.readyState >= 2 && video.videoWidth) {
      drawCover(ctx, video, video.videoWidth, video.videoHeight, dw, dh);
    }
  }, []);

  // ── Seek video to current turntable position ──────────────────────────
  const seekVideo = useCallback((pos: number) => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const target = mod(pos, 1) * video.duration;
    if (Math.abs(video.currentTime - target) > 0.05) {
      video.currentTime = target;
    }
  }, []);

  // ── Canvas sizing ────────────────────────────────────────────────────
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const setSize = (w: number, h: number) => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width  = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      const ctx = canvas.getContext("2d");
      if (ctx) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.scale(dpr, dpr); }
    };
    const parent = canvas.parentElement;
    if (!parent) return;
    setSize(parent.clientWidth, parent.clientHeight);
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      setSize(width, height);
    });
    ro.observe(parent);
    return () => ro.disconnect();
  }, []);

  // ── Main RAF loop ────────────────────────────────────────────────────
  useEffect(() => {
    const loop = (now: number) => {
      rafRef.current = requestAnimationFrame(loop);
      const dt = clamp((now - lastRef.current) / 1000, 0.001, 0.05);
      lastRef.current = now;

      const cam = camRef.current;
      const m   = motionRef.current;
      const ease = (k: number) => 1 - Math.exp(-dt * k);

      // ── Enter animation ──
      if (scene === "entering") {
        const t0 = enterT0Ref.current ?? now;
        if (!enterT0Ref.current) enterT0Ref.current = now;
        const u = clamp((now - t0) / ENTER_MS, 0, 1);
        const g = camEase(Math.min(1, u / CAM_DONE));
        cam.g = g;
        if (g >= 0.5 && !m.spinning) {
          m.spinning = true;
          m.spinT0 = now;
        }
        renderCamera();
        if (u >= 1) {
          // Done entering
          setScene("character");
          setTimeout(() => setUiVisible(true), UI_DELAY);
          return;
        }
      }

      // ── Parallax (entry only) ──
      if (scene === "entry") {
        const tx = cam.tx, ty = cam.ty;
        if (Math.abs(tx - cam.px) + Math.abs(ty - cam.py) > 0.0005) {
          cam.px += (tx - cam.px) * ease(6);
          cam.py += (ty - cam.py) * ease(6);
          renderCamera();
        }
        if (Math.abs(cam.hoverT - cam.hover) > 0.002) {
          cam.hover += (cam.hoverT - cam.hover) * ease(7);
          renderCamera();
        }
      }

      // ── Turntable ──
      if (scene === "character" && m.spinning && !m.dragging) {
        const gain = smooth(clamp((now - m.spinT0) / SPIN_RAMP, 0, 1));
        const autoV = (AUTO_FPS / 60) / 60; // pos-fraction per frame @60fps, adjust for dt
        const target = autoV * gain;
        m.vel += (target - m.vel) * ease(now - m.spinT0 < SPIN_RAMP ? 6 : SPIN_DECAY);
        m.pos = mod(m.pos + m.vel * dt * 60, 1);
        seekVideo(m.pos);
        drawCanvas();
      } else if (scene === "character" && m.spinning && m.dragging) {
        drawCanvas();
      }
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, renderCamera, drawCanvas, seekVideo]);

  // ── Resize ─────────────────────────────────────────────────────────
  useEffect(() => {
    const onResize = () => { doLayout(); renderCamera(); };
    window.addEventListener("resize", onResize);
    doLayout();
    renderCamera();
    return () => window.removeEventListener("resize", onResize);
  }, [doLayout, renderCamera]);

  // ── Pointer parallax on wall ────────────────────────────────────────
  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const cam = camRef.current;
    const L   = layoutRef.current;
    cam.tx = (e.clientX / Math.max(L.vw, 1) - 0.5) * 2;
    cam.ty = (e.clientY / Math.max(L.vh, 1) - 0.5) * 2;
    // drag
    const m = motionRef.current;
    if (!m.dragging || m.dragId !== e.pointerId) return;
    const fc = Math.max(L.vw * DRAG_TURN, 320);
    const target = m.dragP0 + (e.clientX - m.dragX0) / fc;
    const now = performance.now();
    const dts = Math.max(1, now - m.dragLT) / 1000;
    m.dragV = lerp(m.dragV, (target - m.pos) / dts, 0.4);
    m.dragLT = now;
    m.dragLX = e.clientX;
    m.pos = mod(target, 1);
    seekVideo(m.pos);
    drawCanvas();
  }, [seekVideo, drawCanvas]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (scene !== "character") return;
    const m = motionRef.current;
    m.dragging = true;
    m.dragId   = e.pointerId;
    m.dragX0   = e.clientX;
    m.dragP0   = m.pos;
    m.dragLX   = e.clientX;
    m.dragLT   = performance.now();
    m.dragV    = 0;
    m.vel      = 0;
    try { (e.target as Element).setPointerCapture(e.pointerId); } catch { /* */ }
  }, [scene]);

  const endDrag = useCallback((e: React.PointerEvent) => {
    const m = motionRef.current;
    if (!m.dragging || m.dragId !== e.pointerId) return;
    m.dragging = false;
    m.vel = clamp(m.dragV, -0.5, 0.5);
  }, []);

  // ── Enter transition ────────────────────────────────────────────────
  const handleEnter = useCallback(() => {
    if (scene !== "entry") return;
    enterT0Ref.current = null;
    camRef.current.g   = 0;
    setScene("entering");
  }, [scene]);

  // ── Back ─────────────────────────────────────────────────────────────
  const handleBack = useCallback(() => {
    const start = performance.now();
    const fadeIn = (n: number) => {
      setDipOpacity(Math.min((n - start) / 200, 1));
      if ((n - start) < 200) { requestAnimationFrame(fadeIn); return; }
      setDipOpacity(1);
      setScene("entry");
      setUiVisible(false);
      camRef.current.g = 0;
      renderCamera();
      const fs = performance.now();
      const fadeOut = (fn: number) => {
        setDipOpacity(1 - Math.min((fn - fs) / 300, 1));
        if ((fn - fs) < 300) requestAnimationFrame(fadeOut);
      };
      requestAnimationFrame(fadeOut);
    };
    requestAnimationFrame(fadeIn);
  }, [renderCamera]);

  // ── Character select ────────────────────────────────────────────────
  const handleCharSelect = useCallback((idx: number) => {
    if (idx === charIdx || scene !== "character") return;
    setPunchAnim(false);
    setVeilPulse(false);
    void document.body.offsetWidth; // force reflow
    setPunchAnim(true);
    setVeilPulse(true);
    setTimeout(() => {
      setCharIdx(idx);
      const m = motionRef.current;
      m.pos = CHARACTERS[idx].start;
      seekVideo(m.pos);
      setTimeout(() => { setPunchAnim(false); setVeilPulse(false); }, 640);
    }, 260);
  }, [charIdx, scene, seekVideo]);

  // ── Slide navigation ────────────────────────────────────────────────
  const goNext = useCallback(() => setSlideIdx(p => (p + 1) % SLIDES.length), []);
  const goPrev = useCallback(() => setSlideIdx(p => (p - 1 + SLIDES.length) % SLIDES.length), []);

  const isEntry     = scene === "entry" || scene === "entering";
  const isCharacter = scene === "character";

  // ─────────────────────────────────────────────────────────────────────
  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden"
      style={{
        height: "100vh",
        minHeight: "640px",
        background: "#080403",
        touchAction: "none",
        userSelect: "none",
        cursor: isCharacter ? "grab" : "default",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >

      {/* ── ROOM layer (behind wall, sits inside the window hole) ── */}
      <div
        ref={roomRef}
        className="absolute"
        style={{
          left: 0, top: 0,
          width: "100%", height: "100%",
          transformOrigin: "0 0",
          willChange: "transform, filter",
          pointerEvents: "none",
        }}
      >
        {/* Room background image (use second slide image as the "room inside") */}
        <div className="absolute inset-0">
          <Image
            src={SLIDES[(slideIdx + 1) % SLIDES.length].src}
            alt="Inside the room"
            fill
            priority
            quality={100}
            sizes="100vw"
            className="object-cover"
          />
        </div>

        {/* Character canvas — visible only during entering / character */}
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            display: "block",
            opacity: isCharacter ? 1 : 0,
            transition: "opacity 0.4s ease",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* ── WALL layer (has window alpha cutout, sits in front) ── */}
      <div
        ref={wallRef}
        className="absolute"
        style={{
          left: 0, top: 0,
          width: "100%", height: "100%",
          transformOrigin: "0 0",
          willChange: "transform, filter",
          display: isCharacter ? "none" : "block",
          pointerEvents: "none",
        }}
      >
        <Image
          key={SLIDES[slideIdx].src}
          src={SLIDES[slideIdx].src}
          alt={SLIDES[slideIdx].alt}
          fill
          priority
          quality={100}
          sizes="100vw"
          className="object-cover"
        />
      </div>

      {/* ── BLOOM fx ── */}
      <div
        ref={bloomRef}
        className="pointer-events-none absolute inset-0"
        style={{
          mixBlendMode: "screen",
          opacity: 0,
          background: [
            "radial-gradient(circle var(--br,600px) at var(--bx,50%) var(--by,50%),",
            "rgba(255,182,98,0.6),",
            "rgba(255,140,60,0.2) 46%,",
            "transparent 72%)",
          ].join(" "),
        }}
      />

      {/* ── VIGNETTE ── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 75% 75% at 50% 50%, transparent 52%, rgba(5,2,1,0.5) 100%)",
          opacity: isCharacter ? 0.9 : 0,
          transition: "opacity 1.4s ease",
          zIndex: 8,
        }}
      />

      {/* ── GRAIN ── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: 0.075,
          mixBlendMode: "overlay",
          zIndex: 9,
          backgroundSize: "240px 240px",
          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .9 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`,
        }}
      />

      {/* ── THIN WHITE BORDER ── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ border: "1px solid rgba(255,255,255,0.65)", zIndex: 30 }}
      />

      {/* ── DIP OVERLAY ── */}
      <div
        className="pointer-events-none absolute inset-0 bg-black"
        style={{ opacity: dipOpacity, zIndex: 45 }}
      />

      {/* ── VEIL PULSE (character switch) ── */}
      {veilPulse && (
        <div
          className="pointer-events-none absolute inset-0 bg-[#080403]"
          style={{ zIndex: 44, animation: "veilPulse 640ms ease both" }}
        />
      )}

      {/* ── VIDEO (hidden, scrubbed by RAF) ── */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={videoRef}
        src={VIDEO_SRC}
        preload="auto"
        playsInline
        muted
        style={{ display: "none" }}
      />

      {/* ── CHARACTER SCENE UI ── */}
      {isCharacter && (
        <>
          {/* Scrim behind wheel */}
          <div
            className="pointer-events-none absolute left-0 top-0 bottom-0"
            style={{
              width: "min(50vw,480px)",
              background: "linear-gradient(90deg, rgba(8,4,2,0.72) 0%, rgba(8,4,2,0.4) 55%, transparent 100%)",
              opacity: uiVisible ? 1 : 0,
              transition: "opacity 1.4s ease",
              zIndex: 19,
            }}
          />

          {/* Character wheel */}
          <div style={{ position: "absolute", inset: 0, zIndex: 20, pointerEvents: "none" }}>
            <CharacterWheel
              characters={CHARACTERS}
              activeIdx={charIdx}
              onSelect={handleCharSelect}
              visible={uiVisible}
            />
          </div>

          {/* Drag hint */}
          <div
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              bottom: "34px",
              zIndex: 15,
              pointerEvents: "none",
              opacity: uiVisible ? 1 : 0,
              transition: "opacity 1s ease 1.5s",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              whiteSpace: "nowrap",
              fontFamily: "'Jost', 'Helvetica Neue', Arial, sans-serif",
              fontSize: "14px",
              letterSpacing: "0.06em",
              color: "rgba(244,231,204,0.85)",
              textShadow: "0 1px 10px rgba(0,0,0,0.9)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(214,172,106,0.85)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l-6 6 6 6"/>
            </svg>
            Drag to rotate
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(214,172,106,0.85)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 6l6 6-6 6"/>
            </svg>
          </div>

          {/* Back arrow */}
          <button
            type="button"
            onClick={handleBack}
            aria-label="Back to entry"
            style={{
              position: "absolute", top: 22, left: 22,
              zIndex: 60,
              display: "flex", alignItems: "center", gap: 6,
              background: "transparent", border: "none",
              cursor: "pointer",
              color: "rgba(240,229,208,0.75)",
              fontFamily: "Georgia, serif",
              fontSize: 13, fontStyle: "italic", padding: 0,
            }}
          >
            <span style={{ fontSize: 18, lineHeight: 1 }}>←</span>
            <span>Back</span>
          </button>
        </>
      )}

      {/* ── ENTRY UI ── */}
      {isEntry && (
        <>
          {/* Enter / hotspot button — 1:1 reference port */}
          <div
            className="absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2"
            style={{ pointerEvents: "none" }}
          >
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleEnter(); }}
              onMouseEnter={() => { camRef.current.hoverT = 1; }}
              onMouseLeave={() => { camRef.current.hoverT = 0; }}
              className="enter-cta relative flex items-center justify-center rounded-full"
              style={{
                width: "clamp(74px, 6.4vw, 104px)",
                aspectRatio: "1",
                pointerEvents: "auto",
                cursor: "pointer",
                background: "radial-gradient(circle, rgba(255,214,150,0.22), rgba(255,176,90,0.06) 62%, transparent 74%)",
                border: "1px solid rgba(255,226,172,0.72)",
                boxShadow: "0 0 30px rgba(255,172,84,0.5), inset 0 0 24px rgba(255,190,110,0.28)",
                backdropFilter: "blur(2px)",
              }}
            >
              <span className="enter-cta-ring" style={{ animationDelay: "0s" }} />
              <span className="enter-cta-ring" style={{ animationDelay: "1.8s" }} />
              <span
                style={{
                  position: "relative", zIndex: 1,
                  color: "#fff2d8",
                  fontFamily: "'Cormorant Garamond', 'Iowan Old Style', Georgia, 'Times New Roman', serif",
                  fontStyle: "italic", fontWeight: 500,
                  fontSize: "clamp(19px, 1.65vw, 24px)",
                  lineHeight: 1, letterSpacing: "0.02em",
                  textShadow: "0 0 14px rgba(255,200,120,0.95), 0 0 3px rgba(0,0,0,0.6)",
                }}
              >
                Enter
              </span>
            </button>
          </div>

          {/* Right-center prev/next arrows */}
          <div
            style={{
              position: "absolute", right: 18, top: "50%",
              transform: "translateY(-50%)",
              zIndex: 40,
              display: "flex", flexDirection: "column", gap: 6,
            }}
          >
            {(["↑", "↓"] as const).map((arrow, i) => (
              <button
                key={arrow}
                type="button"
                onClick={(e) => { e.stopPropagation(); i === 0 ? goPrev() : goNext(); }}
                aria-label={i === 0 ? "Previous slide" : "Next slide"}
                style={{
                  width: 44, height: 44,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "rgba(0,0,0,0.25)",
                  border: "1px solid rgba(255,255,255,0.28)",
                  borderRadius: "50%",
                  cursor: "pointer", color: "#fff", fontSize: 18,
                  backdropFilter: "blur(4px)",
                }}
              >
                {arrow}
              </button>
            ))}
          </div>

          {/* Slide dots */}
          <div
            className="absolute bottom-[22px] left-1/2 z-40 -translate-x-1/2"
            style={{ display: "flex", gap: 8, alignItems: "center" }}
          >
            {SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Slide ${i + 1}`}
                onClick={(e) => { e.stopPropagation(); setSlideIdx(i); }}
                style={{
                  width: i === slideIdx ? 24 : 6, height: 2,
                  padding: 0, border: "none",
                  background: i === slideIdx ? "#f0e5d0" : "rgba(240,229,208,0.4)",
                  transition: "all 400ms ease", cursor: "pointer",
                }}
              />
            ))}
          </div>
        </>
      )}

      {/* ── Punch overlay (character switch) ── */}
      {punchAnim && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{ zIndex: 43, animation: "punch 820ms cubic-bezier(0.45,0,0.2,1) both" }}
        />
      )}

      {/* ── Global keyframes ── */}
      <style jsx global>{`
        @keyframes veilPulse {
          0%   { opacity: 0 }
          38%  { opacity: 0.85 }
          100% { opacity: 0 }
        }
        @keyframes punch {
          0%   { backdrop-filter: none; }
          38%  { backdrop-filter: blur(8px) brightness(0.55); }
          100% { backdrop-filter: none; }
        }
        .enter-cta {
          animation: enterCtaIn 1600ms cubic-bezier(0.22,0.7,0.18,1) 600ms both;
          transition: transform 0.6s cubic-bezier(0.22,0.7,0.18,1),
                      box-shadow 0.5s ease, border-color 0.5s ease;
        }
        .enter-cta:hover,
        .enter-cta:focus-visible {
          transform: scale(1.08);
          border-color: rgba(255,240,205,0.95) !important;
          box-shadow: 0 0 46px rgba(255,172,84,0.8),
                      inset 0 0 30px rgba(255,200,120,0.4) !important;
        }
        .enter-cta-ring {
          position: absolute;
          inset: -1px;
          border-radius: 50%;
          border: 1px solid rgba(255,226,172,0.55);
          animation: enterCtaPing 3.6s cubic-bezier(0.2,0.6,0.2,1) infinite;
          pointer-events: none;
        }
        @keyframes enterCtaIn {
          from { opacity: 0; transform: scale(0.9); }
          to   { opacity: 1; transform: scale(1);   }
        }
        @keyframes enterCtaPing {
          0%   { transform: scale(1);    opacity: 0.7; }
          100% { transform: scale(1.95); opacity: 0;   }
        }
        @media (prefers-reduced-motion: reduce) {
          .enter-cta-ring { animation: none; }
          .enter-cta      { animation: none; opacity: 1; }
        }
      `}</style>
    </section>
  );
}
