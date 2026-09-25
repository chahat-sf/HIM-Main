"use client";

import { useLoader, useThree } from "@react-three/fiber";
import { ROOMS } from "./poses";
import { Suspense, useEffect, useMemo, type ReactNode } from "react";
import {
  CanvasTexture,
  DoubleSide,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
} from "three";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";

const TILE_W = 5;
const TILE_H = TILE_W;
const FACADE_BOTTOM = -3.5;
const FACADE_TOP = 7;
const FACADE_LEFT = -12;
const FACADE_RIGHT = ROOMS[ROOMS.length - 1].x + 12;

const WINDOW_URL = "/second-window.avif";
const MASK_URL = encodeURI("/window mask.webp");
const OPENING_FRAC_W = 0.4018445322793149;
const OPENING_FRAC_H = 0.5991808074897601;
const OPENING_HEIGHT = 2.5;
const PLANE_HEIGHT = OPENING_HEIGHT / OPENING_FRAC_H;
const PLANE_WIDTH = PLANE_HEIGHT * (1518 / 1709);
const OPENING_WIDTH = PLANE_WIDTH * OPENING_FRAC_W;
const WINDOW_Z = 0.12;

function openingPixel(r: number, g: number, b: number) {
  return r > 160 && r > g + 80 && r > b + 80;
}

let windowMaterial: MeshBasicMaterial | null = null;

function useWindowMaterial() {
  const [color, mask] = useLoader(TextureLoader, [WINDOW_URL, MASK_URL]);
  return useMemo(() => {
    if (windowMaterial?.map) return windowMaterial;
    const photo = color.image as HTMLImageElement;
    const key = mask.image as HTMLImageElement;
    const width = photo.naturalWidth || photo.width;
    const height = photo.naturalHeight || photo.height;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = width;
    maskCanvas.height = height;
    const maskCtx = maskCanvas.getContext("2d", { willReadFrequently: true });
    if (!ctx || !maskCtx) return new MeshBasicMaterial();
    ctx.drawImage(photo, 0, 0, width, height);
    maskCtx.drawImage(key, 0, 0, width, height);
    const image = ctx.getImageData(0, 0, width, height);
    const keyed = maskCtx.getImageData(0, 0, width, height);
    for (let i = 0; i < image.data.length; i += 4) {
      if (openingPixel(keyed.data[i], keyed.data[i + 1], keyed.data[i + 2])) image.data[i + 3] = 0;
    }
    ctx.putImageData(image, 0, 0);
    const map = new CanvasTexture(canvas);
    map.colorSpace = SRGBColorSpace;
    map.needsUpdate = true;
    windowMaterial = new MeshBasicMaterial({
      map,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    });
    return windowMaterial;
  }, [color, mask]);
}

export function Block({
  position,
  args,
  color,
  roughness = 0.86,
  cast = false,
}: {
  position: [number, number, number];
  args: [number, number, number];
  color: string;
  roughness?: number;
  cast?: boolean;
}) {
  return (
    <mesh position={position} castShadow={cast} receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial color={color} roughness={roughness} metalness={0.02} />
    </mesh>
  );
}

function wallUrl() {
  const mobile = typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches;
  return mobile ? encodeURI("/wall stone mobile.ktx2") : "/wallstone.ktx2";
}

function useWallMaterial() {
  const gl = useThree((state) => state.gl);
  const url = useMemo(wallUrl, []);
  const map = useLoader(KTX2Loader, url, (loader) => {
    loader.detectSupport(gl);
  });
  return useMemo(() => {
    map.wrapS = RepeatWrapping;
    map.wrapT = RepeatWrapping;
    map.colorSpace = SRGBColorSpace;
    map.anisotropy = gl.capabilities.getMaxAnisotropy();
    return new MeshStandardMaterial({
      map,
      color: "#ffffff",
      roughness: 0.96,
      metalness: 0,
      side: DoubleSide,
    });
  }, [map, gl]);
}

