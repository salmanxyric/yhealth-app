"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { NEURAL_PARTICLES, COLORS } from "../constants";
import { particleVertex, particleFragment } from "../shaders/particle-trail";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NeuralParticlesProps {
  dissolve?: number;
}

interface ParticleState {
  position: THREE.Vector3;
  prevPositions: THREE.Vector3[];
  progress: number;
  speed: number;
  spiralOffset: number;
  spawnPoint: THREE.Vector3;
  burstVelocity: THREE.Vector3 | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function randomOnSphere(radiusMin: number, radiusMax: number): THREE.Vector3 {
  const r = radiusMin + Math.random() * (radiusMax - radiusMin);
  const theta = Math.acos(2 * Math.random() - 1);
  const phi = Math.random() * 2 * Math.PI;
  return new THREE.Vector3(
    r * Math.sin(theta) * Math.cos(phi),
    r * Math.sin(theta) * Math.sin(phi),
    r * Math.cos(theta)
  );
}

const _trailColors = [
  COLORS.coreCyan,
  COLORS.whiteHighlight,
  COLORS.gold,
  COLORS.violet,
] as const;

function pickColor(index: number): THREE.Color {
  const ratio = index / NEURAL_PARTICLES.count;
  if (ratio < 0.6) return _trailColors[0]; // cyan
  if (ratio < 0.85) return _trailColors[1]; // white
  if (ratio < 0.95) return _trailColors[2]; // gold
  return _trailColors[3]; // violet
}

// Shared scratch vectors — reused every frame to avoid allocations
const _perpA = new THREE.Vector3();
const _perpB = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);
const _right = new THREE.Vector3(1, 0, 0);

