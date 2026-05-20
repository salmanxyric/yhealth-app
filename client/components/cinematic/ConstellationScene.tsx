"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { DOMAINS, useCinematicStore, type SceneMode } from "./CinematicContext";

const PHI = (1 + Math.sqrt(5)) / 2;

function goldenSpiralPosition(index: number, count: number, radius: number): [number, number, number] {
  const angle = index * 2 * Math.PI / PHI;
  const r = radius * Math.sqrt(index / count);
  return [r * Math.cos(angle), r * Math.sin(angle), (index - count / 2) * 0.25];
}

function getOrbTargets(mode: SceneMode): Array<[number, number, number]> {
  switch (mode) {
    case "constellation":
      return DOMAINS.map((_, i) => goldenSpiralPosition(i, DOMAINS.length, 3.5));
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

function Orb({ index, color }: { index: number; color: string }) {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const outerRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const store = useCinematicStore();
  const targetPos = useRef(new THREE.Vector3());
  const threeColor = useMemo(() => new THREE.Color(color), [color]);

  useFrame(() => {
    if (!groupRef.current || !coreRef.current) return;
    const state = store.getState();
    const targets = getOrbTargets(state.sceneMode);
    const [tx, ty, tz] = targets[index];
    targetPos.current.set(tx, ty, tz);
    groupRef.current.position.lerp(targetPos.current, 0.04);

    const t = Date.now() * 0.001;
    const pulse = 0.7 + Math.sin(t + index * 0.7) * 0.3;
    const isFading = state.sceneMode === "fadeout";

    const coreMat = coreRef.current.material as THREE.MeshStandardMaterial;
    coreMat.emissiveIntensity = isFading ? pulse * 0.4 : pulse * 2.5;

    if (glowRef.current) {
      const glowMat = glowRef.current.material as THREE.MeshBasicMaterial;
      glowMat.opacity = isFading ? 0.02 : 0.15 + Math.sin(t * 0.6 + index) * 0.06;
      const breathe = 1 + Math.sin(t * 0.5 + index * 0.3) * 0.1;
      glowRef.current.scale.setScalar(breathe);
    }

    if (outerRef.current) {
      const outerMat = outerRef.current.material as THREE.MeshBasicMaterial;
      outerMat.opacity = isFading ? 0.005 : 0.05 + Math.sin(t * 0.3 + index * 0.5) * 0.02;
      const outerBreathe = 1 + Math.sin(t * 0.3 + index * 0.4) * 0.06;
      outerRef.current.scale.setScalar(outerBreathe);
    }

    if (lightRef.current) {
      lightRef.current.position.copy(groupRef.current.position);
      lightRef.current.intensity = isFading ? 0.15 : 0.6 + Math.sin(t + index) * 0.25;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial
          color={threeColor}
          emissive={threeColor}
          emissiveIntensity={2.5}
          transparent
          opacity={0.95}
          roughness={0.1}
          metalness={0.15}
        />
      </mesh>
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.65, 24, 24]} />
        <meshBasicMaterial
          color={threeColor}
          transparent
          opacity={0.15}
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh ref={outerRef}>
        <sphereGeometry args={[1.4, 16, 16]} />
        <meshBasicMaterial
          color={threeColor}
          transparent
          opacity={0.05}
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <pointLight ref={lightRef} color={color} intensity={0.6} distance={8} decay={2} />
    </group>
  );
}

// ─── Spiral Galaxy Particles ────────────────────────────────────────
const SPIRAL_COUNT = 1000;
const AMBIENT_COUNT = 400;
const tempObj = new THREE.Object3D();

const SPIRAL_DATA = (() => {
  const positions = new Float32Array(SPIRAL_COUNT * 3);
  const sizes = new Float32Array(SPIRAL_COUNT);
  const speeds = new Float32Array(SPIRAL_COUNT);
  const numArms = 2;
  const perArm = SPIRAL_COUNT / numArms;

  for (let arm = 0; arm < numArms; arm++) {
    const armOffset = arm * Math.PI;
    for (let p = 0; p < perArm; p++) {
      const idx = arm * perArm + p;
      const t = p / perArm;
      const theta = armOffset + t * Math.PI * 3.8;
      const r = 0.2 + t * 5.5;

      const spreadWidth = 0.1 + t * 0.7;
      const spread = (Math.random() * 2 - 1) * spreadWidth;
      const perpAngle = theta + Math.PI / 2;

      positions[idx * 3] = r * Math.cos(theta) + spread * Math.cos(perpAngle);
      positions[idx * 3 + 1] = r * Math.sin(theta) + spread * Math.sin(perpAngle);
      positions[idx * 3 + 2] = (Math.random() - 0.5) * 0.35;

      sizes[idx] = Math.random() < 0.06
        ? 0.04 + Math.random() * 0.05
        : 0.008 + Math.random() * 0.018;
      speeds[idx] = 0.04 + Math.random() * 0.12;
    }
  }
  return { positions, sizes, speeds };
})();

const AMBIENT_DATA = (() => {
  const positions = new Float32Array(AMBIENT_COUNT * 3);
  const sizes = new Float32Array(AMBIENT_COUNT);
  const speeds = new Float32Array(AMBIENT_COUNT);

  for (let i = 0; i < AMBIENT_COUNT; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = Math.pow(Math.random(), 0.5) * 14;
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi) - 2;
    sizes[i] = Math.random() < 0.03
      ? 0.025 + Math.random() * 0.02
      : 0.003 + Math.random() * 0.007;
    speeds[i] = 0.05 + Math.random() * 0.15;
  }
  return { positions, sizes, speeds };
})();

function SpiralParticles() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const store = useCinematicStore();

  useFrame(({ clock }) => {
    if (!meshRef.current || !groupRef.current) return;
    const t = clock.getElapsedTime();
    const state = store.getState();

    groupRef.current.rotation.z = t * 0.025;

    let visibleRatio = 1;
    if (state.sceneMode === "ambient") visibleRatio = 0.15;
    if (state.sceneMode === "timeline") visibleRatio = 0.5;
    if (state.sceneMode === "fadeout") visibleRatio = 0.05;
    const visibleCount = Math.floor(SPIRAL_COUNT * visibleRatio);

    for (let i = 0; i < SPIRAL_COUNT; i++) {
      const speed = SPIRAL_DATA.speeds[i];
      const x = SPIRAL_DATA.positions[i * 3] + Math.sin(t * speed * 0.3 + i * 0.08) * 0.04;
      const y = SPIRAL_DATA.positions[i * 3 + 1] + Math.cos(t * speed * 0.2 + i * 0.08) * 0.04;
      const z = SPIRAL_DATA.positions[i * 3 + 2] + Math.sin(t * speed * 0.1 + i * 0.15) * 0.015;

      tempObj.position.set(x, y, z);
      tempObj.scale.setScalar(i < visibleCount ? SPIRAL_DATA.sizes[i] : 0);
      tempObj.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObj.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, SPIRAL_COUNT]}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial
          color="#D4A060"
          transparent
          opacity={0.75}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </instancedMesh>
    </group>
  );
}

