"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AMBIENT_PARTICLES, COLORS } from "../constants";

interface AmbientParticlesProps {
  dissolve?: number;
}

export function AmbientParticles({ dissolve = 0 }: AmbientParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, driftDirections } = useMemo(() => {
    const { count, radiusMin, radiusMax } = AMBIENT_PARTICLES;
    const positions = new Float32Array(count * 3);
    const driftDirections: THREE.Vector3[] = [];

    for (let i = 0; i < count; i++) {
      const r = radiusMin + Math.random() * (radiusMax - radiusMin);
      const theta = Math.acos(2 * Math.random() - 1);
      const phi = Math.random() * 2 * Math.PI;

      positions[i * 3] = r * Math.sin(theta) * Math.cos(phi);
      positions[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi);
      positions[i * 3 + 2] = r * Math.cos(theta);

      driftDirections.push(
        new THREE.Vector3(
          Math.random() * 2 - 1,
          Math.random() * 2 - 1,
          Math.random() * 2 - 1
        ).normalize()
      );
    }

    return { positions, driftDirections };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame(() => {
    const pts = pointsRef.current;
    if (!pts) return;

    const posAttr = pts.geometry.getAttribute("position") as THREE.BufferAttribute;
    const { count, driftSpeed } = AMBIENT_PARTICLES;

    for (let i = 0; i < count; i++) {
      const dir = driftDirections[i];
      positions[i * 3] += dir.x * driftSpeed;
      positions[i * 3 + 1] += dir.y * driftSpeed;
      positions[i * 3 + 2] += dir.z * driftSpeed;
    }

    posAttr.needsUpdate = true;
  });

  const opacity =
    ((AMBIENT_PARTICLES.opacityMax + AMBIENT_PARTICLES.opacityMin) / 2) *
    (1 - dissolve);

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={1}
        color={COLORS.paleBlue}
        transparent
        opacity={opacity}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
