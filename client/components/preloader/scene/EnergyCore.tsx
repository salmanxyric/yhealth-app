"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CORE, COLORS } from "../constants";
import { energyFlowVertex, energyFlowFragment } from "../shaders/energy-flow";

interface EnergyCoreProps {
  dissolve?: number;
}

export function EnergyCore({ dissolve = 0 }: EnergyCoreProps) {
  const groupRef = useRef<THREE.Group>(null);
  const shaderMatRef = useRef<THREE.ShaderMaterial>(null);
  const innerMeshRef = useRef<THREE.Mesh>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uBaseColor: { value: COLORS.coreCyan.clone() },
      uEmissiveIntensity: { value: CORE.emissiveMin },
      uDissolve: { value: dissolve },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useFrame(({ clock }, delta) => {
    const group = groupRef.current;
    const shaderMat = shaderMatRef.current;
    const innerMesh = innerMeshRef.current;

    if (!group || !shaderMat || !innerMesh) return;

    const time = clock.getElapsedTime();

    // Dual-axis rotation
    group.rotation.y += (2 * Math.PI * delta) / CORE.rotationYPeriod;
    group.rotation.x += (2 * Math.PI * delta) / CORE.rotationXPeriod;

    // Breathing: 3-second sine cycle mapped to [breatheMin, breatheMax]
    const breathe =
      (Math.sin((time / CORE.breathePeriod) * 2 * Math.PI) * 0.5 + 0.5);
    const scale =
      CORE.breatheMin + breathe * (CORE.breatheMax - CORE.breatheMin);
    group.scale.setScalar(scale);

    // Emissive oscillation synced with breathing
    const emissive =
      CORE.emissiveMin + breathe * (CORE.emissiveMax - CORE.emissiveMin);

    // Inner glow intensity pulses with breathing
    const innerMat = innerMesh.material as THREE.MeshStandardMaterial;
    innerMat.emissiveIntensity = 0.8 + breathe * 0.2;

    // Update shader uniforms
    shaderMat.uniforms.uTime.value = time;
    shaderMat.uniforms.uEmissiveIntensity.value = emissive;
    shaderMat.uniforms.uDissolve.value = dissolve;
  });

  return (
    <group ref={groupRef}>
      {/* Wireframe icosahedron with custom energy-flow shader */}
      <mesh>
        <icosahedronGeometry args={[CORE.radius, CORE.detail]} />
        <shaderMaterial
          ref={shaderMatRef}
          vertexShader={energyFlowVertex}
          fragmentShader={energyFlowFragment}
          uniforms={uniforms}
          wireframe
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Inner glow sphere */}
      <mesh ref={innerMeshRef}>
        <sphereGeometry args={[CORE.innerSphereRadius, 32, 32]} />
        <meshStandardMaterial
          color={COLORS.gold}
          emissive={COLORS.gold}
          emissiveIntensity={CORE.innerEmissiveIntensity}
          transparent
          opacity={CORE.innerSphereOpacity}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