// Trail opacity weights: head → tail
const TRAIL_OPACITY = [1.0, 0.7, 0.4, 0.1] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NeuralParticles({ dissolve = 0 }: NeuralParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);

  const {
    count,
    spawnRadiusMin,
    spawnRadiusMax,
    coreRadius,
    travelTimeMin,
    travelTimeMax,
    trailLength,
    sizeMin,
    sizeMax,
  } = NEURAL_PARTICLES;

  const totalPoints = count * trailLength;

  // -------------------------------------------------------------------------
  // Memoized buffer arrays + particle state
  // -------------------------------------------------------------------------
  const { positions, sizes, opacities, colors, particleState } = useMemo(() => {
    const positions = new Float32Array(totalPoints * 3);
    const sizes = new Float32Array(totalPoints);
    const opacities = new Float32Array(totalPoints);
    const colors = new Float32Array(totalPoints * 3);

    const particleState: ParticleState[] = [];

    for (let i = 0; i < count; i++) {
      const spawn = randomOnSphere(spawnRadiusMin, spawnRadiusMax);
      const speed =
        travelTimeMin + Math.random() * (travelTimeMax - travelTimeMin);

      // All trail positions start at spawn
      const prevPositions: THREE.Vector3[] = Array.from(
        { length: trailLength },
        () => spawn.clone()
      );

      particleState.push({
        position: spawn.clone(),
        prevPositions,
        progress: Math.random(), // stagger across the path from the start
        speed,
        spiralOffset: Math.random() * 2 * Math.PI,
        spawnPoint: spawn.clone(),
        burstVelocity: null,
      });

      // Write initial buffer values
      const color = pickColor(i);
      for (let t = 0; t < trailLength; t++) {
        const bufIdx = (i * trailLength + t) * 3;
        positions[bufIdx] = spawn.x;
        positions[bufIdx + 1] = spawn.y;
        positions[bufIdx + 2] = spawn.z;

        sizes[i * trailLength + t] = sizeMin;
        opacities[i * trailLength + t] = TRAIL_OPACITY[t] * 0;
        colors[bufIdx] = color.r;
        colors[bufIdx + 1] = color.g;
        colors[bufIdx + 2] = color.b;
      }
    }

    return { positions, sizes, opacities, colors, particleState };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------------------------------------------------------
  // Animation
  // -------------------------------------------------------------------------
  useFrame((_, delta) => {
    const pts = pointsRef.current;
    if (!pts) return;

    const geo = pts.geometry;

    for (let i = 0; i < count; i++) {
      const p = particleState[i];

      // --- Burst on dissolve ---
      if (dissolve > 0.1 && p.burstVelocity === null) {
        p.burstVelocity = p.position
          .clone()
          .normalize()
          .multiplyScalar(3 + Math.random() * 3);
      }

      if (p.burstVelocity !== null) {
        // Drift outward + decay
        p.position.addScaledVector(p.burstVelocity, delta);
        p.burstVelocity.multiplyScalar(0.98);
      } else {
        // --- Spiral inward ---
        p.progress += delta / p.speed;

        if (p.progress >= 1) {
          // Respawn
          const newSpawn = randomOnSphere(spawnRadiusMin, spawnRadiusMax);
          p.spawnPoint.copy(newSpawn);
          p.position.copy(newSpawn);
          p.prevPositions.forEach((v) => v.copy(newSpawn));
          p.progress = 0;
          p.speed = travelTimeMin + Math.random() * (travelTimeMax - travelTimeMin);
          p.spiralOffset = Math.random() * 2 * Math.PI;
        } else {
          const t = p.progress;

          // Shrink radius: outer spawn → core
          const radius = THREE.MathUtils.lerp(spawnRadiusMax, coreRadius, t);

          // Spiral angle
          const angle = p.spiralOffset + t * 4 * Math.PI;

          // Build perpendicular axes to spawn direction
          const dir = p.spawnPoint.clone().normalize();

          // Choose stable up-like vector avoiding near-parallel
          const ref = Math.abs(dir.dot(_up)) < 0.9 ? _up : _right;
          _perpA.crossVectors(dir, ref).normalize();
          _perpB.crossVectors(dir, _perpA).normalize();

          // Position on spiral cone
          p.position.set(
            dir.x * radius + _perpA.x * Math.cos(angle) * radius * 0.15 + _perpB.x * Math.sin(angle) * radius * 0.15,
            dir.y * radius + _perpA.y * Math.cos(angle) * radius * 0.15 + _perpB.y * Math.sin(angle) * radius * 0.15,
            dir.z * radius + _perpA.z * Math.cos(angle) * radius * 0.15 + _perpB.z * Math.sin(angle) * radius * 0.15
          );
        }
      }

      // --- Shift trail history ---
      // prevPositions[0] = most recent previous, [trailLength-1] = oldest
      for (let t = trailLength - 1; t > 0; t--) {
        p.prevPositions[t].copy(p.prevPositions[t - 1]);
      }
      p.prevPositions[0].copy(p.position);

      // --- Write to buffers ---
      const distFactor = Math.min(
        1,
        p.position.length() / spawnRadiusMax
      );
      const baseSize = THREE.MathUtils.lerp(sizeMax, sizeMin, 1 - distFactor);

      const color = pickColor(i);
      const baseOpacity = 1 - dissolve;

      for (let t = 0; t < trailLength; t++) {
        const bufIdx = i * trailLength + t;
        const pos3 = bufIdx * 3;
        const trailPos =
          t === 0 ? p.position : p.prevPositions[t - 1];

        positions[pos3] = trailPos.x;
        positions[pos3 + 1] = trailPos.y;
        positions[pos3 + 2] = trailPos.z;

        sizes[bufIdx] = baseSize * (1 - t * 0.2);
        opacities[bufIdx] = TRAIL_OPACITY[t] * baseOpacity;
        colors[pos3] = color.r;
        colors[pos3 + 1] = color.g;
        colors[pos3 + 2] = color.b;
      }
    }

    // Mark attributes dirty
    const posAttr = geo.getAttribute("position") as THREE.BufferAttribute;
    const sizeAttr = geo.getAttribute("aSize") as THREE.BufferAttribute;
    const opacityAttr = geo.getAttribute("aOpacity") as THREE.BufferAttribute;

    posAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
    opacityAttr.needsUpdate = true;
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
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
