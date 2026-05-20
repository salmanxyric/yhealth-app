"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { DOMAINS, useCinematicStore, type SceneMode } from "./CinematicContext";

// ── Orb positions for each scene mode ────────────────────────────────────────

const PHI = (1 + Math.sqrt(5)) / 2;

function goldenSpiralPosition(index: number, count: number, radius: number): [number, number, number] {
  const angle = index * 2 * Math.PI / PHI;
  const r = radius * Math.sqrt(index / count);
  return [r * Math.cos(angle), r * Math.sin(angle), (index - count / 2) * 0.3];
}

function getOrbTargets(mode: SceneMode): Array<[number, number, number]> {
  switch (mode) {
    case "constellation":
      return DOMAINS.map((_, i) => goldenSpiralPosition(i, DOMAINS.length, 4));
    case "contracting":
      return DOMAINS.map(() => [0, 0, 0] as [number, number, number]);
    case "ambient":
      return DOMAINS.map((_, i) => {
        const angle = (i / DOMAINS.length) * Math.PI * 2;
        return [Math.cos(angle) * 6, Math.sin(angle) * 4, -5] as [number, number, number];
      });
    case "timeline":
      return DOMAINS.map((_, i) => [(i - 4.5) * 1.5, Math.sin(i * 0.6) * 1.5, -2] as [number, number, number]);
    case "fadeout":
      return DOMAINS.map((_, i) => {
        const angle = (i / DOMAINS.length) * Math.PI * 2;
        return [Math.cos(angle) * 8, Math.sin(angle) * 5, -8] as [number, number, number];
      });
  }
}

// ── Single Orb ───────────────────────────────────────────────────────────────

function Orb({ index, color }: { index: number; color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const store = useCinematicStore();
  const targetPos = useRef(new THREE.Vector3());
  const threeColor = useMemo(() => new THREE.Color(color), [color]);

  useFrame(() => {
    if (!meshRef.current) return;
    const state = store.getState();
    const targets = getOrbTargets(state.sceneMode);
    const [tx, ty, tz] = targets[index];
    targetPos.current.set(tx, ty, tz);

    meshRef.current.position.lerp(targetPos.current, 0.04);

    const pulse = 0.5 + Math.sin(Date.now() * 0.001 + index * 0.5) * 0.3;
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = state.sceneMode === "fadeout" ? pulse * 0.3 : pulse;

    if (lightRef.current) {
      lightRef.current.position.copy(meshRef.current.position);
      lightRef.current.intensity = state.sceneMode === "fadeout" ? 0.1 : 0.4;
    }
  });

  return (
    <>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial
          color={threeColor}
          emissive={threeColor}
          emissiveIntensity={0.5}
          transparent
          opacity={0.9}
        />
      </mesh>
      <pointLight ref={lightRef} color={color} intensity={0.4} distance={3} />
    </>
  );
}

// ── Particle Field (instanced) ───────────────────────────────────────────────

const PARTICLE_COUNT = 2000;
const tempObject = new THREE.Object3D();

// Pre-computed at module load time (outside render) so Math.random() is not
// called during component rendering, satisfying the react-hooks/purity rule.
const PARTICLE_POSITIONS = (() => {
  const arr = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    arr[i * 3]     = (Math.random() - 0.5) * 20;
    arr[i * 3 + 1] = (Math.random() - 0.5) * 15;
    arr[i * 3 + 2] = (Math.random() - 0.5) * 10;
  }
  return arr;
})();

// Neural connection pairs also pre-computed at module load time.
const NEURAL_PAIRS = (() => {
  const pairs: [number, number][] = [];
  for (let i = 0; i < DOMAINS.length; i++) {
    for (let j = i + 1; j < DOMAINS.length; j++) {
      if (Math.random() > 0.5) pairs.push([i, j]);
    }
  }
  return pairs;
})();

function ParticleField() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const store = useCinematicStore();

  const positions = PARTICLE_POSITIONS;

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const state = store.getState();
    const t = clock.getElapsedTime();

    let visibleCount = PARTICLE_COUNT;
    if (state.sceneMode === "ambient") visibleCount = 200;
    if (state.sceneMode === "timeline") visibleCount = 800;
    if (state.sceneMode === "fadeout") visibleCount = 100;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const x = positions[i * 3]     + Math.sin(t * 0.2 + i) * 0.02;
      const y = positions[i * 3 + 1] + Math.cos(t * 0.15 + i) * 0.02;
      const z = positions[i * 3 + 2];

      tempObject.position.set(x, y, z);
      tempObject.scale.setScalar(i < visibleCount ? 0.015 : 0);
      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial color="#F5F5F7" transparent opacity={0.3} />
    </instancedMesh>
  );
}

// ── Neural Connections ───────────────────────────────────────────────────────

function NeuralConnections() {
  const lineRef = useRef<THREE.LineSegments>(null);
  const store = useCinematicStore();

  const geometry = useMemo(() => {
    const positions = new Float32Array(NEURAL_PAIRS.length * 6);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  useFrame(() => {
    if (!lineRef.current) return;
    const state = store.getState();
    const targets = getOrbTargets(state.sceneMode);
    const posAttr = geometry.getAttribute("position") as THREE.BufferAttribute;

    for (let c = 0; c < NEURAL_PAIRS.length; c++) {
      const [i, j] = NEURAL_PAIRS[c];
      const [ax, ay, az] = targets[i];
      const [bx, by, bz] = targets[j];
      posAttr.setXYZ(c * 2,     ax, ay, az);
      posAttr.setXYZ(c * 2 + 1, bx, by, bz);
    }
    posAttr.needsUpdate = true;

    const mat = lineRef.current.material as THREE.LineBasicMaterial;
    const showConnections = state.sceneMode === "constellation" || state.sceneMode === "timeline";
    mat.opacity = showConnections ? 0.3 : 0;
  });

  return (
    <lineSegments ref={lineRef} geometry={geometry}>
      <lineBasicMaterial color="#D4A574" transparent opacity={0.3} />
    </lineSegments>
  );
}

// ── Camera Rig ───────────────────────────────────────────────────────────────

function CameraRig() {
  const store = useCinematicStore();
  const target = useRef(new THREE.Vector3(0, 0, 5));

  useFrame(({ camera }) => {
    const state = store.getState();
    switch (state.sceneMode) {
      case "constellation":
        target.current.set(0, 0, 5 - state.progress * 10);
        break;
      case "contracting":
        target.current.set(0, 0, 3);
        break;
      case "ambient":
        target.current.set(0, 0, 8);
        break;
      case "timeline":
        target.current.set((state.progress - 0.7) * 30, 2, 4);
        break;
      case "fadeout":
        target.current.set(0, 0, 10);
        break;
    }
    camera.position.lerp(target.current, 0.03);
    camera.lookAt(0, 0, 0);
  });

  return null;
}

// ── Main Scene ───────────────────────────────────────────────────────────────

export function ConstellationScene() {
  return (
    <Canvas
      frameloop="always"
      camera={{ position: [0, 0, 5], fov: 60 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.1} />
      <CameraRig />
      <ParticleField />
      {DOMAINS.map((domain, i) => (
        <Orb key={domain.id} index={i} color={domain.color} />
      ))}
      <NeuralConnections />
      <EffectComposer>
        <Bloom luminanceThreshold={0.6} luminanceSmoothing={0.9} intensity={0.8} />
        <Vignette offset={0.3} darkness={0.7} />
      </EffectComposer>
    </Canvas>
  );
}
