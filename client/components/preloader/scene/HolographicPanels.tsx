"use client";

import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { PANELS, CSS_COLORS } from "../constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HolographicPanelsProps {
  dissolve?: number;
}

// ---------------------------------------------------------------------------
// Canvas Texture Generator
// ---------------------------------------------------------------------------

function generatePanelTexture(
  variant: number,
  width = 256,
  height = 160
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  // Clear to transparent
  ctx.clearRect(0, 0, width, height);

  // Border
  ctx.strokeStyle = CSS_COLORS.coreCyan;
  ctx.globalAlpha = 0.4;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(2, 2, width - 4, height - 4);
  ctx.globalAlpha = 1;

  switch (variant) {
    case 0: {
      // 8 horizontal text-line rects
      const lineHeight = 10;
      const startY = 20;
      const gapY = 14;
      for (let i = 0; i < 8; i++) {
        const lineWidth = (0.3 + Math.random() * 0.55) * (width - 24);
        ctx.fillStyle = CSS_COLORS.coreCyan;
        ctx.globalAlpha = 0.25 + Math.random() * 0.35;
        ctx.fillRect(12, startY + i * gapY, lineWidth, lineHeight);
      }
      break;
    }

    case 1: {
      // 5 bar chart bars
      const barCount = 5;
      const barWidth = 28;
      const barGap = (width - barCount * barWidth - 24) / (barCount - 1);
      const maxBarHeight = height - 36;
      for (let i = 0; i < barCount; i++) {
        const barHeight = (0.2 + Math.random() * 0.8) * maxBarHeight;
        const x = 12 + i * (barWidth + barGap);
        const y = height - 16 - barHeight;
        ctx.fillStyle = CSS_COLORS.electricBlue;
        ctx.globalAlpha = 0.3 + Math.random() * 0.4;
        ctx.fillRect(x, y, barWidth, barHeight);
      }
      break;
    }

    case 2: {
      // Circular progress arc + dot at end
      const cx = width / 2;
      const cy = height / 2;
      const r = Math.min(width, height) / 2 - 20;
      const progress = 0.35 + Math.random() * 0.5; // 35–85%
      const startAngle = -Math.PI / 2;
      const endAngle = startAngle + progress * 2 * Math.PI;

      // Track ring
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, 2 * Math.PI);
      ctx.strokeStyle = CSS_COLORS.coreCyan;
      ctx.globalAlpha = 0.12;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Progress arc
      ctx.beginPath();
      ctx.arc(cx, cy, r, startAngle, endAngle);
      ctx.strokeStyle = CSS_COLORS.coreCyan;
      ctx.globalAlpha = 0.7;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Dot at arc tip
      const dotX = cx + Math.cos(endAngle) * r;
      const dotY = cy + Math.sin(endAngle) * r;
      ctx.beginPath();
      ctx.arc(dotX, dotY, 4, 0, 2 * Math.PI);
      ctx.fillStyle = CSS_COLORS.coreCyan;
      ctx.globalAlpha = 1;
      ctx.fill();
      break;
    }

    case 3: {
      // 8x12 data matrix dots
      const cols = 12;
      const rows = 8;
      const cellW = (width - 24) / cols;
      const cellH = (height - 24) / rows;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if (Math.random() < 0.55) {
            const x = 12 + col * cellW + cellW / 2;
            const y = 12 + row * cellH + cellH / 2;
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, 2 * Math.PI);
            ctx.fillStyle = CSS_COLORS.coreCyan;
            ctx.globalAlpha = 0.15 + Math.random() * 0.6;
            ctx.fill();
          }
        }
      }
      break;
    }

    default:
      break;
  }

  // Reset alpha
  ctx.globalAlpha = 1;

  return new THREE.CanvasTexture(canvas);
}

// Per-panel opacity values (subtle HUD feel)
const PANEL_BASE_OPACITIES = [0.15, 0.12, 0.1, 0.13] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function HolographicPanels({ dissolve = 0 }: HolographicPanelsProps) {
  const { camera } = useThree();

  // Stable mesh ref array
  const meshRefs = useRef<THREE.Mesh[]>([]);

  // Generate textures once
  const textures = useMemo(() => {
    return Array.from({ length: PANELS.count }, (_, i) =>
      generatePanelTexture(i)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Store base Y positions (extracted from PANELS.positions)
  const basePositions = useMemo(
    () => PANELS.positions.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
    []
  );

  // Scratch quaternion for billboard slerp
  const _targetQuat = useMemo(() => new THREE.Quaternion(), []);
  const _lookMatrix = useMemo(() => new THREE.Matrix4(), []);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();

    meshRefs.current.forEach((mesh, i) => {
      if (!mesh) return;

      const base = basePositions[i];
      const floatPeriod = PANELS.floatPeriods[i];

      // Float bobbing on Y
      mesh.position.set(
        base.x,
        base.y +
          Math.sin((time * 2 * Math.PI) / floatPeriod + i) *
            PANELS.floatAmplitude,
        base.z
      );

      // Dissolve: drift outward along panel's normalized direction
      if (dissolve > 0) {
        const dir = base.clone().normalize();
        mesh.position.addScaledVector(dir, dissolve * 0.05);
      }

      // Slow billboard — slerp toward camera-facing quaternion
      _lookMatrix.lookAt(camera.position, mesh.position, camera.up);
      _targetQuat.setFromRotationMatrix(_lookMatrix);
      mesh.quaternion.slerp(_targetQuat, 0.02);

      // Update opacity via material
      const mat = mesh.material as THREE.MeshPhysicalMaterial;
      mat.opacity = PANEL_BASE_OPACITIES[i] * (1 - dissolve);
    });
  });

  return (
    <>
      {PANELS.positions.map((pos, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) meshRefs.current[i] = el;
          }}
          position={pos}
        >
          <planeGeometry args={[PANELS.sizes[i][0], PANELS.sizes[i][1]]} />
          <meshPhysicalMaterial
            map={textures[i]}
            transparent
            opacity={PANEL_BASE_OPACITIES[i]}
            roughness={0.1}
            transmission={0.85}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </>
  );
}
