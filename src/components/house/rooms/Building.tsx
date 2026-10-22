"use client";

import { Component, Suspense, type ErrorInfo, type ReactNode } from "react";
import { FramePlane } from "./Frames";
import { ROOMS } from "./poses";
import { Facade, RoomShell } from "./Shell";

/** Isolate KTX2 facade failures so FramePlane can still announce ready. */
class FacadeBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn("[house] facade failed to load", error, info.componentStack);
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

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
      {/* Frame planes: own Suspense so wall KTX2 cannot soft-lock HomeGate. */}
      <Suspense fallback={null}>
        {ROOMS.map((room, i) => (
          <RoomShell key={room.id} x={room.x} door={i} interactive={interactive} onEnter={() => onEnter(i)}>
            <FramePlane room={i} onFirstFrame={i === 0 ? onFirstFrame : undefined} />
          </RoomShell>
        ))}
      </Suspense>

      <FacadeBoundary>
        <Suspense fallback={null}>
          <Facade />
        </Suspense>
      </FacadeBoundary>

      <hemisphereLight args={["#f4f8fc", "#c9b79a", 0.7]} />
      <ambientLight intensity={0.28} color="#fff4e8" />
      <directionalLight position={[12, 16, 10]} intensity={1.8} color="#fff6ea" />
    </group>
  );
}
