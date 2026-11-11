"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, PerspectiveCamera } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

export default function HeroScene({ paused, pointer }: { paused: boolean; pointer: { x: number; y: number } }) {
  return <Canvas dpr={[1, 1.5]} fallback={<StaticScene />} gl={{ antialias: true, powerPreference: "low-power" }} className="!absolute inset-0"><PerspectiveCamera makeDefault position={[0, 0, 6]} fov={34} /><ambientLight intensity={2.2} /><directionalLight position={[3, 4, 5]} intensity={3} /><Float speed={1.2} rotationIntensity={.18} floatIntensity={.45}><Rings paused={paused} pointer={pointer} /></Float></Canvas>;
}

function Rings({ paused, pointer }: { paused: boolean; pointer: { x: number; y: number } }) {
  const group = useRef<THREE.Group>(null);
  useFrame((state, delta) => { if (!group.current || paused) return; group.current.rotation.x += delta * .08; group.current.rotation.z += delta * .12; group.current.rotation.y += (pointer.x * .16 - group.current.rotation.y) * .04; group.current.rotation.x += (pointer.y * .08 - group.current.rotation.x) * .02; state.invalidate(); });
  return <group ref={group} rotation={[.18, -.2, .22]}><mesh rotation={[0, .35, .58]}><torusGeometry args={[1.48, .16, 10, 48]} /><meshStandardMaterial color="#c9bde0" roughness={.5} metalness={.05} /></mesh><mesh rotation={[.4, 0, -.62]}><torusGeometry args={[1.48, .16, 10, 48]} /><meshStandardMaterial color="#8fa77a" roughness={.5} metalness={.05} /></mesh><mesh position={[0, 0, .02]}><circleGeometry args={[.68, 32]} /><meshStandardMaterial color="#f6f3ee" roughness={1} /></mesh><mesh position={[0, 0, .12]}><planeGeometry args={[1.05, .9]} /><meshBasicMaterial color="#3d2f45" transparent opacity={0} /></mesh></group>;
}

export function StaticScene() { return <div className="absolute inset-0 flex items-center justify-center"><div className="relative h-64 w-64 sm:h-80 sm:w-80"><div className="absolute inset-8 rotate-[28deg] rounded-full border-[18px] border-lavender shadow-float" /><div className="absolute inset-8 -rotate-[38deg] rounded-full border-[18px] border-sage shadow-float" /><div className="absolute inset-[34%] flex items-center justify-center rounded-full bg-cream font-serif text-5xl italic text-plum">t.</div></div></div>; }
