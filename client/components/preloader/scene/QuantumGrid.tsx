"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { GRID, COLORS } from "../constants";
import { gridRippleVertex, gridRippleFragment } from "../shaders/grid-ripple";

interface QuantumGridProps {
  dissolve?: number;
}

export function QuantumGrid({ dissolve = 0 }: QuantumGridProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: COLORS.coreCyan.clone() },
      uBaseOpacity: { value: GRID.lineOpacityBase },
      uRippleOpacity: { value: GRID.lineOpacityRipple },
      uRippleInterval: { value: GRID.rippleInterval },
      uRippleSpeed: { value: GRID.rippleSpeed },
      uFadeRadius: { value: GRID.fadeRadius },
      uDissolve: { value: dissolve },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useFrame(() => {
    const mat = matRef.current;
    if (!mat) return;
    mat.uniforms.uTime.value = performance.now() / 1000;
    mat.uniforms.uDissolve.value = dissolve;
  });

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, GRID.yPosition, 0]}
    >
      <planeGeometry args={[GRID.size, GRID.size, GRID.divisions, GRID.divisions]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={gridRippleVertex}
        fragmentShader={gridRippleFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