function BrickFace({
  material,
  width,
  height,
  position,
  rotation = [0, 0, 0],
  offsetX = 0,
  offsetY = 0,
}: {
  material: MeshStandardMaterial;
  width: number;
  height: number;
  position: [number, number, number];
  rotation?: [number, number, number];
  offsetX?: number;
  offsetY?: number;
}) {
  const geometry = useMemo(() => {
    const geo = new PlaneGeometry(width, height);
    const uv = geo.getAttribute("uv");
    const across = width / TILE_W;
    const down = height / TILE_H;
    for (let i = 0; i < uv.count; i += 1) {
      uv.setXY(i, uv.getX(i) * across + offsetX, uv.getY(i) * down + offsetY);
    }
    return geo;
  }, [width, height, offsetX, offsetY]);

  return (
    <mesh
      position={position}
      rotation={rotation}
      geometry={geometry}
      material={material}
      raycast={() => null}
      receiveShadow
    />
  );
}

function Window({ interactive, onEnter }: { interactive: boolean; onEnter: () => void }) {
  const material = useWindowMaterial();

  useEffect(() => {
    if (!interactive) document.body.style.cursor = "";
  }, [interactive]);

  return (
    <group>
      <mesh position={[0, 1.9, WINDOW_Z]} material={material} raycast={() => null}>
        <planeGeometry args={[PLANE_WIDTH, PLANE_HEIGHT]} />
      </mesh>
      <mesh
        position={[0, 1.9, WINDOW_Z + 0.08]}
        onClick={(event) => {
          event.stopPropagation();
          if (interactive) onEnter();
        }}
        onPointerOver={(event) => {
          event.stopPropagation();
          if (interactive) document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "";
        }}
      >
        <planeGeometry args={[OPENING_WIDTH, OPENING_HEIGHT]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

export function RoomShell({
  x,
  interactive,
  onEnter,
  children,
}: {
  x: number;
  interactive: boolean;
  onEnter: () => void;
  children: ReactNode;
}) {
  return (
    <group position={[x, 0, 0]} name="room">
      <Suspense fallback={null}>
        <Window interactive={interactive} onEnter={onEnter} />
      </Suspense>
      {children}
    </group>
  );
}

export function Facade() {
  const material = useWallMaterial();
  const edge = OPENING_WIDTH / 2;
  const sillTop = 1.9 - OPENING_HEIGHT / 2;
  const headerBottom = 1.9 + OPENING_HEIGHT / 2;
  const spans: [number, number][] = [];
  let cursor = FACADE_LEFT;
  for (const room of ROOMS) {
    spans.push([cursor, room.x - edge]);
    cursor = room.x + edge;
  }
  spans.push([cursor, FACADE_RIGHT]);

  return (
    <group>
      <BrickFace
        material={material}
        width={FACADE_RIGHT - FACADE_LEFT}
        height={sillTop - FACADE_BOTTOM}
        position={[(FACADE_LEFT + FACADE_RIGHT) / 2, (FACADE_BOTTOM + sillTop) / 2, 0.06]}
        offsetX={FACADE_LEFT / TILE_W}
        offsetY={FACADE_BOTTOM / TILE_H}
      />
      <BrickFace
        material={material}
        width={FACADE_RIGHT - FACADE_LEFT}
        height={FACADE_TOP - headerBottom}
        position={[(FACADE_LEFT + FACADE_RIGHT) / 2, (headerBottom + FACADE_TOP) / 2, 0.06]}
        offsetX={FACADE_LEFT / TILE_W}
        offsetY={headerBottom / TILE_H}
      />
      {spans.map(([x0, x1]) => (
        <BrickFace
          material={material}
          key={`${x0}-${x1}`}
          width={x1 - x0}
          height={headerBottom - sillTop}
          position={[(x0 + x1) / 2, (sillTop + headerBottom) / 2, 0.06]}
          offsetX={x0 / TILE_W}
          offsetY={sillTop / TILE_H}
        />
      ))}
    </group>
  );
}
