"use client";

import { Canvas } from "@react-three/fiber";
import { NoToneMapping } from "three";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { CHARACTERS, CharacterWheel } from "../ScrollSection";
import styles from "../ScrollSection.module.css";
import CameraController, { type CameraCommand } from "./camera/CameraController";
import SpeedBlur from "./camera/SpeedBlur";
import WindowNav from "./WindowNav";
import Building from "./rooms/Building";
import { beginDrag, FRAME_COUNT, releaseDrag, roomPlay, scrub, showCharacter } from "./rooms/Frames";
import { ROOMS } from "./rooms/poses";

type Mode = "exterior" | "entering" | "interior" | "exiting" | "moving";

const sans = "var(--font-room-sans), sans-serif";
const OUTSIDE_LEVEL = 0.5;
const OUTSIDE_FADE = 2.8;

function startSound(ctx: AudioContext | null, buffer: AudioBuffer | null, offset = 0) {
  if (!ctx || !buffer) return;
  void ctx.resume();
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start(0, offset);
}

function fadeGain(ctx: AudioContext | null, gain: GainNode | null, level: number) {
  if (!ctx || !gain) return;
  void ctx.resume();
  const now = ctx.currentTime;
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(gain.gain.value, now);
  gain.gain.linearRampToValueAtTime(level, now + OUTSIDE_FADE);
}

export default function Flythrough() {
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState<Mode>("exterior");
  const [command, setCommand] = useState<CameraCommand | null>(null);
  const [picked, setPicked] = useState([0, 1, 2]);
  const [nameSwap, setNameSwap] = useState(false);
  const [hint, setHint] = useState(false);
  const [dragging, setDragging] = useState(false);
  const token = useRef(0);
  const modeRef = useRef(mode);
  const indexRef = useRef(index);
  const commandRef = useRef(command);
  const dragRef = useRef<{ id: number; x: number; p0: number; lt: number; v: number } | null>(null);
  const whoosh = useRef<AudioBuffer | null>(null);
  const click = useRef<AudioBuffer | null>(null);
  const audioCtx = useRef<AudioContext | null>(null);
  const outsideGain = useRef<GainNode | null>(null);
  const outsideSource = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    modeRef.current = mode;
    indexRef.current = index;
    commandRef.current = command;
  }, [mode, index, command]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
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
    load("/house/whoosh.mp3", whoosh);
    load("/house/click.mp3", click);
    fetch("/house/outside.mp3")
      .then((response) => response.arrayBuffer())
      .then((data) => ctx.decodeAudioData(data))
      .then((buffer) => {
        if (cancel) return;
        const gain = ctx.createGain();
        const inside = modeRef.current === "interior" || modeRef.current === "entering";
        gain.gain.value = inside ? 0 : OUTSIDE_LEVEL;
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        source.connect(gain);
        gain.connect(ctx.destination);
        source.start(0);
        outsideGain.current = gain;
        outsideSource.current = source;
      })
      .catch(() => undefined);
    return () => {
      cancel = true;
      whoosh.current = null;
      click.current = null;
      outsideSource.current?.stop();
      outsideSource.current = null;
      outsideGain.current = null;
      audioCtx.current = null;
      void ctx.close();
      document.body.style.overflow = previous;
    };
  }, []);

  function enter(roomIndex: number) {
    if (modeRef.current !== "exterior" || roomIndex !== indexRef.current) return;
    modeRef.current = "entering";
    token.current += 1;
    setMode("entering");
    setCommand({ token: token.current, kind: "enter", index: roomIndex });
    fadeGain(audioCtx.current, outsideGain.current, 0);
  }

  function exit() {
    if (modeRef.current !== "interior") return;
    modeRef.current = "exiting";
    token.current += 1;
    setMode("exiting");
    setCommand({ token: token.current, kind: "exit", index: indexRef.current });
    fadeGain(audioCtx.current, outsideGain.current, OUTSIDE_LEVEL);
  }

  function slide(to: number) {
    if (modeRef.current !== "exterior" || to < 0 || to >= ROOMS.length) return;
    modeRef.current = "moving";
    token.current += 1;
    const from = indexRef.current;
    startSound(audioCtx.current, whoosh.current, 0.12);
    setMode("moving");
    setCommand({ token: token.current, kind: "next", from, to });
  }

  function onComplete() {
    const current = commandRef.current;
    if (!current) return;
    if (current.kind === "enter") {
      modeRef.current = "interior";
      setHint(true);
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
      if (modeRef.current !== "interior") return;
      const n = Number.parseInt(event.key, 10);
      if (n >= 1 && n <= CHARACTERS.length) chooseCharacter(n - 1);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function chooseCharacter(character: number) {
    if (modeRef.current !== "interior" || !CHARACTERS[character]) return;
    const room = indexRef.current;
    setPicked((current) => current.map((value, i) => (i === room ? character : value)));
    setNameSwap(true);
    window.setTimeout(() => setNameSwap(false), 220);
    setHint(false);
    window.setTimeout(() => {
      showCharacter(room, Math.round(CHARACTERS[character].start * FRAME_COUNT));
    }, 260);
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (modeRef.current !== "interior") return;
    if ((event.target as Element).closest("button, [data-cast]")) return;
    const item = roomPlay(indexRef.current);
    if (!item) return;
    beginDrag(indexRef.current);
    dragRef.current = { id: event.pointerId, x: event.clientX, p0: item.pos, lt: performance.now(), v: 0 };
    setDragging(true);
    setHint(false);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    const span = Math.min(900, Math.max(320, window.innerWidth * 0.8));
    const target = drag.p0 + (drag.x - event.clientX) * (FRAME_COUNT / span);
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

  return (
    <main
      className="relative h-dvh w-full overflow-hidden bg-[#c5d0dc] text-white"
      onPointerDownCapture={(event) => {
        if (event.button !== 0) return;
        startSound(audioCtx.current, click.current, 0.02);
      }}
    >
      <Canvas
        shadows
        camera={{ position: [0, 1.9, 3.58], fov: 72, near: 0.1, far: 80 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, toneMapping: NoToneMapping }}
        style={{ width: "100%", height: "100%", display: "block" }}
      >
        <color attach="background" args={["#c5d0dc"]} />
        <fog attach="fog" args={["#c5d0dc", 22, 48]} />
        <CameraController command={command} onComplete={onComplete} />
        <SpeedBlur />
        <Building interactive={mode === "exterior"} onEnter={enter} />
        <WindowNav
          x={ROOMS[index].x}
          visible={mode === "exterior"}
          canPrev={index > 0}
          canNext={index < ROOMS.length - 1}
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
          touchAction: mode === "interior" ? "none" : "pan-y",
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

        {mode === "interior" && (
          <>
            <div className={styles.castScrim} />
            <div className={styles.cast} data-cast>
              <CharacterWheel selected={picked[index] ?? 0} onSelect={chooseCharacter} />
              <div className={`${styles.wheelName} ${nameSwap ? styles.swap : ""}`} aria-live="polite">
                {CHARACTERS[picked[index] ?? 0]?.name}
              </div>
            </div>
          </>
        )}

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

        <div className={`${styles.hint} ${hint ? styles.show : ""}`}>
          <svg viewBox="0 0 24 24"><path d="M9 6l-6 6 6 6" /></svg>
          Drag to rotate
          <svg viewBox="0 0 24 24"><path d="M15 6l6 6-6 6" /></svg>
        </div>
      </div>
    </main>
  );
}
