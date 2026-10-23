"use client";

import { Canvas } from "@react-three/fiber";
import { NoToneMapping } from "three";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import styles from "../ScrollSection.module.css";
import { CHARACTERS } from "./characters";
import CameraController, { type CameraCommand } from "./camera/CameraController";
import SpeedBlur from "./camera/SpeedBlur";
import DragGuide from "./DragGuide";
import OutfitPanel, { OUTFIT_COUNT } from "./OutfitPanel";
import WindowNav from "./WindowNav";
import Building from "./rooms/Building";
import { useHomeLoad } from "../HomeGate";
import {
  beginDrag,
  frameCount,
  releaseDrag,
  roomPlay,
  scrub,
  setInteractMode,
  showCharacter,
} from "./rooms/Frames";
import { ROOMS } from "./rooms/poses";

type Mode = "exterior" | "entering" | "interior" | "exiting" | "moving";

const sans = "var(--font-room-sans), sans-serif";
const OUTSIDE_LEVEL = 0.5;
const OUTSIDE_FADE = 2.8;
const MOBILE_WINDOW = "(max-width: 768px)";
const SWIPE_THRESHOLD = 48;
const DRAG_GUIDE_KEY = "house-drag-guide";
const DRAG_GUIDE_THRESHOLD = 24;

function dragGuideSeen() {
  try {
    return sessionStorage.getItem(DRAG_GUIDE_KEY) === "1";
  } catch {
    return false;
  }
}

function markDragGuideSeen() {
  try {
    sessionStorage.setItem(DRAG_GUIDE_KEY, "1");
  } catch {
    /* private mode */
  }
}

type Cue = { offset: number; duration: number; gain?: number };

const CLICK: Cue = { offset: 57.6191, duration: 0.4667, gain: 0.5 };
const ENTER: Cue[] = [
  { offset: 51.3534, duration: 1.5667 },
  { offset: 52.97, duration: 1.5667 },
];
const SWIPE: Cue[] = [
  { offset: 63.4254, duration: 0.6851 },
  { offset: 64.1605, duration: 0.6851 },
  { offset: 64.8956, duration: 0.6851 },
];

function pick(cues: Cue[]) {
  return cues[Math.floor(Math.random() * cues.length)];
}

function startSound(ctx: AudioContext | null, buffer: AudioBuffer | null, cue: Cue) {
  if (!ctx || !buffer) return;
  void ctx.resume();
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.value = cue.gain ?? 1;
  source.connect(gain);
  gain.connect(ctx.destination);
  source.start(0, cue.offset, cue.duration);
}

function fadeGain(ctx: AudioContext | null, gain: GainNode | null, level: number) {
  if (!ctx || !gain) return;
  void ctx.resume();
  const now = ctx.currentTime;
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(gain.gain.value, now);
  gain.gain.linearRampToValueAtTime(level, now + OUTSIDE_FADE);
}

/** 0 when the house is off-screen; 1 when it fills the viewport; ramps with visible coverage. */
function sectionProximity(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight || 1;
  const visible = Math.max(0, Math.min(vh, rect.bottom) - Math.max(0, rect.top));
  if (visible <= 0) return 0;
  const coverage = Math.min(1, visible / vh);
  // Ease so thin edge slivers stay near silent and full-screen sits at 1.
  return coverage * coverage;
}

