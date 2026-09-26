"use client";

import { useGSAP } from "@gsap/react";
import { useFrame } from "@react-three/fiber";
import gsap from "gsap";
import { useEffect, useRef } from "react";
import { PerspectiveCamera } from "three";
import { INITIAL_POSE, ROOMS, roomPoses, type Pose } from "../rooms/poses";

gsap.registerPlugin(useGSAP);

export type CameraCommand =
  | { token: number; kind: "enter"; index: number }
  | { token: number; kind: "exit"; index: number }
  | { token: number; kind: "next"; from: number; to: number };

function applyPose(target: Pose, pose: Pose) {
  target.px = pose.px;
  target.py = pose.py;
  target.pz = pose.pz;
  target.tx = pose.tx;
  target.ty = pose.ty;
  target.tz = pose.tz;
  target.fov = pose.fov;
}

function lerpPose(target: Pose, from: Pose, to: Pose, amount: number) {
  target.px = from.px + (to.px - from.px) * amount;
  target.py = from.py + (to.py - from.py) * amount;
  target.pz = from.pz + (to.pz - from.pz) * amount;
  target.tx = from.tx + (to.tx - from.tx) * amount;
  target.ty = from.ty + (to.ty - from.ty) * amount;
  target.tz = from.tz + (to.tz - from.tz) * amount;
  target.fov = from.fov + (to.fov - from.fov) * amount;
}

function poseSpan(from: Pose, to: Pose) {
  const position = Math.hypot(to.px - from.px, to.py - from.py, to.pz - from.pz);
  const aim = Math.hypot(to.tx - from.tx, to.ty - from.ty, to.tz - from.tz);
  return position + aim;
}

function samplePath(target: Pose, start: Pose, through: Pose, end: Pose, amount: number) {
  const first = poseSpan(start, through);
  const split = first / (first + poseSpan(through, end));
  if (amount <= split) {
    lerpPose(target, start, through, amount / split);
    return;
  }
  lerpPose(target, through, end, (amount - split) / (1 - split));
}

function bow(pose: Pose, amount: number, rise: number, side: number) {
  const lift = Math.sin(Math.PI * amount);
  pose.py += lift * rise;
  pose.px += lift * side;
  pose.ty += lift * rise * 0.35;
}

function wave(time: number, speed: number, phase: number) {
  return Math.sin(time * speed + phase) * 0.65 + Math.sin(time * speed * 0.57 + phase * 1.7) * 0.35;
}

function sway(time: number) {
  return {
    x: wave(time, 0.9, 0.4) * 0.06,
    y: wave(time, 0.7, 1.2) * 0.04,
    z: wave(time, 0.55, 2.8) * 0.03,
    aimX: wave(time, 0.8, 0.9) * 0.05,
    aimY: wave(time, 0.62, 1.8) * 0.04,
    roll: wave(time, 0.74, 2.4) * (Math.PI / 180),
  };
}

const PARALLAX_X = 0.28;
const PARALLAX_Y = 0.12;
const PARALLAX_AIM_X = 0.08;
const PARALLAX_AIM_Y = 0.035;

export default function CameraController({
  command,
  onComplete,
  parallax = false,
}: {
  command: CameraCommand | null;
  onComplete: () => void;
  parallax?: boolean;
}) {
  const pose = useRef<Pose>({ ...INITIAL_POSE });
  const onCompleteRef = useRef(onComplete);
  const moving = useRef(false);
  const hover = useRef(1);
  const reduceMotion = useRef(false);
  const finePointer = useRef(false);
  const pointer = useRef({ x: 0, y: 0 });
  const eased = useRef({ x: 0, y: 0 });
  const parallaxOn = useRef(parallax);
  parallaxOn.current = parallax;

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    reduceMotion.current = reduce;
    if (reduce) hover.current = 0;
    const fine = window.matchMedia("(pointer: fine)").matches;
    finePointer.current = fine && !reduce;
    if (!finePointer.current) return;
    function onMove(event: PointerEvent) {
      if (event.pointerType === "touch") return;
      pointer.current.x = Math.min(1, Math.max(-1, (event.clientX / window.innerWidth) * 2 - 1));
      pointer.current.y = Math.min(1, Math.max(-1, (event.clientY / window.innerHeight) * 2 - 1));
    }
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useGSAP(
    () => {
      if (!command) return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      reduceMotion.current = reduce;
      moving.current = command.kind === "enter" || command.kind === "exit";
      const duration = reduce ? 0.01 : 1.45;
      const timeline = gsap.timeline({
        defaults: { ease: "power2.inOut", duration, immediateRender: false },
        onComplete: () => {
          moving.current = false;
          onCompleteRef.current();
        },
      });

      if (command.kind === "enter" || command.kind === "exit") {
        const poses = roomPoses(ROOMS[command.index].x);
        const start = command.kind === "enter" ? poses.exterior : poses.interior;
        const end = command.kind === "enter" ? poses.interior : poses.exterior;
        const progress = { t: 0 };
        applyPose(pose.current, start);
        timeline.to(progress, {
          t: 1,
          duration: reduce ? 0.01 : 2.6,
          onUpdate: () => {
            samplePath(pose.current, start, poses.window, end, progress.t);
            if (!reduce) bow(pose.current, progress.t, 0.28, 0.16);
          },
        });
        return;
      }

      const from = roomPoses(ROOMS[command.from].x).exterior;
      const to = roomPoses(ROOMS[command.to].x).exterior;
      const progress = { t: 0 };
      applyPose(pose.current, from);
      timeline.to(progress, {
        t: 1,
        duration: reduce ? 0.01 : 0.5,
        ease: "power4.inOut",
        onUpdate: () => {
          lerpPose(pose.current, from, to, progress.t);
        },
      });
    },
    { dependencies: [command?.token], revertOnUpdate: true },
  );

  useFrame(({ camera }, delta) => {
    const current = pose.current;
    const goal = moving.current || reduceMotion.current ? 0 : 1;
    hover.current += (goal - hover.current) * Math.min(1, delta * 3);
    const weight = hover.current;
    const hand = sway(performance.now() / 1000);
    const allow = parallaxOn.current && finePointer.current && !reduceMotion.current;
    const lead = Math.min(1, delta * 6);
    eased.current.x += ((allow ? pointer.current.x : 0) - eased.current.x) * lead;
    eased.current.y += ((allow ? -pointer.current.y : 0) - eased.current.y) * lead;
    const shiftX = eased.current.x;
    const shiftY = eased.current.y;
    camera.position.set(
      current.px + hand.x * weight + shiftX * PARALLAX_X,
      current.py + hand.y * weight + shiftY * PARALLAX_Y,
      current.pz + hand.z * weight,
    );
    camera.lookAt(
      current.tx + hand.aimX * weight + shiftX * PARALLAX_AIM_X,
      current.ty + hand.aimY * weight + shiftY * PARALLAX_AIM_Y,
      current.tz,
    );
    camera.rotateZ(hand.roll * weight);
    if (camera instanceof PerspectiveCamera && camera.fov !== current.fov) {
      camera.fov = current.fov;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
