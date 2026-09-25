"use client";

import { Suspense } from "react";
import { FRAME_STARTS, FramePlane } from "./Frames";
import { ROOMS } from "./poses";
import { Facade, RoomShell } from "./Shell";

export default function Building({
  interactive,
  onEnter,
}: {
  interactive: boolean;
  onEnter: (index: number) => void;
}) {
  return (
    <group>
      <RoomShell x={ROOMS[0].x} interactive={interactive} onEnter={() => onEnter(0)}>
        <FramePlane room={0} start={FRAME_STARTS[0]} />
      </RoomShell>
      <RoomShell x={ROOMS[1].x} interactive={interactive} onEnter={() => onEnter(1)}>
        <FramePlane room={1} start={FRAME_STARTS[1]} />
      </RoomShell>
      <RoomShell x={ROOMS[2].x} interactive={interactive} onEnter={() => onEnter(2)}>
        <FramePlane room={2} start={FRAME_STARTS[2]} />
      </RoomShell>

      <Suspense fallback={null}>
        <Facade />
      </Suspense>

      <hemisphereLight args={["#f4f8fc", "#c9b79a", 0.7]} />
      <ambientLight intensity={0.28} color="#fff4e8" />
      <directionalLight
        position={[12, 16, 10]}
        intensity={1.8}
        color="#fff6ea"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={40}
        shadow-camera-left={-20}
        shadow-camera-right={40}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
    </group>
  );
}