function AmbientStars() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const store = useCinematicStore();

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    const state = store.getState();

    let visibleRatio = 1;
    if (state.sceneMode === "ambient") visibleRatio = 0.1;
    if (state.sceneMode === "timeline") visibleRatio = 0.3;
    if (state.sceneMode === "fadeout") visibleRatio = 0.03;
    const visibleCount = Math.floor(AMBIENT_COUNT * visibleRatio);

    for (let i = 0; i < AMBIENT_COUNT; i++) {
      const speed = AMBIENT_DATA.speeds[i];
      const x = AMBIENT_DATA.positions[i * 3] + Math.sin(t * speed * 0.2 + i * 0.1) * 0.02;
      const y = AMBIENT_DATA.positions[i * 3 + 1] + Math.cos(t * speed * 0.15 + i * 0.1) * 0.02;
      const z = AMBIENT_DATA.positions[i * 3 + 2] + Math.sin(t * speed * 0.06 + i * 0.2) * 0.01;

      tempObj.position.set(x, y, z);
      tempObj.scale.setScalar(i < visibleCount ? AMBIENT_DATA.sizes[i] : 0);
      tempObj.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObj.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, AMBIENT_COUNT]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial
        color="#C8C8D8"
        transparent
        opacity={0.5}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
  );
}

