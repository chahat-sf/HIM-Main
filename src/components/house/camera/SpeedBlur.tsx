"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useRef } from "react";
import { Vector2, Vector3, type Camera, type WebGLRenderer } from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";

// A window switch covers 9.2 units in 0.5s with power4.inOut, peaking near 74 units/s.
// Enter and exit cover about 4 units in 2.6s with power2.inOut, peaking near 3.1 units/s.
const WINDOW_PEAK_SPEED = 74;
const ENTER_PEAK_SPEED = 3.1;
const STREAK_GAIN = 0.02 / WINDOW_PEAK_SPEED;
const ZOOM_GAIN = 0.08 / ENTER_PEAK_SPEED;
const MAX_STREAK = 0.024;
const MAX_ZOOM = 0.09;
const SMOOTH = 18;

const SpeedBlurShader = {
  name: "SpeedBlur",
  uniforms: {
    tDiffuse: { value: null },
    uStreak: { value: new Vector2() },
    uZoom: { value: 0 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform vec2 uStreak;
    uniform float uZoom;
    varying vec2 vUv;

    void main() {
      vec2 offset = uStreak + (vUv - 0.5) * uZoom;
      if (dot(offset, offset) < 0.0000004) {
        gl_FragColor = texture2D(tDiffuse, vUv);
        return;
      }

      vec4 color = vec4(0.0);
      float total = 0.0;
      for (int i = 0; i < 9; i++) {
        float t = float(i) / 8.0 * 2.0 - 1.0;
        float w = exp(-2.0 * t * t);
        color += texture2D(tDiffuse, vUv + offset * t) * w;
        total += w;
      }
      gl_FragColor = color / total;
    }
  `,
};

type BlurUniforms = {
  uStreak: { value: Vector2 };
  uZoom: { value: number };
};

type ComposerRig = {
  composer: EffectComposer;
  uniforms: BlurUniforms;
};

function sampleCount(gl: WebGLRenderer) {
  if (!gl.capabilities.isWebGL2) return 0;
  return Math.min(4, gl.capabilities.maxSamples);
}

export default function SpeedBlur() {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  const rigRef = useRef<ComposerRig | null>(null);
  const reduceMotion = useRef(false);
  const primed = useRef(false);
  const previous = useRef(new Vector3());
  const velocity = useRef(new Vector3());
  const forward = useRef(new Vector3());
  const right = useRef(new Vector3());
  const up = useRef(new Vector3());
  const streak = useRef(new Vector2());
  const streakTarget = useRef(new Vector2());
  const zoom = useRef(0);

  useLayoutEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      reduceMotion.current = media.matches;
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useLayoutEffect(() => {
    const composer = new EffectComposer(gl);
    const samples = sampleCount(gl);
    composer.renderTarget1.samples = samples;
    composer.renderTarget2.samples = samples;
    composer.addPass(new RenderPass(scene, camera));
    const pass = new ShaderPass(SpeedBlurShader);
    composer.addPass(pass);
    composer.addPass(new OutputPass());
    composer.setPixelRatio(gl.getPixelRatio());
    composer.setSize(size.width, size.height);
    rigRef.current = { composer, uniforms: pass.uniforms as BlurUniforms };
    primed.current = false;

    return () => {
      for (const pass of composer.passes) {
        const disposable = pass as { dispose?: () => void };
        disposable.dispose?.();
      }
      composer.dispose();
      rigRef.current = null;
    };
  }, [gl, scene, camera, size.width, size.height]);

  useFrame((state, delta) => {
    const rig = rigRef.current;
    if (!rig) {
      state.gl.render(state.scene, state.camera);
      return;
    }

    const view = state.camera;
    applyBlur(view, delta, {
      reduceMotion,
      primed,
      previous,
      velocity,
      forward,
      right,
      up,
      streak,
      streakTarget,
      zoom,
    });
    rig.uniforms.uStreak.value.copy(streak.current);
    rig.uniforms.uZoom.value = zoom.current;
    rig.composer.render();
  }, 1);

  return null;
}

function applyBlur(
  camera: Camera,
  delta: number,
  refs: {
    reduceMotion: { current: boolean };
    primed: { current: boolean };
    previous: { current: Vector3 };
    velocity: { current: Vector3 };
    forward: { current: Vector3 };
    right: { current: Vector3 };
    up: { current: Vector3 };
    streak: { current: Vector2 };
    streakTarget: { current: Vector2 };
    zoom: { current: number };
  },
) {
  if (refs.reduceMotion.current || !refs.primed.current || delta <= 0 || delta > 0.05) {
    refs.previous.current.copy(camera.position);
    refs.primed.current = true;
    refs.streak.current.set(0, 0);
    refs.zoom.current = 0;
    return;
  }

  refs.velocity.current.copy(camera.position).sub(refs.previous.current).divideScalar(delta);
  refs.previous.current.copy(camera.position);
  camera.updateMatrixWorld();
  camera.getWorldDirection(refs.forward.current);
  refs.right.current.setFromMatrixColumn(camera.matrixWorld, 0).normalize();
  refs.up.current.setFromMatrixColumn(camera.matrixWorld, 1).normalize();

  const lateral = refs.velocity.current.dot(refs.right.current);
  const vertical = refs.velocity.current.dot(refs.up.current);
  const along = refs.velocity.current.dot(refs.forward.current);
  refs.streakTarget.current.set(lateral * STREAK_GAIN, vertical * STREAK_GAIN);
  const length = refs.streakTarget.current.length();
  if (length > MAX_STREAK) refs.streakTarget.current.multiplyScalar(MAX_STREAK / length);
  const zoomTarget = Math.min(Math.abs(along) * ZOOM_GAIN, MAX_ZOOM);

  const blend = 1 - Math.exp(-delta * SMOOTH);
  refs.streak.current.lerp(refs.streakTarget.current, blend);
  refs.zoom.current += (zoomTarget - refs.zoom.current) * blend;
}
