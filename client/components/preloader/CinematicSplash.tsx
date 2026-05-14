"use client";

import { useState, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { gsap } from "@/lib/gsap-init";
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe";
import { useLoadingProgress } from "./hooks/use-loading-progress";
import { useSplashState } from "./hooks/use-splash-state";
import { EnergyCore } from "./scene/EnergyCore";
import { OrbitalRings } from "./scene/OrbitalRings";
import { NeuralParticles } from "./scene/NeuralParticles";
import { HolographicPanels } from "./scene/HolographicPanels";
import { QuantumGrid } from "./scene/QuantumGrid";
import { AmbientParticles } from "./scene/AmbientParticles";
import { Lighting } from "./scene/Lighting";
import { CameraRig } from "./scene/CameraRig";
import { PostProcessingEffects } from "./scene/PostProcessing";
import { ProgressOverlay } from "./ProgressOverlay";
import { CAMERA, CSS_COLORS, TIMING } from "./constants";

// ---------------------------------------------------------------------------
// CinematicSplash — Full-screen R3F preloader with dissolution timeline
// ---------------------------------------------------------------------------

export function CinematicSplash() {
  const prefersReducedMotion = useReducedMotionSafe();
  const progress = useLoadingProgress();
  const { phase, alreadyShown } = useSplashState(progress);

  const [dissolve, setDissolve] = useState(0);
  const [bloomIntensity, setBloomIntensity] = useState(0.6);
  const [webGLSupported, setWebGLSupported] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // ---------------------------------------------------------------------------
  // WebGL capability check
  // ---------------------------------------------------------------------------
  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("webgl2") || canvas.getContext("webgl");
      if (!ctx) setWebGLSupported(false);
    } catch {
      setWebGLSupported(false);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Dissolution timeline — triggered when phase enters "dissolving"
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (phase !== "dissolving") return;

    const dissolveTarget = { value: 0, bloom: 0.6 };
    const tl = gsap.timeline();

    // Phase 1: Flash — bloom intensifies
    tl.to(dissolveTarget, {
      bloom: 1.5,
      duration: TIMING.flashDurationMs / 1000,
      ease: "power2.in",
      onUpdate: () => setBloomIntensity(dissolveTarget.bloom),
    });

    // Phase 2: Shatter — dissolve ramps to 1
    tl.to(dissolveTarget, {
      value: 1,
      duration: TIMING.shatterDurationMs / 1000,
      ease: "power2.in",
      onUpdate: () => setDissolve(dissolveTarget.value),
    });

    // Phase 3: Fade — container fades out
    if (containerRef.current) {
      tl.to(containerRef.current, {
        opacity: 0,
        duration: TIMING.fadeDurationMs / 1000,
        ease: "power2.out",
      });
    }

    return () => {
      tl.kill();
    };
  }, [phase]);

  // ---------------------------------------------------------------------------
  // Early returns
  // ---------------------------------------------------------------------------
  if (alreadyShown || phase === "done") return null;

  // ---------------------------------------------------------------------------
  // Fallback: reduced motion or no WebGL support
  // ---------------------------------------------------------------------------
  if (prefersReducedMotion || !webGLSupported) {
    return (
      <div
        ref={containerRef}
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
        style={{ background: CSS_COLORS.deepBlack }}
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {/* Static "B" mark */}
        <div
          className="text-6xl font-bold mb-8"
          style={{ color: CSS_COLORS.coreCyan }}
        >
          B
        </div>

        {/* Simple progress bar */}
        <div
          className="w-48 h-0.5 rounded-full overflow-hidden"
          style={{ backgroundColor: `${CSS_COLORS.coreCyan}26` }}
        >
          <div
            className="h-full rounded-full transition-all duration-300 ease-out"
            style={{
              width: `${progress}%`,
              backgroundColor: CSS_COLORS.coreCyan,
            }}
          />
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Main 3D render
  // ---------------------------------------------------------------------------
  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999]"
      style={{ background: CSS_COLORS.deepBlack }}
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-hidden="true"
    >
      <Canvas
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        }}
        camera={{
          fov: CAMERA.fov,
          near: CAMERA.near,
          far: CAMERA.far,
          position: [0, 2, CAMERA.orbitRadius],
        }}
        dpr={[1, 2]}
      >
        <color attach="background" args={[CSS_COLORS.deepBlack]} />
        <CameraRig />
        <PostProcessingEffects bloomIntensity={bloomIntensity} />
        <EnergyCore dissolve={dissolve} />
        <OrbitalRings
          dissolve={dissolve}
          progressNodeFraction={progress / 100}
        />
        <NeuralParticles dissolve={dissolve} />
        <HolographicPanels dissolve={dissolve} />
        <QuantumGrid dissolve={dissolve} />
        <AmbientParticles dissolve={dissolve} />
        <Lighting dissolve={dissolve} />
      </Canvas>

      <ProgressOverlay progress={progress} dissolving={phase === "dissolving"} />
    </div>
  );
}
