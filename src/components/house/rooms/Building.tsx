"use client";

import { Suspense } from "react";
import { FramePlane } from "./Frames";
import { ROOMS } from "./poses";
import { Facade, RoomShell } from "./Shell";

export default function Building({
  interactive,
  onEnter,
  onFirstFrame,
}: {
  interactive: boolean;
  onEnter: (index: number) => void;
  onFirstFrame?: () => void;
}) {
  return (
    <group>
      <Suspense fallback={null}>
        <RoomShell x={ROOMS[0].x} door={0} interactive={interactive} onEnter={() => onEnter(0)}>
          <FramePlane room={0} onFirstFrame={onFirstFrame} />
        </RoomShell>
        <RoomShell x={ROOMS[1].x} door={1} interactive={interactive} onEnter={() => onEnter(1)}>
          <FramePlane room={1} />
        </RoomShell>
        <RoomShell x={ROOMS[2].x} door={2} interactive={interactive} onEnter={() => onEnter(2)}>
          <FramePlane room={2} />
        </RoomShell>
        <Facade />
      </Suspense>

      <hemisphereLight args={["#f4f8fc", "#c9b79a", 0.7]} />
      <ambientLight intensity={0.28} color="#fff4e8" />
      <directionalLight position={[12, 16, 10]} intensity={1.8} color="#fff6ea" />
    </group>
  );
}