export default function Flythrough({ embedded = false }: { embedded?: boolean }) {
  const [index, setIndex] = useState(0);
  const [navIndex, setNavIndex] = useState(0);
  const [sliding, setSliding] = useState(false);
  const [mode, setMode] = useState<Mode>("interior");
  const [command, setCommand] = useState<CameraCommand | null>(null);
  const [picked, setPicked] = useState(() => ROOMS.map((_, i) => i % OUTFIT_COUNT));
  const [dragGuide, setDragGuide] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [interactMode, setInteractModeState] = useState(false);
  const [interactLoading, setInteractLoading] = useState(false);
  const interactModeRef = useRef(false);
  const interactReadyRef = useRef(false);
  const interactLoadingRef = useRef(false);
  const interactTokenRef = useRef(0);
  const dragGuideRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [dpr, setDpr] = useState<number | [number, number]>([1, 1.5]);
  // Start rendering immediately so idle video warms during the load gate (not only on scroll-in).
  const [frameloop, setFrameloop] = useState<"always" | "never">("always");
  const homeLoad = useHomeLoad();
  const homeLoadRef = useRef(homeLoad);
  homeLoadRef.current = homeLoad;
  const token = useRef(0);
  const modeRef = useRef(mode);
  const indexRef = useRef(index);
  const commandRef = useRef(command);
  const dragRef = useRef<{ id: number; x: number; p0: number; lt: number; v: number } | null>(null);
  const swipeRef = useRef<{ id: number; x: number; y: number } | null>(null);
  const swipedRef = useRef(false);
  const sprite = useRef<AudioBuffer | null>(null);
  const audioCtx = useRef<AudioContext | null>(null);
  const outsideGain = useRef<GainNode | null>(null);
  const outsideSource = useRef<AudioBufferSourceNode | null>(null);
  const rootRef = useRef<HTMLElement | null>(null);
  const proximityRef = useRef(embedded ? 0 : 1);
  const applyAmbientRef = useRef<() => void>(() => { });
  const intersectingRef = useRef(!embedded);

  useEffect(() => {
    modeRef.current = mode;
    indexRef.current = index;
    commandRef.current = command;
    interactModeRef.current = interactMode;
    dragGuideRef.current = dragGuide;
  }, [mode, index, command, interactMode, dragGuide]);

  function dismissDragGuide() {
    if (!dragGuideRef.current) return;
    dragGuideRef.current = false;
    setDragGuide(false);
    markDragGuideSeen();
  }

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_WINDOW);
    const sync = () => setDpr(mq.matches ? 1 : [1, 1.5]);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Warm the house during HomeGate (even off-screen) so auto-spin is live when the
  // user scrolls to section 2. After first frame: always while visible, never off-screen.
  // Do not freeze on page scroll — that left the plate stuck mid-spin on arrival.
  useEffect(() => {
    if (!embedded) return;
    const el = rootRef.current;
    if (!el) return;

    const syncFrameloop = () => {
      if (!ready) {
        setFrameloop("always");
        return;
      }
      if (dragRef.current || interactLoadingRef.current || intersectingRef.current) {
        setFrameloop("always");
        return;
      }
      setFrameloop("never");
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        intersectingRef.current = entry.isIntersecting;
        syncFrameloop();
      },
      { threshold: 0.01 },
    );
    io.observe(el);
    syncFrameloop();

    return () => io.disconnect();
  }, [embedded, ready]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    if (!embedded) document.body.style.overflow = "hidden";
    const ctx = new AudioContext();
    audioCtx.current = ctx;
    let cancel = false;
    function load(url: string, slot: { current: AudioBuffer | null }) {
      fetch(url)
        .then((response) => response.arrayBuffer())
        .then((data) => ctx.decodeAudioData(data))
        .then((buffer) => {
          if (!cancel) slot.current = buffer;
        })
        .catch(() => undefined);
    }
    load("/house/sounds.mp4", sprite);
    // Outdoor ambient is deferred until exterior mode (see effect below).
    return () => {
      cancel = true;
      sprite.current = null;
      outsideSource.current?.stop();
      outsideSource.current = null;
      outsideGain.current = null;
      audioCtx.current = null;
      void ctx.close();
      if (!embedded) document.body.style.overflow = previous;
    };
  }, [embedded]);

  // Load outdoor loop only when the user is (or was) outside — skip wasted decode in interior-only boot.
  useEffect(() => {
    if (mode !== "exterior" && mode !== "moving" && mode !== "exiting") return;
    if (outsideSource.current) return;
    const ctx = audioCtx.current;
    if (!ctx) return;
    let cancel = false;
    fetch("/house/outdoor-ambient.mp4")
      .then((response) => response.arrayBuffer())
      .then((data) => ctx.decodeAudioData(data))
      .then((buffer) => {
        if (cancel || outsideSource.current) return;
        const gain = ctx.createGain();
        const outside = modeRef.current === "exterior" || modeRef.current === "moving";
        gain.gain.value = outside ? proximityRef.current * OUTSIDE_LEVEL : 0;
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        source.connect(gain);
        gain.connect(ctx.destination);
        source.start(0);
        outsideGain.current = gain;
        outsideSource.current = source;
        void ctx.resume().then(() => applyAmbientRef.current()).catch(() => undefined);
      })
      .catch(() => undefined);
    return () => {
      cancel = true;
    };
  }, [mode]);

  useEffect(() => {
    if (!embedded) {
      proximityRef.current = 1;
      applyAmbientRef.current = () => { };
      return;
    }
    let raf = 0;
    const writeGain = () => {
      const ctx = audioCtx.current;
      const gain = outsideGain.current;
      if (!ctx || !gain || ctx.state !== "running") return;
      const proximity = proximityRef.current;
      const current = modeRef.current;
      if (proximity <= 0) {
        gain.gain.cancelScheduledValues(ctx.currentTime);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        return;
      }
      if (current !== "exterior" && current !== "moving") return;
      const level = proximity * OUTSIDE_LEVEL;
      gain.gain.cancelScheduledValues(ctx.currentTime);
      gain.gain.setValueAtTime(level, ctx.currentTime);
    };
    const apply = () => {
      raf = 0;
      const el = rootRef.current;
      if (!el) return;
      proximityRef.current = sectionProximity(el);
      writeGain();
    };
    let resumeAttempted = false;
    const resumeIfAllowed = () => {
      const ctx = audioCtx.current;
      if (!ctx || ctx.state !== "suspended") {
        writeGain();
        return;
      }
      const activation = navigator.userActivation;
      const gesture = !activation || activation.isActive || activation.hasBeenActive;
      // One attempt on load. Further attempts wait for a real click, tap, or key so scroll does not spam a blocked context.
      if (!gesture && resumeAttempted) return;
      resumeAttempted = true;
      void ctx.resume().then(writeGain).catch(() => undefined);
    };
    applyAmbientRef.current = () => {
      const el = rootRef.current;
      if (el) proximityRef.current = sectionProximity(el);
      resumeIfAllowed();
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        apply();
        resumeIfAllowed();
      });
    };
    // Click, tap, or key anywhere on the page — not only the house — unlocks audio.
    const unlock = () => {
      applyAmbientRef.current();
    };
    apply();
    const capture = { capture: true } as const;
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("pointerdown", unlock, capture);
    window.addEventListener("keydown", unlock, capture);
    window.addEventListener("touchstart", unlock, capture);
    window.addEventListener("him-start", unlock);
    return () => {
      applyAmbientRef.current = () => { };
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("pointerdown", unlock, capture);
      window.removeEventListener("keydown", unlock, capture);
      window.removeEventListener("touchstart", unlock, capture);
      window.removeEventListener("him-start", unlock);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [embedded]);

  function enter(roomIndex: number) {
    if (swipedRef.current) return;
    if (modeRef.current !== "exterior" || roomIndex !== indexRef.current) return;
    modeRef.current = "entering";
    token.current += 1;
    setNavIndex(roomIndex);
    setSliding(false);
    setMode("entering");
    setCommand({ token: token.current, kind: "enter", index: roomIndex });
    startSound(audioCtx.current, sprite.current, pick(ENTER));
    fadeGain(audioCtx.current, outsideGain.current, 0);
  }

  function clearInteractUi() {
    interactTokenRef.current += 1;
    interactModeRef.current = false;
    interactReadyRef.current = false;
    interactLoadingRef.current = false;
    setInteractModeState(false);
    setInteractLoading(false);
    setDragGuide(false);
    dragGuideRef.current = false;
    setDragging(false);
    dragRef.current = null;
  }

  function exit() {
    if (modeRef.current !== "interior") return;
    modeRef.current = "exiting";
    token.current += 1;
    // Re-enter always starts on 2k idle auto-spin.
    void setInteractMode(false, indexRef.current);
    clearInteractUi();
    setMode("exiting");
    setCommand({ token: token.current, kind: "exit", index: indexRef.current });
    fadeGain(audioCtx.current, outsideGain.current, proximityRef.current * OUTSIDE_LEVEL);
  }

  async function toggleInteract() {
    if (modeRef.current !== "interior") return;

    // Cancel in-flight load or leave drag → back to idle auto-spin.
    if (interactModeRef.current || interactLoadingRef.current) {
      void setInteractMode(false, indexRef.current);
      clearInteractUi();
      return;
    }

    const loadToken = ++interactTokenRef.current;
    interactLoadingRef.current = true;
    interactReadyRef.current = false;
    setInteractLoading(true);
    // Ensure the canvas keeps painting while the interact plate buffers.
    if (!embedded || intersectingRef.current) setFrameloop("always");

    const ok = await setInteractMode(true, indexRef.current);
    if (loadToken !== interactTokenRef.current) return;
    if (!ok || modeRef.current !== "interior") {
      interactLoadingRef.current = false;
      setInteractLoading(false);
      return;
    }

    interactModeRef.current = true;
    interactReadyRef.current = true;
    interactLoadingRef.current = false;
    setInteractModeState(true);
    setInteractLoading(false);
    const show = !dragGuideSeen();
    dragGuideRef.current = show;
    setDragGuide(show);
  }

  function slide(to: number) {
    if (modeRef.current !== "exterior" || to < 0 || to >= ROOMS.length || to === indexRef.current) return;
    token.current += 1;
    const from = indexRef.current;
    indexRef.current = to;
    setIndex(to);
    setSliding(true);
    startSound(audioCtx.current, sprite.current, pick(SWIPE));
    setCommand({ token: token.current, kind: "next", from, to });
  }

  function onSettled() {
    setNavIndex(indexRef.current);
    setSliding(false);
  }

  function onComplete() {
    const current = commandRef.current;
    if (!current) return;
    if (current.kind === "enter") {
      modeRef.current = "interior";
      void setInteractMode(false, indexRef.current);
      clearInteractUi();
      setMode("interior");
      return;
    }
    if (current.kind === "next") {
      indexRef.current = current.to;
      setIndex(current.to);
    }
    modeRef.current = "exterior";
    setMode("exterior");
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      // Rotate/drag mode: ignore room/window navigation keys (use Auto to leave).
      if (interactModeRef.current) return;

      if (event.key === "Enter" || event.key === "ArrowUp") {
        event.preventDefault();
        enter(indexRef.current);
        return;
      }
      if (event.key === "Escape" || event.key === "ArrowDown") {
        event.preventDefault();
        exit();
        return;
      }
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        slide(indexRef.current + (event.key === "ArrowRight" ? 1 : -1));
        return;
      }
      if (modeRef.current !== "interior" || ROOMS.length <= 1) return;
      const n = Number.parseInt(event.key, 10);
      if (n >= 1 && n <= OUTFIT_COUNT) chooseCharacter(n - 1);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function chooseCharacter(character: number) {
    if (modeRef.current !== "interior" || !CHARACTERS[character] || character >= OUTFIT_COUNT) return;
    const room = indexRef.current;
    setPicked((current) => current.map((value, i) => (i === room ? character : value)));
    window.setTimeout(() => {
      showCharacter(room, Math.round(CHARACTERS[character].start * frameCount(room)));
    }, 260);
  }

  function onWindowPointerDown(event: PointerEvent<HTMLElement>) {
    if (event.button !== 0 || modeRef.current !== "exterior") return;
    if (!window.matchMedia(MOBILE_WINDOW).matches) return;
    const target = event.target;
    if (target instanceof Element && target.closest("button")) return;
    swipeRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
  }

  function onWindowPointerMove(event: PointerEvent<HTMLElement>) {
    const swipe = swipeRef.current;
    if (!swipe || swipe.id !== event.pointerId) return;
    const dx = event.clientX - swipe.x;
    const dy = event.clientY - swipe.y;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) >= 10) event.currentTarget.setPointerCapture(event.pointerId);
    if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return;
    swipeRef.current = null;
    if (Math.abs(dx) <= Math.abs(dy)) return;
    swipedRef.current = true;
    slide(indexRef.current + (dx < 0 ? 1 : -1));
  }

  function onWindowPointerUp() {
    swipeRef.current = null;
    if (!swipedRef.current) return;
    window.setTimeout(() => {
      swipedRef.current = false;
    }, 0);
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (modeRef.current !== "interior" || !interactModeRef.current || !interactReadyRef.current) return;
    if ((event.target as Element).closest("button, [data-cast]")) return;
    const item = roomPlay(indexRef.current);
    if (!item) return;
    beginDrag(indexRef.current);
    dragRef.current = { id: event.pointerId, x: event.clientX, p0: item.pos, lt: performance.now(), v: 0 };
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    if (dragGuideRef.current && Math.abs(event.clientX - drag.x) >= DRAG_GUIDE_THRESHOLD) {
      dismissDragGuide();
    }
    const span = Math.min(900, Math.max(320, window.innerWidth * 0.8));
    const target = drag.p0 + (drag.x - event.clientX) * (frameCount(indexRef.current) / span);
    const now = performance.now();
    const dt = Math.max(1, now - drag.lt) / 1000;
    drag.v += ((target - roomPlay(indexRef.current).pos) / dt - drag.v) * 0.4;
    drag.lt = now;
    scrub(indexRef.current, target);
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    releaseDrag(indexRef.current, drag.v);
    dragRef.current = null;
    setDragging(false);
  }

  const scene = mode === "interior" ? "character" : mode === "exterior" ? "entry" : undefined;
  const Root = embedded ? "section" : "main";

  return (
    <Root
      ref={rootRef}
      id={embedded ? "house" : undefined}
      className="relative h-svh w-full overflow-hidden bg-[#1a120c] text-white"
      aria-busy={!ready}
      style={{
        touchAction: embedded ? "pan-y" : "none",
        transform: "translateZ(0)",
      }}
      onPointerDownCapture={(event) => {
        if (event.button !== 0) return;
        startSound(audioCtx.current, sprite.current, CLICK);
        onWindowPointerDown(event);
      }}
      onPointerMoveCapture={onWindowPointerMove}
      onPointerUpCapture={onWindowPointerUp}
      onPointerCancelCapture={onWindowPointerUp}
    >
      <Canvas
        frameloop={frameloop}
        camera={{ position: [0, 1.9, 0.05], fov: 72, near: 0.1, far: 80 }}
        dpr={dpr}
        gl={{ antialias: true, toneMapping: NoToneMapping }}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
      >
        <color attach="background" args={["#1a120c"]} />
        <fog attach="fog" args={["#1a120c", 22, 48]} />
        <CameraController
          command={command}
          onComplete={onComplete}
          onSettled={onSettled}
          parallax={mode === "exterior" || mode === "moving"}
          idleSway={mode === "exterior" || mode === "moving"}
        />
        <SpeedBlur />
        <Building
          interactive={mode === "exterior"}
          onEnter={enter}
          onFirstFrame={() => {
            setReady(true);
            if (embedded) homeLoadRef.current?.reportHouseReady();
          }}
        />
        <WindowNav
          x={ROOMS[index].x}
          visible={mode === "exterior"}
          canPrev={index > 0 || navIndex > 0}
          canNext={index < ROOMS.length - 1 || navIndex < ROOMS.length - 1}
          sliding={sliding}
          onPrev={() => slide(index - 1)}
          onNext={() => slide(index + 1)}
          onEnter={() => enter(index)}
        />
      </Canvas>

      <div
        className={`${styles.root} ${mode === "interior" ? styles.uiIn : ""} ${dragging ? styles.dragging : ""}`}
        data-scene={scene}
        style={{
          background: "transparent",
          pointerEvents: mode === "interior" ? "auto" : "none",
          touchAction: mode === "interior" && interactMode && !interactLoading ? "none" : "pan-y",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <p
          className="absolute bottom-8 left-1/2 m-0 -translate-x-1/2 text-[12px] tracking-[0.22em] uppercase transition-opacity duration-300"
          style={{
            fontFamily: sans,
            opacity: mode === "exterior" ? 0.85 : 0,
          }}
        >
          Click the window
        </p>
        {/* <p
          className="absolute bottom-3 left-1/2 m-0 -translate-x-1/2 text-[10px] tracking-[0.08em] text-white/45"
          style={{ fontFamily: sans }}
        >
          Miniature open window model by PK
        </p> */}

        {mode === "interior" && !interactMode && (
          <>
            <div className={styles.castScrim} />
            <div className={`${styles.cast} ${styles.castPanel}`} data-cast>
              <OutfitPanel
                selected={picked[index] ?? 0}
                onSelect={chooseCharacter}
                showOutfits={ROOMS.length > 1}
              />
            </div>
            {ROOMS.length > 1 && (
              <button
                type="button"
                className={styles.changeRoomBtn}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation();
                  exit();
                }}
                aria-label="Change room"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 14L4 9l5-5" />
                  <path d="M4 9h12.5M20 20v-7a4 4 0 0 0-4-4H4" />
                </svg>
                <span>Change Room</span>
              </button>
            )}
          </>
        )}

        {mode === "interior" && (
          <button
            type="button"
            className={`${styles.rotateBtn}${interactMode ? ` ${styles.rotateBtnActive}` : ""}${interactLoading ? ` ${styles.rotateBtnLoading}` : ""}`}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              void toggleInteract();
            }}
            aria-label={
              interactLoading
                ? "Loading drag rotate"
                : interactMode
                  ? "Return to auto spin"
                  : "Enable drag rotate"
            }
            aria-pressed={interactMode}
            aria-busy={interactLoading}
          >
            <svg className={styles.rotateBtnIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M21 12a9 9 0 1 1-3.2-6.9" />
              <path d="M21 3v6h-6" />
            </svg>
            <span>{interactLoading ? "Loading" : interactMode ? "Auto" : "Rotate"}</span>
          </button>
        )}

        <DragGuide visible={dragGuide && interactMode && !interactLoading} onDismiss={dismissDragGuide} />
      </div>

      {!embedded && (
        <div
          aria-hidden={ready}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 40,
            display: "grid",
            placeItems: "center",
            background: "#1a120c",
            opacity: ready ? 0 : 1,
            pointerEvents: ready ? "none" : "auto",
            transition: "opacity 0.45s ease",
          }}
        >
          <p
            className="m-0 text-[12px] tracking-[0.22em] uppercase"
            style={{ fontFamily: sans, color: "#1a120c" }}
          >
            Loading
          </p>
        </div>
      )}
    </Root>
  );
}
