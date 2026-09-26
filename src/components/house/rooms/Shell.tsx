"use client";

import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { ROOMS } from "./poses";
import { useEffect, useMemo, type ReactNode } from "react";
import {
  CanvasTexture,
  DataTexture,
  DoubleSide,
  LinearFilter,
  MeshBasicMaterial,
  MeshStandardMaterial,
  NoColorSpace,
  PlaneGeometry,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
  Vector2,
  type Texture,
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
export const PLANE_HEIGHT = OPENING_HEIGHT / OPENING_FRAC_H;
export const PLANE_WIDTH = PLANE_HEIGHT * (1518 / 1709);
const OPENING_WIDTH = PLANE_WIDTH * OPENING_FRAC_W;
const WINDOW_Z = 0.12;
export const WINDOW_CENTER_Y = 1.9;
const GOBO_URL = "/gobo.png?canopy=1";

const goboUniforms = {
  uGoboMap: { value: null as Texture | null },
  uNoiseMap: { value: null as Texture | null },
  uGoboTime: { value: 0 },
  uGoboScale: { value: new Vector2(10.2, 6.5) },
  uGoboStrength: { value: 1 },
};

const GOBO_VARYING = /* glsl */ `
#ifndef DISABLE_GOBO
varying vec3 vGoboWorld;
#endif
`;

const GOBO_WORLD = /* glsl */ `
#ifndef DISABLE_GOBO
vGoboWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;
#endif
`;

const GOBO_FRAG = /* glsl */ `
#ifndef DISABLE_GOBO
uniform sampler2D uGoboMap;
uniform sampler2D uNoiseMap;
uniform float uGoboTime;
uniform vec2 uGoboScale;
uniform float uGoboStrength;

vec3 applyGobo(vec3 color) {
  vec2 broad = texture2D(uNoiseMap, vGoboWorld.xy * 0.035 + vec2(uGoboTime * 0.012, uGoboTime * 0.004)).rg;
  vec2 fine = texture2D(uNoiseMap, vGoboWorld.xy * 0.16 + vec2(uGoboTime * 0.02, -uGoboTime * 0.03)).rg;
  vec2 goboUv = vGoboWorld.xy / uGoboScale + vec2(0.5, 0.21);
  goboUv += (broad - 0.5) * 0.04 + (fine - 0.5) * 0.012;
  float raw = clamp(texture2D(uGoboMap, goboUv).r, 0.0, 1.0);
  vec3 sunlit = color * vec3(1.16, 1.08, 0.96);
  return sunlit * mix(1.0, raw, uGoboStrength);
}
#endif
`;

const GOBO_APPLY = /* glsl */ `
#ifndef DISABLE_GOBO
gl_FragColor.rgb = applyGobo(gl_FragColor.rgb);
#endif
`;

function isMobileWall() {
  return typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches;
}

function fade(t: number) {
  return t * t * (3 - 2 * t);
}

function noiseValue(lattice: Float32Array, cells: number, x: number, y: number) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const tx = fade(x - x0);
  const ty = fade(y - y0);
  const at = (ix: number, iy: number) => lattice[iy * (cells + 1) + ix];
  return (
    at(x0, y0) * (1 - tx) * (1 - ty) +
    at(x0 + 1, y0) * tx * (1 - ty) +
    at(x0, y0 + 1) * (1 - tx) * ty +
    at(x0 + 1, y0 + 1) * tx * ty
  );
}

let noiseMap: DataTexture | null = null;

function getNoiseMap() {
  if (noiseMap) return noiseMap;
  const size = 128;
  const cells = 16;
  const count = (cells + 1) * (cells + 1);
  const latticeA = new Float32Array(count);
  const latticeB = new Float32Array(count);
  for (let i = 0; i < count; i += 1) {
    latticeA[i] = Math.random();
    latticeB[i] = Math.random();
  }
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const gx = (x / size) * cells;
      const gy = (y / size) * cells;
      const offset = (y * size + x) * 4;
      data[offset] = Math.round(noiseValue(latticeA, cells, gx, gy) * 255);
      data[offset + 1] = Math.round(noiseValue(latticeB, cells, gx, gy) * 255);
      data[offset + 3] = 255;
    }
  }
  const texture = new DataTexture(data, size, size);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearFilter;
  texture.colorSpace = NoColorSpace;
  texture.needsUpdate = true;
  noiseMap = texture;
  return texture;
}

