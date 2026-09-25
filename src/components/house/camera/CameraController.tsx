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

export default function CameraController({
  command,
  onComplete,
}: {
  command: CameraCommand | null;
  onComplete: () => void;
}) {
  const pose = useRef<Pose>({ ...INITIAL_POSE });
  const onCompleteRef = useRef(onComplete);
  const moving = useRef(false);
  const hover = useRef(1);
  const reduceMotion = useRef(false);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    reduceMotion.current = reduce;
    if (reduce) hover.current = 0;
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
    camera.position.set(
      current.px + hand.x * weight,
      current.py + hand.y * weight,
      current.pz + hand.z * weight,
    );
    camera.lookAt(current.tx + hand.aimX * weight, current.ty + hand.aimY * weight, current.tz);
    camera.rotateZ(hand.roll * weight);
    if (camera instanceof PerspectiveCamera && camera.fov !== current.fov) {
      camera.fov = current.fov;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
