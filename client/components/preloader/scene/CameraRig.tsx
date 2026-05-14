"use client";

import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { gsap } from "@/lib/gsap-init";
import { CAMERA } from "../constants";

export function CameraRig() {
  const { camera } = useThree();
  const fovRef = useRef(CAMERA.fov);

  // -------------------------------------------------------------------------
  // Per-frame orbit
  // -------------------------------------------------------------------------
  useFrame(() => {
    const time = performance.now() / 1000;

    const orbitAngle = (time / CAMERA.orbitPeriod) * 2 * Math.PI;
    const easedAngle = orbitAngle + Math.sin(orbitAngle * 0.5) * 0.3;

    const elevationRad = THREE.MathUtils.degToRad(
      CAMERA.orbitElevationDeg +
        Math.sin((time * 2 * Math.PI) / CAMERA.verticalBobPeriod) *
          CAMERA.verticalBobAmplitudeDeg
    );

    const x =
      Math.cos(easedAngle) * CAMERA.orbitRadius * Math.cos(elevationRad);
    const y = Math.sin(elevationRad) * CAMERA.orbitRadius;
    const z =
      Math.sin(easedAngle) * CAMERA.orbitRadius * Math.cos(elevationRad);

    camera.position.set(x, y, z);
    camera.lookAt(0, 0, 0);

    const perspCam = camera as THREE.PerspectiveCamera;
    if (perspCam.fov !== fovRef.current) {
      perspCam.fov = fovRef.current;
      perspCam.updateProjectionMatrix();
    }
  });

  // -------------------------------------------------------------------------
  // GSAP micro-zoom
  // -------------------------------------------------------------------------
  useEffect(() => {
    const target = { fov: CAMERA.fov };
    let microZoomTween: gsap.core.Timeline | null = null;
    let scheduledCall: gsap.core.Tween | null = null;

    function doZoom() {
      microZoomTween = gsap
        .timeline()
        .to(target, {
          fov: CAMERA.fov - CAMERA.microZoomAmount,
          duration: CAMERA.microZoomInDuration,
          ease: "power2.inOut",
          onUpdate: () => {
            fovRef.current = target.fov;
          },
        })
        .to(target, {
          fov: CAMERA.fov,
          duration: CAMERA.microZoomOutDuration,
          onUpdate: () => {
            fovRef.current = target.fov;
          },
          onComplete: () => {
            const elapsed =
              CAMERA.microZoomInDuration + CAMERA.microZoomOutDuration;
            const remaining = CAMERA.microZoomInterval - elapsed;
            scheduledCall = gsap.delayedCall(
              Math.max(0, remaining),
              doZoom
            );
          },
        });
    }

    scheduledCall = gsap.delayedCall(2, doZoom);

    return () => {
      scheduledCall?.kill();
      microZoomTween?.kill();
      gsap.killTweensOf(target);
    };
  }, []);

  return null;
}
