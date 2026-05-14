"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { LIGHTING, CORE } from "../constants";

interface LightingProps {
  dissolve?: number;
}

export function Lighting({ dissolve = 0 }: LightingProps) {
  const coreGlowRef = useRef<THREE.PointLight>(null);

  useFrame(() => {
    const light = coreGlowRef.current;
    if (!light) return;

    const time = performance.now() / 1000;
    const breathe = Math.sin((time / CORE.breathePeriod) * 2 * Math.PI) * 0.5 + 0.5;
    const pulsed =
      LIGHTING.coreGlow.pulseMin +
      breathe * (LIGHTING.coreGlow.pulseMax - LIGHTING.coreGlow.pulseMin);

    light.intensity = pulsed * (1 - dissolve);
  });

  return (
    <>
      {/* 1. Core glow — pulsing point light */}
      <pointLight
        ref={coreGlowRef}
        color={LIGHTING.coreGlow.color}
        intensity={LIGHTING.coreGlow.intensity}
        position={[0, 0, 0]}
        distance={10}
        decay={2}
      />

      {/* 2. Rim directional light */}
      <directionalLight
        color={LIGHTING.rim.color}
        intensity={LIGHTING.rim.intensity * (1 - dissolve)}
        position={LIGHTING.rim.position}
      />

      {/* 3. Ambient fill */}
      <ambientLight color="#FFFFFF" intensity={0.05} />

      {/* 4. Left accent spot */}
      <spotLight
        color={LIGHTING.leftAccent.color}
        intensity={LIGHTING.leftAccent.intensity * (1 - dissolve)}
        position={LIGHTING.leftAccent.position}
        angle={LIGHTING.leftAccent.angle}
        penumbra={0.5}
        distance={15}
        decay={2}
      />

      {/* 5. Right accent spot */}
      <spotLight
        color={LIGHTING.rightAccent.color}
        intensity={LIGHTING.rightAccent.intensity * (1 - dissolve)}
        position={LIGHTING.rightAccent.position}
        angle={LIGHTING.rightAccent.angle}
        penumbra={0.5}
        distance={15}
        decay={2}
      />
    </>
  );
}
