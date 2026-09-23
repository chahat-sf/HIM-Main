"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import styles from "./ScrollSection.module.css";

/**
 * Interactive room — port of interactive-room-v5.html.
 * The camera, parallax, and turntable run in one animation frame loop
 * that writes the DOM directly. React state is only used for the wheel.
 */

type Scene = "entry" | "entering" | "character";

const CHARACTERS = [
  { id: "character-1", name: "Character 01", start: 0 },
  { id: "character-2", name: "Character 02", start: 209 / 241 },
  { id: "character-3", name: "Character 03", start: 181 / 241 },
  { id: "character-4", name: "Character 04", start: 32 / 241 },
] as const;

const FPS = 24;
const FRAME_COUNT = 241;
/** Bumps the frame URL so a cached 430×740 cutout cannot be stretched into the new plate. */
const FRAME_REV = "2";

const ENTER_MS = 2200;
const CAM_DONE = 0.9;
const CAMERA_EASE = [0.6, 0, 0.2, 1] as const;
const UI_DELAY = 500;
const DISSOLVE = [0.42, 0.9] as const;
const SPIN_START = 0.5;
const SPIN_RAMP_MS = 1800;
const DRAG_TURN = 0.8;
const SPIN_DECAY = 2.2;

/** Native plate size of video-1.mp4. The canvas covers the whole room. */
const PLATE = { w: 2212, h: 936 };

const IMG = { w: 3168, h: 1344 };
const HOLE = { x0: 1321, y0: 250, x1: 1845, y1: 1131 };
const HOLE_SAFE = { x0: 1327, y0: 257, x1: 1839, y1: 1123 };
const HOLE_C = { x: (HOLE.x0 + HOLE.x1) / 2, y: (HOLE.y0 + HOLE.y1) / 2 };

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => t * t * (3 - 2 * t);

function bezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = (t: number) => ((ax * t + bx) * t + cx) * t;
  const Y = (t: number) => ((ay * t + by) * t + cy) * t;
  const dX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
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

const camEase = bezier(...CAMERA_EASE);

function CharacterWheel({
  selected,
  onSelect,
}: {
  selected: number;
  onSelect: (i: number) => void;
}) {
  const uid = useId().replace(/:/g, "");
  const N = CHARACTERS.length;
  const cx = 150;
  const cy = 150;
  const R = 138;
  const step = (2 * Math.PI) / N;
  const P = (r: number, a: number): [number, number] => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const f = (v: number) => v.toFixed(2);

  const wedges = CHARACTERS.map((ch, i) => {
    const mid = -Math.PI / 2 + i * step;
    const a1 = mid - step / 2;
    const a2 = mid + step / 2;
    const [x1, y1] = P(R, a1);
    const [x2, y2] = P(R, a2);
    const d = `M${cx} ${cy}L${f(x1)} ${f(y1)}A${R} ${R} 0 0 1 ${f(x2)} ${f(y2)}Z`;
    const rr = R + 6.5;
    const dl = 0.045;
    const [rx1, ry1] = P(rr, a1 + dl);
    const [rx2, ry2] = P(rr, a2 - dl);
    const arc = `M${f(rx1)} ${f(ry1)}A${rr} ${rr} 0 0 1 ${f(rx2)} ${f(ry2)}`;
    const [px, py] = P(R * 0.62, mid);
    const s = R * 1.5;
    const iy = py + s * 0.1;
    const [bx, by] = P(R * 0.3, mid);
    return { ch, i, d, arc, px, iy, s, bx, by };
  });

  return (
    <svg className={styles.wheel} viewBox="0 0 300 300" role="group" aria-label="Choose a character">
      <defs>
        {wedges.map(({ i, d }) => (
          <clipPath key={i} id={`${uid}-wc${i}`}>
            <path d={d} />
          </clipPath>
        ))}
      </defs>
      <circle className={styles.disc} cx={cx} cy={cy} r={R + 9} />
      {wedges.map(({ ch, i, d, arc, px, iy, s, bx, by }) => (
        <g
          key={ch.id}
          className={styles.wedge}
          role="button"
          tabIndex={0}
          aria-label={ch.name}
          aria-pressed={i === selected}
          onClick={() => onSelect(i)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelect(i);
            }
          }}
        >
          <g clipPath={`url(#${uid}-wc${i})`}>
            <rect x="0" y="0" width="300" height="300" fill="#1a0d06" />
            <image
              href={`/room/portraits/${i}.webp`}
              x={px - s / 2}
              y={iy - s / 2}
              width={s}
              height={s}
              preserveAspectRatio="xMidYMid slice"
            />
          </g>
          <path className={styles.glow} d={d} />
          <path className={styles.shade} d={d} />
          <path className={styles.edge} d={d} />
          <path className={styles.rim} d={arc} />
          <g className={styles.badge} transform={`translate(${f(bx)} ${f(by)})`}>
            <circle r="11.5" />
            <text>{i + 1}</text>
          </g>
        </g>
      ))}
      <circle className={styles.hub} cx={cx} cy={cy} r="4.5" />
    </svg>
  );
}

