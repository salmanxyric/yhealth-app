"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Canvas } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe";
import { ProgressRing } from "./ProgressRing";
import { CSS_COLORS, COLORS, TIMING } from "./constants";
import {
  energyFlowVertex,
  energyFlowFragment,
} from "./shaders/energy-flow";
import { particleVertex, particleFragment } from "./shaders/particle-trail";

// ---------------------------------------------------------------------------
// MiniCore — Simplified EnergyCore at 40% scale, Y-rotation only
// ---------------------------------------------------------------------------

function MiniCore() {
  const groupRef = useRef<THREE.Group>(null);
  const shaderRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uBaseColor: { value: COLORS.coreCyan },
      uEmissiveIntensity: { value: 0.8 },
      uDissolve: { value: 0 },
    }),
    [],
  );

  useFrame((_, delta) => {
    if (!groupRef.current || !shaderRef.current) return;

    // Update time uniform
    shaderRef.current.uniforms.uTime.value += delta;

    const time = shaderRef.current.uniforms.uTime.value;

    // Y-rotation only, 4s period
    groupRef.current.rotation.y = (time / 4) * Math.PI * 2;

    // Breathe scale at 40%: 0.38 + breathe * 0.02
    const breathe = Math.sin(time * Math.PI * 2 / 3) * 0.5 + 0.5; // 0..1 over 3s
    const scale = 0.38 + breathe * 0.02;
    groupRef.current.scale.setScalar(scale);
  });

  return (
    <group ref={groupRef}>
      {/* Wireframe icosahedron */}
      <mesh>
        <icosahedronGeometry args={[1, 1]} />
        <shaderMaterial
          ref={shaderRef}
          vertexShader={energyFlowVertex}
          fragmentShader={energyFlowFragment}
          uniforms={uniforms}
          transparent
          wireframe
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Inner gold sphere */}
      <mesh>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshStandardMaterial
          color={CSS_COLORS.gold}
          transparent
          opacity={0.25}
          emissive={CSS_COLORS.gold}
          emissiveIntensity={0.6}
        />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// MiniParticles — 30 particles in circular orbit
// ---------------------------------------------------------------------------

const MINI_PARTICLE_COUNT = 30;

function MiniParticles() {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, sizes, opacities, colors } = useMemo(() => {
    const pos = new Float32Array(MINI_PARTICLE_COUNT * 3);
    const sz = new Float32Array(MINI_PARTICLE_COUNT);
    const op = new Float32Array(MINI_PARTICLE_COUNT);
    const col = new Float32Array(MINI_PARTICLE_COUNT * 3);

    for (let i = 0; i < MINI_PARTICLE_COUNT; i++) {
      const angle = (i / MINI_PARTICLE_COUNT) * Math.PI * 2;
      const radius = 1.5 + Math.random() * 1.0; // 1.5 to 2.5

      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
      pos[i * 3 + 2] = Math.sin(angle) * radius;

      sz[i] = 2.0 + Math.random() * 2.0;
      op[i] = 0.4 + Math.random() * 0.4;

      // Every 4th particle is gold, rest are cyan
      const isGold = i % 4 === 0;
      const color = isGold ? COLORS.gold : COLORS.coreCyan;
      col[i * 3] = color.r;
      col[i * 3 + 1] = color.g;
      col[i * 3 + 2] = color.b;
    }

    return { positions: pos, sizes: sz, opacities: op, colors: col };
  }, []);

  const uniforms = useMemo(() => ({}), []);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;

    const posAttr = pointsRef.current.geometry.getAttribute(
      "position",
    ) as THREE.BufferAttribute;
    const posArray = posAttr.array as Float32Array;

    const rotSpeed = delta * 0.5;
    const cosR = Math.cos(rotSpeed);
    const sinR = Math.sin(rotSpeed);

    for (let i = 0; i < MINI_PARTICLE_COUNT; i++) {
      const x = posArray[i * 3];
      const z = posArray[i * 3 + 2];

      // Rotate around Y axis using cos/sin rotation matrix
      posArray[i * 3] = x * cosR - z * sinR;
      posArray[i * 3 + 2] = x * sinR + z * cosR;
    }

    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-aSize"
          args={[sizes, 1]}
        />
        <bufferAttribute
          attach="attributes-aOpacity"
          args={[opacities, 1]}
        />
        <bufferAttribute
          attach="attributes-aColor"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={particleVertex}
        fragmentShader={particleFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ---------------------------------------------------------------------------
// RouteLoader — Lightweight page-transition loader with mini 3D scene
// ---------------------------------------------------------------------------

export function RouteLoader() {
  const prefersReducedMotion = useReducedMotionSafe();
  const [visible, setVisible] = useState(false);
  const [webGLOk, setWebGLOk] = useState(true);

  useEffect(() => {
    // Fade in on next frame
    const raf = requestAnimationFrame(() => setVisible(true));

    // WebGL check
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("webgl2") || canvas.getContext("webgl");
      if (!ctx) {
        setWebGLOk(false);
      }
    } catch {
      setWebGLOk(false);
    }

    return () => cancelAnimationFrame(raf);
  }, []);

  // ---------------------------------------------------------------------------
  // Fallback: reduced motion or no WebGL
  // ---------------------------------------------------------------------------
  if (prefersReducedMotion || !webGLOk) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label="Loading content"
        className="fixed inset-0 z-[9998] flex items-center justify-center"
        style={{
          background: `${CSS_COLORS.deepBlack}E6`,
          opacity: visible ? 1 : 0,
          transition: `opacity ${TIMING.routeLoaderFadeInMs}ms ease-out`,
        }}
      >
        <div
          className="text-4xl font-bold animate-pulse"
          style={{ color: CSS_COLORS.coreCyan }}
        >
          B
        </div>
        <span className="sr-only">Please wait while the page loads</span>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Main 3D render
  // ---------------------------------------------------------------------------
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading content"
      className="fixed inset-0 z-[9998] flex items-center justify-center"
      style={{
        background: `${CSS_COLORS.deepBlack}E6`,
        opacity: visible ? 1 : 0,
        transition: `opacity ${TIMING.routeLoaderFadeInMs}ms ease-out`,
      }}
    >
      <div className="relative" style={{ width: 120, height: 120 }}>
        <Canvas
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
          }}
          camera={{ fov: 50, near: 0.1, far: 50, position: [0, 0, 5] }}
          dpr={[1, 2]}
        >
          <ambientLight intensity={0.05} />
          <pointLight
            color={CSS_COLORS.gold}
            intensity={1.5}
            position={[0, 0, 0]}
          />
          <MiniCore />
          <MiniParticles />
          <EffectComposer>
            <Bloom luminanceThreshold={0.2} intensity={1.0} mipmapBlur />
          </EffectComposer>
        </Canvas>
        <ProgressRing progress={50} size={120} />
      </div>
      <span className="sr-only">Please wait while the page loads</span>
    </div>
  );
}
