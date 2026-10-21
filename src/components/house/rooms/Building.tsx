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
        {ROOMS.map((room, i) => (
          <RoomShell key={room.id} x={room.x} door={i} interactive={interactive} onEnter={() => onEnter(i)}>
            <FramePlane room={i} onFirstFrame={i === 0 ? onFirstFrame : undefined} />
          </RoomShell>
        ))}
        <Facade />
      </Suspense>

      <hemisphereLight args={["#f4f8fc", "#c9b79a", 0.7]} />
      <ambientLight intensity={0.28} color="#fff4e8" />
      <directionalLight position={[12, 16, 10]} intensity={1.8} color="#fff6ea" />
    </group>
  );
}
