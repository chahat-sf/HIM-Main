"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useRef, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Group, Matrix4, Vector3, type PerspectiveCamera } from "three";
import { PLANE_HEIGHT, WINDOW_CENTER_Y } from "./rooms/Shell";
import styles from "./WindowNav.module.css";

const CAMERA_Y = WINDOW_CENTER_Y;
const CAMERA_Z = 3.58;
const WALL_Z = 0.12;
const POP_Z = 0.9;

const frameBottom = WINDOW_CENTER_Y - PLANE_HEIGHT / 2;
const depth = (CAMERA_Z - POP_Z) / (CAMERA_Z - WALL_Z);

function popped(x: number, y: number): [number, number, number] {
  return [x * depth, CAMERA_Y + (y - CAMERA_Y) * depth, POP_Z];
}

const ENTER_POS = popped(0, frameBottom + 0.25);
const EDGE_PAD = 20;
const _forward = new Vector3();
const _right = new Vector3();
const _point = new Vector3();

function epsilon(value: number) {
  return Math.abs(value) < 1e-10 ? 0 : value;
}

function cssMatrix(matrix: Matrix4, multipliers: number[], prepend = "") {
  const elements = matrix.elements;
  let out = "matrix3d(";
  for (let i = 0; i < 16; i += 1) {
    out += epsilon(multipliers[i] * elements[i]) + (i !== 15 ? "," : ")");
  }
  return prepend + out;
}

const CAMERA_MULTIPLIERS = [1, -1, 1, 1, 1, -1, 1, 1, 1, -1, 1, 1, 1, -1, 1, 1];

function objectMultipliers(distanceFactor: number) {
  const scale = distanceFactor / 400;
  return [scale, scale, scale, 1, -scale, -scale, -scale, -1, scale, scale, scale, 1, 1, 1, 1, 1];
}

// A second React root keeps these labels out of the canvas reconciler.
function SceneHtml({
  position,
  edge = 0,
  children,
}: {
  position: [number, number, number];
  edge?: -1 | 0 | 1;
  children: ReactNode;
}) {
  const group = useRef<Group>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const rootRef = useRef<Root | null>(null);
  const { camera, size, gl } = useThree();

  useLayoutEffect(() => {
    const parent = gl.domElement.parentElement;
    if (!parent) return;
    const host = document.createElement("div");
    host.style.cssText = "position:absolute;top:0;left:0;pointer-events:none;overflow:hidden;";
    hostRef.current = host;
    parent.appendChild(host);
    const reactRoot = createRoot(host);
    rootRef.current = reactRoot;
    return () => {
      rootRef.current = null;
      hostRef.current = null;
      queueMicrotask(() => {
        reactRoot.unmount();
        host.remove();
      });
    };
  }, [gl]);

  useLayoutEffect(() => {
    rootRef.current?.render(
      <div
        ref={outer}
        style={{ position: "absolute", top: 0, left: 0, transformStyle: "preserve-3d", pointerEvents: "none" }}
      >
        <div ref={inner} style={{ position: "absolute", pointerEvents: "none" }}>
          {children}
        </div>
      </div>,
    );
  });

  useFrame(() => {
    const object = group.current;
    const host = hostRef.current;
    const outerEl = outer.current;
    const innerEl = inner.current;
    if (!object || !host || !outerEl || !innerEl) return;
    if (edge !== 0) {
      const distance = Math.max(0.2, camera.position.z - POP_Z);
      const halfHeight = Math.tan(((camera as PerspectiveCamera).fov * Math.PI) / 360) * distance;
      const halfWidth = halfHeight * (size.width / size.height);
      const button = innerEl.querySelector("button");
      const halfPx = button ? button.offsetWidth / 2 : 56;
      const inset = (EDGE_PAD + halfPx) / (size.height / 2 / halfHeight);
      _forward.set(0, 0, -1).applyQuaternion(camera.quaternion);
      _right.set(1, 0, 0).applyQuaternion(camera.quaternion);
      _point.copy(camera.position).addScaledVector(_forward, distance).addScaledVector(_right, edge * (halfWidth - inset));
      object.parent?.worldToLocal(_point);
      object.position.copy(_point);
    }
    object.updateWorldMatrix(true, false);
    const widthHalf = size.width / 2;
    const heightHalf = size.height / 2;
    const fov = (camera as PerspectiveCamera).projectionMatrix.elements[5] * heightHalf;
    const view = cssMatrix(camera.matrixWorldInverse, CAMERA_MULTIPLIERS);
    host.style.width = `${size.width}px`;
    host.style.height = `${size.height}px`;
    host.style.perspective = `${fov}px`;
    outerEl.style.width = `${size.width}px`;
    outerEl.style.height = `${size.height}px`;
    outerEl.style.transform = `translateZ(${fov}px)${view}translate(${widthHalf}px,${heightHalf}px)`;
    const distanceFactor = (400 * (CAMERA_Z - POP_Z)) / fov;
    innerEl.style.transform = cssMatrix(object.matrixWorld, objectMultipliers(distanceFactor), "translate(-50%,-50%)");
  });

  return <group ref={group} position={position} />;
}

function Chevron({ direction }: { direction: "left" | "right" }) {
  const path = direction === "left" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6";
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

function Plaque({
  position,
  edge = 0,
  hidden = false,
  label,
  ariaLabel,
  onClick,
  leading,
  trailing,
}: {
  position: [number, number, number];
  edge?: -1 | 0 | 1;
  hidden?: boolean;
  label: string;
  ariaLabel: string;
  onClick: () => void;
  leading?: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <SceneHtml position={position} edge={edge}>
      <button
        type="button"
        className={edge !== 0 ? `${styles.pill} ${styles.edge}` : styles.pill}
        aria-label={ariaLabel}
        aria-hidden={hidden || undefined}
        style={hidden ? { visibility: "hidden", pointerEvents: "none" } : undefined}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          if (!hidden) onClick();
        }}
      >
        {leading}
        <span>{label}</span>
        {trailing}
      </button>
    </SceneHtml>
  );
}

export default function WindowNav({
  x,
  visible,
  canPrev,
  canNext,
  onPrev,
  onNext,
  onEnter,
}: {
  x: number;
  visible: boolean;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onEnter: () => void;
}) {
  if (!visible) return null;

  return (
    <group position={[x, 0, 0]}>
      <Plaque
        key="prev"
        position={[0, WINDOW_CENTER_Y, POP_Z]}
        edge={-1}
        hidden={!canPrev}
        label="Previous"
        ariaLabel="Previous window"
        onClick={onPrev}
        leading={<Chevron direction="left" />}
      />
      <Plaque
        key="next"
        position={[0, WINDOW_CENTER_Y, POP_Z]}
        edge={1}
        hidden={!canNext}
        label="Next"
        ariaLabel="Next window"
        onClick={onNext}
        trailing={<Chevron direction="right" />}
      />
      <Plaque key="enter" position={ENTER_POS} label="Enter the room" ariaLabel="Enter the room" onClick={onEnter} />
    </group>
  );
}