function applyFacadeGobo(material: MeshBasicMaterial | MeshStandardMaterial, disabled: boolean) {
  material.customProgramCacheKey = () => (disabled ? "facade-gobo-off" : "facade-gobo-canopy");
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, goboUniforms);
    const define = disabled ? "#define DISABLE_GOBO\n" : "";
    shader.vertexShader =
      define +
      shader.vertexShader
        .replace("#include <common>", `#include <common>\n${GOBO_VARYING}`)
        .replace("#include <project_vertex>", `#include <project_vertex>\n${GOBO_WORLD}`);
    shader.fragmentShader =
      define +
      shader.fragmentShader
        .replace("#include <common>", `#include <common>\n${GOBO_VARYING}\n${GOBO_FRAG}`)
        .replace("#include <opaque_fragment>", `#include <opaque_fragment>\n${GOBO_APPLY}`);
  };
}

function useGoboTexture() {
  const map = useLoader(TextureLoader, GOBO_URL);
  return useMemo(() => {
    map.colorSpace = NoColorSpace;
    map.wrapS = RepeatWrapping;
    map.wrapT = RepeatWrapping;
    map.magFilter = LinearFilter;
    map.minFilter = LinearFilter;
    goboUniforms.uGoboMap.value = map;
    goboUniforms.uNoiseMap.value = getNoiseMap();
    return map;
  }, [map]);
}

function openingPixel(r: number, g: number, b: number) {
  return r > 160 && r > g + 80 && r > b + 80;
}

let windowMaterial: MeshBasicMaterial | null = null;

function useWindowMaterial() {
  const [color, mask] = useLoader(TextureLoader, [WINDOW_URL, MASK_URL]);
  const gobo = useGoboTexture();
  const mobile = useMemo(isMobileWall, []);
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
    applyFacadeGobo(windowMaterial, mobile);
    return windowMaterial;
  }, [color, mask, gobo, mobile]);
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
  return isMobileWall() ? encodeURI("/wall stone mobile.ktx2") : "/wallstone.ktx2";
}

function useWallMaterial() {
  const gl = useThree((state) => state.gl);
  const url = useMemo(wallUrl, []);
  const map = useLoader(KTX2Loader, url, (loader) => {
    loader.detectSupport(gl);
  });
  const gobo = useGoboTexture();
  const mobile = useMemo(isMobileWall, []);
  return useMemo(() => {
    map.wrapS = RepeatWrapping;
    map.wrapT = RepeatWrapping;
    map.colorSpace = SRGBColorSpace;
    map.anisotropy = gl.capabilities.getMaxAnisotropy();
    const material = new MeshStandardMaterial({
      map,
      color: "#ffffff",
      roughness: 0.96,
      metalness: 0,
      side: DoubleSide,
    });
    // The window photo is unlit. Lift the lit wall so the stone matches that frame.
    material.color.setRGB(1.45, 1.38, 1.28);
    applyFacadeGobo(material, mobile);
    return material;
  }, [map, gl, gobo, mobile]);
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
      <mesh position={[0, WINDOW_CENTER_Y, WINDOW_Z]} material={material} raycast={() => null}>
        <planeGeometry args={[PLANE_WIDTH, PLANE_HEIGHT]} />
      </mesh>
      <mesh
        position={[0, WINDOW_CENTER_Y, WINDOW_Z + 0.08]}
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
      <Window interactive={interactive} onEnter={onEnter} />
      {children}
    </group>
  );
}

export function Facade() {
  const material = useWallMaterial();
  useFrame((_, delta) => {
    goboUniforms.uGoboTime.value += delta;
  });
  const edge = OPENING_WIDTH / 2;
  const sillTop = WINDOW_CENTER_Y - OPENING_HEIGHT / 2;
  const headerBottom = WINDOW_CENTER_Y + OPENING_HEIGHT / 2;
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