// ─── Central Glow Core ──────────────────────────────────────────────
function CentralGlow() {
  const coreRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const store = useCinematicStore();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const state = store.getState();
    const isVisible = state.sceneMode === "constellation" || state.sceneMode === "contracting";

    if (coreRef.current) {
      const mat = coreRef.current.material as THREE.MeshBasicMaterial;
      const targetOpacity = isVisible ? 0.6 + Math.sin(t * 0.4) * 0.15 : 0.05;
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity, 0.03);
    }
    if (haloRef.current) {
      const mat = haloRef.current.material as THREE.MeshBasicMaterial;
      const targetOpacity = isVisible ? 0.08 + Math.sin(t * 0.3) * 0.03 : 0.01;
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity, 0.03);
      haloRef.current.scale.setScalar(1 + Math.sin(t * 0.25) * 0.08);
    }
  });

  return (
    <group>
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.5, 24, 24]} />
        <meshBasicMaterial
          color="#D4A060"
          transparent
          opacity={0.6}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh ref={haloRef}>
        <sphereGeometry args={[2.0, 16, 16]} />
        <meshBasicMaterial
          color="#B8864A"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

// ─── Neural Connections ─────────────────────────────────────────────
const NEURAL_PAIRS = (() => {
  const pairs: [number, number][] = [];
  for (let i = 0; i < DOMAINS.length; i++) {
    for (let j = i + 1; j < DOMAINS.length; j++) {
      if (Math.random() > 0.6) pairs.push([i, j]);
    }
  }
  return pairs;
})();

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
      posAttr.setXYZ(c * 2, ax, ay, az);
      posAttr.setXYZ(c * 2 + 1, bx, by, bz);
    }
    posAttr.needsUpdate = true;

    const mat = lineRef.current.material as THREE.LineBasicMaterial;
    const show = state.sceneMode === "constellation" || state.sceneMode === "timeline";
    mat.opacity = show ? 0.1 : 0;
  });

  return (
    <lineSegments ref={lineRef} geometry={geometry}>
      <lineBasicMaterial
        color="#D4A574"
        transparent
        opacity={0.1}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  );
}

function CameraRig() {
  const store = useCinematicStore();
  const target = useRef(new THREE.Vector3(0, 0, 7));

  useFrame(({ camera }) => {
    const state = store.getState();
    switch (state.sceneMode) {
      case "constellation":
        target.current.set(0, 0, 7 - state.progress * 12);
        break;
      case "contracting":
        target.current.set(0, 0, 3);
        break;
      case "ambient":
        target.current.set(0, 0, 10);
        break;
      case "timeline":
        target.current.set((state.progress - 0.7) * 30, 2, 4);
        break;
      case "fadeout":
        target.current.set(0, 0, 12);
        break;
    }
    camera.position.lerp(target.current, 0.03);
    camera.lookAt(0, 0, 0);
  });

  return null;
}

export function ConstellationScene() {
  return (
    <Canvas
      frameloop="always"
      camera={{ position: [0, 0, 7], fov: 55 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      dpr={[1, 2]}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.02} />
      <CameraRig />
      <CentralGlow />
      <SpiralParticles />
      <AmbientStars />
      {DOMAINS.map((domain, i) => (
        <Orb key={domain.id} index={i} color={domain.color} />
      ))}
      <NeuralConnections />
      <EffectComposer multisampling={4}>
        <Bloom
          luminanceThreshold={0.08}
          luminanceSmoothing={0.7}
          intensity={2.5}
          mipmapBlur
        />
        <Vignette offset={0.15} darkness={0.85} />
      </EffectComposer>
    </Canvas>
  );
}
