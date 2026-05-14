"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RINGS } from "../constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RingConfig = (typeof RINGS)[number];

interface SingleRingProps {
  config: RingConfig;
  index: number;
  dissolve: number;
  progressNodeFraction?: number;
}

interface OrbitalRingsProps {
  dissolve?: number;
  progressNodeFraction?: number;
}

// ---------------------------------------------------------------------------
// SingleRing
// ---------------------------------------------------------------------------

function SingleRing({
  config,
  index,
  dissolve,
  progressNodeFraction,
}: SingleRingProps) {
  const revolutionGroupRef = useRef<THREE.Group>(null);
  const nodeRefs = useRef<THREE.Mesh[]>([]);

  // Stable Euler from tilt config (only recalculated when config identity changes)
  const tiltEuler = useMemo(
    () => new THREE.Euler(config.tilt.x, config.tilt.y, config.tilt.z),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config]
  );

  useFrame(({ clock }, delta) => {
    const revGroup = revolutionGroupRef.current;
    if (!revGroup) return;

    // Ring group orbits around Y axis
    revGroup.rotation.y += (2 * Math.PI * delta) / config.revolutionPeriod;

    const time = clock.getElapsedTime();

    // Animate each traveling node
    nodeRefs.current.forEach((node, i) => {
      if (!node) return;

      let angle: number;

      if (progressNodeFraction !== undefined && i === 0) {
        // Inner ring's first node is driven by load progress
        angle = progressNodeFraction * 2 * Math.PI;

        // Flare at ~99%
        if (progressNodeFraction >= 0.99) {
          const flare = 1 + Math.sin(time * 8) * 0.5;
          node.scale.setScalar(flare);
        } else {
          node.scale.setScalar(1);
        }
      } else {
        // Autonomous orbit — each node moves at a slightly different speed
        const nodeSpeed =
          config.revolutionPeriod * (0.7 + i * 0.15);
        angle =
          ((time / nodeSpeed) * 2 * Math.PI) +
          (i * 2 * Math.PI) / config.nodeCount;
        node.scale.setScalar(1);
      }

      node.position.x = Math.cos(angle) * config.radius;
      node.position.z = Math.sin(angle) * config.radius;
    });
  });

  return (
    /* Outer group applies the ring's tilt */
    <group rotation={tiltEuler}>
      {/* Inner group rotates for revolution */}
      <group ref={revolutionGroupRef}>
        {/* Torus ring */}
        <mesh>
          <torusGeometry args={[config.radius, config.tubeRadius, 16, 100]} />
          <meshStandardMaterial
            color={config.color}
            emissive={config.color}
            emissiveIntensity={0.5}
            transparent
            opacity={config.opacity * (1 - dissolve)}
            depthWrite={false}
          />
        </mesh>

        {/* Traveling nodes */}
        {Array.from({ length: config.nodeCount }).map((_, i) => (
          <mesh
            key={i}
            ref={(el) => {
              if (el) nodeRefs.current[i] = el;
            }}
          >
            <sphereGeometry args={[config.nodeRadius, 16, 16]} />
            <meshStandardMaterial
              color={config.color}
              emissive={config.color}
              emissiveIntensity={1.5}
              transparent
              opacity={1 - dissolve}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------------
// OrbitalRings (parent)
// ---------------------------------------------------------------------------

export function OrbitalRings({
  dissolve = 0,
  progressNodeFraction,
}: OrbitalRingsProps) {
  return (
    <>
      {RINGS.map((config, index) => (
        <SingleRing
          key={index}
          config={config}
          index={index}
          dissolve={dissolve}
          progressNodeFraction={index === 0 ? progressNodeFraction : undefined}
        />
      ))}
    </>
  );
}