export default function ScrollSection() {
  const [selected, setSelected] = useState(0);
  const [wheelName, setWheelName] = useState<string>(CHARACTERS[0].name);
  const [nameSwap, setNameSwap] = useState(false);

  const appRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const wallRef = useRef<HTMLDivElement>(null);
  const wallImgRef = useRef<HTMLImageElement>(null);
  const roomLayerRef = useRef<HTMLDivElement>(null);
  const roomInnerRef = useRef<HTMLDivElement>(null);
  const roomImgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bloomRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<Scene>("entry");
  const flagsRef = useRef({
    booted: false,
    uiIn: false,
    dragging: false,
    veilOut: false,
    wallHidden: false,
  });

  const apiRef = useRef<{
    enter: () => void;
    select: (i: number) => void;
    hover: (on: boolean) => void;
  }>({
    enter: () => { },
    select: () => { },
    hover: () => { },
  });

  // React owns `data-scene="entry"` for the first paint. Later scene changes
  // live on the DOM; this puts them back before paint if a wheel update re-renders.
  useLayoutEffect(() => {
    const app = appRef.current;
    if (!app) return;
    const flags = flagsRef.current;
    app.dataset.scene = sceneRef.current;
    app.classList.toggle(styles.booted, flags.booted);
    app.classList.toggle(styles.uiIn, flags.uiIn);
    app.classList.toggle(styles.dragging, flags.dragging);
    veilRef.current?.classList.toggle(styles.out, flags.veilOut);
    if (wallRef.current) wallRef.current.style.display = flags.wallHidden ? "none" : "";
  });

  useEffect(() => {
    const app = appRef.current;
    const stage = stageRef.current;
    const wall = wallRef.current;
    const wallImg = wallImgRef.current;
    const roomLayer = roomLayerRef.current;
    const roomInner = roomInnerRef.current;
    const roomImg = roomImgRef.current;
    const canvas = canvasRef.current;
    const bloom = bloomRef.current;
    const hint = hintRef.current;
    const veil = veilRef.current;
    const ctx = canvas?.getContext("2d");
    if (!app || !stage || !wall || !wallImg || !roomLayer || !roomInner || !roomImg || !canvas || !bloom || !hint || !veil || !ctx) {
      return;
    }

    const api = apiRef.current;
    let dead = false;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const autoV = reduced ? 0 : FPS;

    const frames = {
      n: FRAME_COUNT,
      imgs: new Array<HTMLImageElement | undefined>(FRAME_COUNT),
      ok: new Array<boolean>(FRAME_COUNT).fill(false),
    };

    const cam = { g: 0, hover: 0, hoverT: 0, px: 0, py: 0, tx: 0, ty: 0 };
    let vw = 0, vh = 0, W = 0, H = 0, c = 1, baseX = 0, baseY = 0, Smax = 1;
    let dirty = true;
    let blur = 0;
    let enterT0: number | null = null;
    let pos = 0;
    let vel = 0;
    let spinT0: number | null = null;
    let dragging = false;
    let drawnIdx = -1;
    let hasFrame = false;
    let drag: { id: number; x: number; p0: number; lt: number; v: number } | null = null;

    const timers = new Set<number>();
    const later = (fn: () => void, ms: number) => {
      const id = window.setTimeout(() => {
        timers.delete(id);
        if (!dead) fn();
      }, ms);
      timers.add(id);
      return id;
    };

    function load(i: number) {
      if (frames.imgs[i]) return;
      const im = new Image();
      frames.imgs[i] = im;
      im.src = `/room/frames/${String(i).padStart(3, "0")}.webp?v=${FRAME_REV}`;
      const done = () => { frames.ok[i] = true; };
      (im.decode ? im.decode() : Promise.resolve()).then(done, done);
    }

    function preloadAll() {
      let i = 0;
      for (; i < FPS * 2 && i < frames.n; i++) load(i);
      const more = () => {
        if (dead) return;
        for (let k = 0; k < 8 && i < frames.n; k++, i++) load(i);
        if (i < frames.n) later(more, 40);
      };
      more();
    }

    function setPos(p: number) {
      pos = p;
      drawnIdx = -1;
    }

    function drawFrame() {
      const n = frames.n;
      const i = ((Math.floor(pos) % n) + n) % n;
      if (i === drawnIdx) return;
      for (let k = -4; k <= 26; k++) load((i + k + n) % n);
      let j = i;
      if (!frames.ok[j]) {
        j = -1;
        for (let d = 1; d <= 10 && j < 0; d++) {
          const a = (i - d + n) % n;
          const b = (i + d) % n;
          if (frames.ok[a]) j = a;
          else if (frames.ok[b]) j = b;
        }
        if (j < 0) return;
      }
      const img = frames.imgs[j];
      if (!img) return;
      const iw = img.naturalWidth || PLATE.w;
      const ih = img.naturalHeight || PLATE.h;
      if (canvas!.width !== iw || canvas!.height !== ih) {
        canvas!.width = iw;
        canvas!.height = ih;
      }
      ctx!.clearRect(0, 0, iw, ih);
      ctx!.drawImage(img, 0, 0, iw, ih);
      hasFrame = true;
      drawnIdx = j === i ? i : -1;
    }

    function layout() {
      vw = app!.clientWidth;
      vh = app!.clientHeight;
      if (vw < 2 || vh < 2) return;
      c = Math.max(vw / IMG.w, vh / IMG.h) * 1.015;
      W = IMG.w * c;
      H = IMG.h * c;
      baseX = (vw - W) / 2;
      baseY = (vh - H) / 2;
      const hw = (HOLE_SAFE.x1 - HOLE_SAFE.x0) * c;
      const hh = (HOLE_SAFE.y1 - HOLE_SAFE.y0) * c;
      Smax = 1.06 * Math.max(vw / hw, vh / hh);
      for (const el of [stage!, roomLayer!, wall!]) {
        el.style.width = W + "px";
        el.style.height = H + "px";
      }
      dirty = true;
    }

    function renderCamera() {
      const g = cam.g;
      const h = cam.hover;
      const fall = 1 - g;
      const S = Math.exp(Math.log(Smax) * g) * (1 + 0.014 * h * fall);

      const cx0 = baseX + HOLE_C.x * c;
      const cy0 = baseY + HOLE_C.y * c;
      const wx = lerp(cx0, vw / 2, g) - cam.px * 6 * fall;
      const wy = lerp(cy0, vh / 2, g) - cam.py * 4 * fall;
      const wtx = wx - baseX - S * HOLE_C.x * c;
      const wty = wy - baseY - S * HOLE_C.y * c;
      wall!.style.transform = `translate3d(${wtx}px,${wty}px,0) scale(${S})`;

      const hx0 = baseX + wtx + S * HOLE.x0 * c;
      const hx1 = baseX + wtx + S * HOLE.x1 * c;
      const hy0 = baseY + wty + S * HOLE.y0 * c;
      const hy1 = baseY + wty + S * HOLE.y1 * c;
      const ix0 = Math.max(hx0, 0);
      const ix1 = Math.min(hx1, vw);
      const iy0 = Math.max(hy0, 0);
      const iy1 = Math.min(hy1, vh);

      const rx = lerp(cx0, baseX + W / 2, g) + cam.px * 3 * fall;
      const ry = lerp(cy0, baseY + H / 2, g) + cam.py * 2 * fall;
      const need = Math.max(
        Math.max(rx - ix0, ix1 - rx) / (W / 2),
        Math.max(ry - iy0, iy1 - ry) / (H / 2),
      );
      const kPref = lerp(0.8, 1, 1 - fall * fall);
      const k = g >= 1 ? 1 : Math.max(kPref, need * 1.012 + 0.002);
      roomLayer!.style.transform = `translate3d(${rx - k * W / 2 - baseX}px,${ry - k * H / 2 - baseY}px,0) scale(${k})`;

      const t = smooth(clamp(g / 0.85, 0, 1));
      roomLayer!.style.filter = g >= 1 ? "" : `brightness(${lerp(0.5 + 0.22 * h, 1, t).toFixed(3)})`;
      const wallB = 1 - 0.55 * smooth(clamp(g / 0.9, 0, 1));
      wall!.style.filter = `brightness(${wallB.toFixed(3)})` + (blur > 0.05 ? ` blur(${blur.toFixed(2)}px)` : "");

      canvas!.style.opacity = !hasFrame ? "0" : g >= 1 ? "1" : smooth(clamp((g - DISSOLVE[0]) / (DISSOLVE[1] - DISSOLVE[0]), 0, 1)).toFixed(3);

      const br = Math.min(0.95 * (HOLE.y1 - HOLE.y0) * c * S, 2.4 * Math.max(vw, vh));
      bloom!.style.setProperty("--bx", wx + "px");
      bloom!.style.setProperty("--by", wy + "px");
      bloom!.style.setProperty("--br", br + "px");
      bloom!.style.opacity = g >= 1 ? "0" : ((0.24 + 0.3 * h) * fall + 0.5 * Math.pow(Math.sin(Math.PI * g), 2)).toFixed(3);
    }

    function apply() {
      stage!.style.transform = `translate3d(${baseX}px,${baseY}px,0)`;
      if (sceneRef.current === "entry" || sceneRef.current === "entering") renderCamera();
    }

    function setScene(next: Scene) {
      sceneRef.current = next;
      app!.dataset.scene = next;
    }

    function finishEnter() {
      cam.g = 1;
      blur = 0;
      setScene("character");
      flagsRef.current.wallHidden = true;
      wall!.style.display = "none";
      wall!.style.filter = "";
      roomLayer!.style.transform = "";
      roomLayer!.style.filter = "";
      canvas!.style.opacity = "";
      bloom!.style.opacity = "0";
      layout();
      later(() => {
        flagsRef.current.uiIn = true;
        app!.classList.add(styles.uiIn);
        hint!.classList.add(styles.show);
      }, UI_DELAY);
    }

    function enter() {
      if (sceneRef.current !== "entry") return;
      cam.hoverT = 0;
      setScene("entering");
      enterT0 = null;
    }

    let swapTimer = 0;
    function selectCharacter(i: number) {
      if (sceneRef.current !== "character" || !CHARACTERS[i]) return;
      setSelected(i);
      setNameSwap(true);
      window.clearTimeout(swapTimer);
      swapTimer = later(() => {
        setWheelName(CHARACTERS[i].name);
        setNameSwap(false);
      }, 220);
      hint!.classList.remove(styles.show);
      veil!.classList.remove(styles.pulse);
      void veil!.offsetWidth;
      veil!.classList.add(styles.pulse);
      roomInner!.classList.remove(styles.punch);
      void roomInner!.offsetWidth;
      roomInner!.classList.add(styles.punch);
      later(() => {
        setPos(CHARACTERS[i].start * frames.n);
        vel = autoV;
        for (let k = 0; k < 30; k++) load((Math.floor(pos) + k) % frames.n);
      }, 260);
      later(() => roomInner!.classList.remove(styles.punch), 900);
    }

    api.enter = enter;
    api.select = selectCharacter;
    api.hover = (on) => {
      if (on) {
        if (sceneRef.current === "entry") cam.hoverT = 1;
      } else {
        cam.hoverT = 0;
      }
    };

    const framesPerPx = () => frames.n / clamp(vw * DRAG_TURN, 320, 900);

    const onPointerDown = (e: PointerEvent) => {
      if (sceneRef.current !== "character") return;
      if ((e.target as Element | null)?.closest?.(`.${styles.cast}`)) return;
      dragging = true;
      vel = 0;
      drag = { id: e.pointerId, x: e.clientX, p0: pos, lt: performance.now(), v: 0 };
      try { app!.setPointerCapture(e.pointerId); } catch { /* already released */ }
      flagsRef.current.dragging = true;
      app!.classList.add(styles.dragging);
      hint!.classList.remove(styles.show);
      hint!.style.display = "none";
    };

    const onPointerMove = (e: PointerEvent) => {
      cam.tx = (e.clientX / Math.max(vw, 1) - 0.5) * 2;
      cam.ty = (e.clientY / Math.max(vh, 1) - 0.5) * 2;
      if (!drag || drag.id !== e.pointerId) return;
      const target = drag.p0 + (drag.x - e.clientX) * framesPerPx();
      const now = performance.now();
      const dtm = Math.max(1, now - drag.lt) / 1000;
      drag.v = lerp(drag.v, (target - pos) / dtm, 0.4);
      drag.lt = now;
      setPos(target);
    };

    const endDrag = (e: PointerEvent) => {
      if (!drag || drag.id !== e.pointerId) return;
      vel = clamp(drag.v, -260, 260);
      dragging = false;
      drag = null;
      flagsRef.current.dragging = false;
      app!.classList.remove(styles.dragging);
      if (spinT0 === null) spinT0 = performance.now();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (sceneRef.current !== "character") return;
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        vel += (e.key === "ArrowLeft" ? 1 : -1) * 70;
        hint!.style.display = "none";
      }
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= CHARACTERS.length) selectCharacter(n - 1);
    };

    let last = performance.now();
    let raf = 0;
    const frame = (now: number) => {
      if (dead) return;
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
      last = now;
      const ease = (k: number) => 1 - Math.exp(-dt * k);

      if (sceneRef.current === "entering") {
        if (enterT0 === null) enterT0 = now;
        const u = clamp((now - enterT0) / (reduced ? 800 : ENTER_MS), 0, 1);
        const g = camEase(Math.min(1, u / CAM_DONE));
        blur = reduced ? 0 : clamp(Math.abs(g - cam.g) / dt * 1.3, 0, 2.6);
        cam.g = g;
        dirty = true;
        if (g >= SPIN_START && spinT0 === null) spinT0 = now;
        if (u >= 1) finishEnter();
      }

      const tx = sceneRef.current === "entry" ? cam.tx : 0;
      const ty = sceneRef.current === "entry" ? cam.ty : 0;
      if (Math.abs(tx - cam.px) + Math.abs(ty - cam.py) > 0.0005) {
        cam.px += (tx - cam.px) * ease(6);
        cam.py += (ty - cam.py) * ease(6);
        dirty = true;
      }
      if (Math.abs(cam.hoverT - cam.hover) > 0.002) {
        cam.hover += (cam.hoverT - cam.hover) * ease(7);
        dirty = true;
      }

      if (spinT0 !== null && !dragging) {
        const gain = smooth(clamp((now - spinT0) / SPIN_RAMP_MS, 0, 1));
        vel += (autoV * gain - vel) * ease(now - spinT0 < SPIN_RAMP_MS ? 6 : SPIN_DECAY);
        pos += vel * dt;
      }
      drawFrame();
      if (dirty) {
        apply();
        dirty = false;
      }
    };

    app.dataset.scene = sceneRef.current;
    layout();
    apply();
    preloadAll();
    Promise.all([
      wallImg.decode().catch(() => { }),
      roomImg.decode().catch(() => { }),
    ]).then(() => {
      if (dead) return;
      layout();
      apply();
      requestAnimationFrame(() => {
        if (dead) return;
        flagsRef.current.booted = true;
        flagsRef.current.veilOut = true;
        app.classList.add(styles.booted);
        veil.classList.add(styles.out);
      });
    });

    raf = requestAnimationFrame(frame);
    app.addEventListener("pointerdown", onPointerDown);
    app.addEventListener("pointermove", onPointerMove);
    app.addEventListener("pointerup", endDrag);
    app.addEventListener("pointercancel", endDrag);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", layout);
    const ro = new ResizeObserver(() => layout());
    ro.observe(app);

    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      timers.forEach((id) => window.clearTimeout(id));
      api.enter = () => { };
      api.select = () => { };
      api.hover = () => { };
      app.removeEventListener("pointerdown", onPointerDown);
      app.removeEventListener("pointermove", onPointerMove);
      app.removeEventListener("pointerup", endDrag);
      app.removeEventListener("pointercancel", endDrag);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", layout);
      ro.disconnect();
    };
  }, []);

  return (
    <section className={styles.section}>
      <div ref={appRef} className={styles.root} data-scene="entry">
        <div className={styles.world}>
          <div ref={stageRef} className={styles.stage}>
            <div ref={roomLayerRef} className={`${styles.layer} ${styles.roomLayer}`}>
              <div ref={roomInnerRef} className={styles.roomInner}>
                {/* Native img: the camera sizes this bitmap in pixels and the wall alpha must stay intact. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={roomImgRef}
                  src="/room/room.webp"
                  alt="Panelled walnut room with an open armoire of folded fabrics and a rack of fabric rolls"
                  draggable={false}
                />
                <canvas
                  ref={canvasRef}
                  className={styles.frameCanvas}
                  width={PLATE.w}
                  height={PLATE.h}
                  role="img"
                  aria-label="Character on a turntable in the room. Drag left or right to rotate."
                />
              </div>
            </div>

            <div ref={wallRef} className={`${styles.layer} ${styles.wall}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={wallImgRef}
                src="/room/wall.webp"
                alt="Panelled walnut wall with an open shuttered window"
                draggable={false}
              />
              <button
                type="button"
                className={styles.hotspot}
                aria-label="Enter the room through the window"
                onClick={() => apiRef.current.enter()}
                onPointerEnter={() => apiRef.current.hover(true)}
                onPointerLeave={() => apiRef.current.hover(false)}
                onFocus={() => apiRef.current.hover(true)}
                onBlur={() => apiRef.current.hover(false)}
              >
                <span className={styles.cta}>Enter</span>
              </button>
            </div>
          </div>
        </div>

        <div ref={bloomRef} className={`${styles.fx} ${styles.bloom}`} />
        <div className={`${styles.fx} ${styles.vignette}`} />
        <div className={`${styles.fx} ${styles.grain}`} />

        <div className={styles.castScrim} />
        <div className={styles.cast}>
          <CharacterWheel selected={selected} onSelect={(i) => apiRef.current.select(i)} />
          <div className={`${styles.wheelName} ${nameSwap ? styles.swap : ""}`} aria-live="polite">
            {wheelName}
          </div>
        </div>

        <div ref={hintRef} className={styles.hint}>
          <svg viewBox="0 0 24 24"><path d="M9 6l-6 6 6 6" /></svg>
          Drag to rotate
          <svg viewBox="0 0 24 24"><path d="M15 6l6 6-6 6" /></svg>
        </div>

        <div ref={veilRef} className={`${styles.fx} ${styles.veil}`} />
      </div>
    </section>
  );
}
