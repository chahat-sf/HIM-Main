"use client";

import { Block } from "./Shell";

const WOOD = "#6b4630";
const CLOTH = "#c4b39a";
const DARK = "#2a241e";

export function LivingRoom() {
  return (
    <group name="living-room">
      <Block position={[0, 0.02, -5.2]} args={[3.4, 0.02, 2]} color="#e7dcc8" roughness={1} />
      <Block position={[0, 0.42, -5.6]} args={[2.6, 0.7, 0.9]} color={CLOTH} cast />
      <Block position={[0, 0.85, -5.95]} args={[2.6, 0.45, 0.28]} color="#b7a48c" cast />
      <Block position={[0, 0.32, -4.2]} args={[1.2, 0.32, 0.7]} color={WOOD} cast />
      <Block position={[-2.6, 0.9, -4.8]} args={[0.08, 1.7, 0.08]} color={DARK} />
      <Block position={[-2.6, 1.7, -4.8]} args={[0.42, 0.08, 0.42]} color="#f4efe6" />
      <mesh position={[2.4, 0.55, -4.2]} castShadow>
        <cylinderGeometry args={[0.28, 0.34, 1.1, 12]} />
        <meshStandardMaterial color="#3f6b45" roughness={0.8} />
      </mesh>
      <mesh position={[2.4, 1.25, -4.2]} castShadow>
        <sphereGeometry args={[0.42, 16, 12]} />
        <meshStandardMaterial color="#4e8a58" roughness={0.7} />
      </mesh>
    </group>
  );
}

export function Bedroom() {
  return (
    <group name="bedroom">
      <Block position={[0, 0.95, -6.3]} args={[2.4, 1.1, 0.12]} color="#d7c4b0" />
      <Block position={[0, 0.38, -5.5]} args={[2.2, 0.45, 1.5]} color="#efe6dc" cast />
      <Block position={[0, 0.7, -5.7]} args={[2, 0.22, 1.15]} color="#f7f1ea" cast />
      <Block position={[-1.45, 0.32, -5.5]} args={[0.42, 0.5, 0.42]} color={WOOD} cast />
      <Block position={[1.45, 0.32, -5.5]} args={[0.42, 0.5, 0.42]} color={WOOD} cast />
      <mesh position={[-1.45, 0.72, -5.5]}>
        <cylinderGeometry args={[0.08, 0.1, 0.22, 12]} />
        <meshStandardMaterial color="#f0d7a8" emissive="#e7b56a" emissiveIntensity={0.35} />
      </mesh>
      <Block position={[2.5, 0.85, -3.4]} args={[0.7, 1.5, 0.7]} color="#efe8df" />
    </group>
  );
}

export function Study() {
  return (
    <group name="study">
      <Block position={[-1.6, 0.78, -5.4]} args={[1.6, 0.08, 0.7]} color={WOOD} cast />
      <Block position={[-2.2, 0.4, -5.4]} args={[0.08, 0.78, 0.6]} color={WOOD} />
      <Block position={[-1.0, 0.4, -5.4]} args={[0.08, 0.78, 0.6]} color={WOOD} />
      <Block position={[-0.35, 0.45, -4.7]} args={[0.46, 0.9, 0.46]} color="#3d342c" cast />
      <Block position={[-0.35, 0.95, -4.7]} args={[0.5, 0.08, 0.5]} color="#2a241e" />
      <Block position={[1.8, 1.5, -7.35]} args={[1.6, 1.8, 0.12]} color="#cbbba6" />
      <Block position={[1.8, 1.15, -7.22]} args={[1.4, 0.06, 0.16]} color={WOOD} />
      <Block position={[1.8, 1.7, -7.22]} args={[1.4, 0.06, 0.16]} color={WOOD} />
      <mesh position={[-1.6, 1.05, -5.15]}>
        <cylinderGeometry args={[0.07, 0.09, 0.18, 10]} />
        <meshStandardMaterial color="#f3e2c0" emissive="#e8c27a" emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}
