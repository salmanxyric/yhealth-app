"use client";

import { useRef, useEffect, useCallback } from "react";
import { useGSAP } from "@/hooks/use-gsap";
import { ScrollTrigger } from "@/lib/gsap-init";
import * as THREE from "three";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LifeWord {
  t: string;
  c: string;
}

interface LifeWordSprite {
  sprite: THREE.Sprite;
  baseY: number;
  angle: number;
  radius: number;
  driftSpeed: number;
  pulseOffset: number;
  baseOpacity: number;
}

interface DomainConfig {
  color: number;
  radius: number;
  angle: number;
  yBase: number;
}

interface DomainMesh {
  mesh: THREE.Mesh;
  halo: THREE.Sprite;
  angle: number;
  radius: number;
  yBase: number;
  orbitSpeed: number;
  pulseOffset: number;
}

/** Mutable state shared between the Three.js render loop and ScrollTrigger. */
interface CameraState {
  z: number;
  y: number;
  x: number;
  sceneRotateY: number;
}

/** Refs to Three.js materials accessed by ScrollTrigger. */
interface ThreeRefs {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  animId: number;
  resizeTimer: ReturnType<typeof setTimeout> | null;
  resizeHandler: (() => void) | null;
  lineMat: THREE.LineBasicMaterial;
  nebMat: THREE.ShaderMaterial;
}

// ---------------------------------------------------------------------------
// Static data
// ---------------------------------------------------------------------------

const LIFE_WORDS: LifeWord[] = [
  // Health (lime)
  { t: "sleep", c: "#A3E635" },
  { t: "breath", c: "#A3E635" },
  { t: "energy", c: "#A3E635" },
  { t: "recover", c: "#A3E635" },
  { t: "alive", c: "#A3E635" },
  { t: "HRV", c: "#A3E635" },
  // Finance (purple)
  { t: "savings", c: "#A39EFF" },
  { t: "invest", c: "#A39EFF" },
  { t: "budget", c: "#A39EFF" },
  { t: "freedom", c: "#A39EFF" },
  { t: "$2,400", c: "#A39EFF" },
  { t: "goals", c: "#A39EFF" },
  // Career (orange)
  { t: "purpose", c: "#F18A3F" },
  { t: "ship it", c: "#F18A3F" },
  { t: "pitch", c: "#F18A3F" },
  { t: "growth", c: "#F18A3F" },
  { t: "1:1", c: "#F18A3F" },
  { t: "promotion", c: "#F18A3F" },
  // Relations (coral)
  { t: "love", c: "#F0998C" },
  { t: "family", c: "#F0998C" },
  { t: "Sarah", c: "#F0998C" },
  { t: "birthday", c: "#F0998C" },
  { t: "Sunday", c: "#F0998C" },
  { t: "mom", c: "#F0998C" },
  // Mind (teal)
  { t: "calm", c: "#7FC9BD" },
  { t: "presence", c: "#7FC9BD" },
  { t: "focus", c: "#7FC9BD" },
  { t: "stillness", c: "#7FC9BD" },
  { t: "breathe", c: "#7FC9BD" },
  { t: "peace", c: "#7FC9BD" },
  // Growth (lilac)
  { t: "learn", c: "#D4C2E8" },
  { t: "discipline", c: "#D4C2E8" },
  { t: "patience", c: "#D4C2E8" },
  { t: "become", c: "#D4C2E8" },
  { t: "curious", c: "#D4C2E8" },
  // Time / moments (bread)
  { t: "today", c: "#E8C998" },
  { t: "now", c: "#E8C998" },
  { t: "morning", c: "#E8C998" },
  { t: "evening", c: "#E8C998" },
  { t: "tomorrow", c: "#E8C998" },
  // Feelings
  { t: "grateful", c: "#F18A3F" },
  { t: "tired", c: "#A39EFF" },
  { t: "happy", c: "#A3E635" },
  { t: "excited", c: "#F0998C" },
  { t: "centered", c: "#7FC9BD" },
  { t: "curious", c: "#D4C2E8" },
];

const DOMAINS: DomainConfig[] = [
  { color: 0xa3e635, radius: 14, angle: 0, yBase: 1 }, // Health
  { color: 0x4f46e5, radius: 17, angle: Math.PI / 4, yBase: -2 }, // Finance
  { color: 0xd95f0e, radius: 13, angle: Math.PI / 2, yBase: 3 }, // Career
  { color: 0xe8765a, radius: 16, angle: (3 * Math.PI) / 4, yBase: -1 }, // Relations
  { color: 0x5ba89c, radius: 18, angle: Math.PI, yBase: 2 }, // Mind
  { color: 0xb8a4d4, radius: 13, angle: (5 * Math.PI) / 4, yBase: -3 }, // Growth
  { color: 0xe8c998, radius: 15, angle: (3 * Math.PI) / 2, yBase: 1 }, // Learning
  { color: 0xb85540, radius: 17, angle: (7 * Math.PI) / 4, yBase: -2 }, // Purpose
];

const NEBULA_PALETTE = [
  new THREE.Color(0xd95f0e), // orange
  new THREE.Color(0xf18a3f), // orange-soft
  new THREE.Color(0x4f46e5), // purple
  new THREE.Color(0x7c75f0), // purple-soft
  new THREE.Color(0xa39eff), // purple-glow
  new THREE.Color(0xa3e635), // lime
  new THREE.Color(0xe8c998), // bread
];

const BG_STAR_COUNT = 1200;
const NEBULA_COUNT = 3500;
const NEBULA_ARM_COUNT = 3;

// ---------------------------------------------------------------------------
// Texture generators
// ---------------------------------------------------------------------------

function createParticleSprite(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.18, "rgba(255,255,255,0.85)");
  grad.addColorStop(0.45, "rgba(255,255,255,0.32)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

function createGlowSprite(hexColor: number): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  const c = new THREE.Color(hexColor);
  const r = Math.round(c.r * 255);
  const g = Math.round(c.g * 255);
  const b = Math.round(c.b * 255);
  const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, `rgba(${r},${g},${b},0.95)`);
  grad.addColorStop(0.25, `rgba(${r},${g},${b},0.45)`);
  grad.addColorStop(0.6, `rgba(${r},${g},${b},0.12)`);
  grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function createTextSprite(text: string, color: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  ctx.font = 'italic 56px "Instrument Serif", Georgia, serif';
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  // Glow underlay
  ctx.shadowColor = color;
  ctx.shadowBlur = 18;
  ctx.fillStyle = color;
  ctx.fillText(text, 256, 64);
  // Sharper top layer
  ctx.shadowBlur = 0;
  ctx.fillText(text, 256, 64);
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

// ---------------------------------------------------------------------------
// Shader sources
// ---------------------------------------------------------------------------

const NEBULA_VERTEX = /* glsl */ `
  attribute float size;
  attribute vec3 color;
  varying vec3 vColor;
  uniform float uTime;
  void main() {
    vColor = color;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    float twinkle = 0.85 + 0.15 * sin(uTime * 2.0 + position.x * 0.4 + position.z * 0.3);
    gl_PointSize = size * twinkle * (240.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const NEBULA_FRAGMENT = /* glsl */ `
  uniform sampler2D pointTexture;
  uniform float uOpacity;
  varying vec3 vColor;
  void main() {
    vec4 tex = texture2D(pointTexture, gl_PointCoord);
    if (tex.a < 0.02) discard;
    gl_FragColor = vec4(vColor, tex.a * uOpacity);
  }
`;

// ---------------------------------------------------------------------------
// Galaxy3DSection component
// ---------------------------------------------------------------------------

/**
 * Immersive 3D galaxy section driven by scroll.
 *
 * Five Three.js layers:
 *   1. Deep background stars (1 200 white points in a far sphere)
 *   2. Spiral-arm brand nebula (3 500 shader particles, 3 arms, colored by radius)
 *   3. Life-word text sprites (46 words floating through the galaxy volume)
 *   4. Central Cia orb with three layered sprite halos
 *   5. 8 domain spheres + knowledge-graph line segments (8 spokes + 8 perimeter)
 *
 * ScrollTrigger drives camera zoom (70 -> 18 on z), orbital arc on x,
 * scene rotation, line opacity, and cycles 3 text overlay stages.
 *
 * Full cleanup of all Three.js geometries, materials, textures, and the
 * WebGL context on unmount.
 */
export function Galaxy3DSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const stageRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Mutable camera state shared between render loop and ScrollTrigger
  const cameraState = useRef<CameraState>({
    z: 70,
    y: 6,
    x: 0,
    sceneRotateY: 0,
  });

  // Three.js disposal tracker
  const threeRef = useRef<ThreeRefs | null>(null);

  const setStageRef = useCallback(
    (index: number) => (el: HTMLDivElement | null) => {
      stageRefs.current[index] = el;
    },
    []
  );

  // --- Three.js scene setup (runs once on mount) ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Respect reduced motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // ─── Scene ───
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.012);

    const camera = new THREE.PerspectiveCamera(
      55,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      800
    );
    camera.position.set(0, 6, 70);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    const particleSprite = createParticleSprite();

    // ─── Layer 1: deep background stars (white, small, far) ───
    const bgPositions = new Float32Array(BG_STAR_COUNT * 3);
    for (let i = 0; i < BG_STAR_COUNT; i++) {
      const r = 200 + Math.random() * 250;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      bgPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      bgPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      bgPositions[i * 3 + 2] = r * Math.cos(phi);
    }
    const bgGeo = new THREE.BufferGeometry();
    bgGeo.setAttribute("position", new THREE.BufferAttribute(bgPositions, 3));
    const bgMat = new THREE.PointsMaterial({
      map: particleSprite,
      color: 0xffffff,
      size: 1.4,
      transparent: true,
      opacity: 0.55,
      alphaTest: 0.005,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const bgStars = new THREE.Points(bgGeo, bgMat);
    scene.add(bgStars);

    // ─── Layer 2: spiral-arm brand nebula (ShaderMaterial) ───
    const nebPositions = new Float32Array(NEBULA_COUNT * 3);
    const nebColors = new Float32Array(NEBULA_COUNT * 3);
    const nebSizes = new Float32Array(NEBULA_COUNT);

    for (let i = 0; i < NEBULA_COUNT; i++) {
      const arm = i % NEBULA_ARM_COUNT;
      const armOffset = (arm / NEBULA_ARM_COUNT) * Math.PI * 2;
      const radiusFactor = Math.pow(Math.random(), 0.55);
      const r = 6 + radiusFactor * 70;
      const theta =
        armOffset + radiusFactor * Math.PI * 3 + (Math.random() - 0.5) * 0.8;
      const yJitter = (Math.random() - 0.5) * 6 * (1 + radiusFactor * 0.6);

      nebPositions[i * 3] = r * Math.cos(theta) + (Math.random() - 0.5) * 2;
      nebPositions[i * 3 + 1] = yJitter;
      nebPositions[i * 3 + 2] = r * Math.sin(theta) + (Math.random() - 0.5) * 2;

      // Color by distance from center: orange -> purple -> lime
      const distRatio = (r - 6) / 70;
      let c: THREE.Color;
      if (distRatio < 0.35) {
        c = NEBULA_PALETTE[Math.floor(Math.random() * 2)];
      } else if (distRatio < 0.7) {
        c = NEBULA_PALETTE[2 + Math.floor(Math.random() * 3)];
      } else {
        c = NEBULA_PALETTE[5 + Math.floor(Math.random() * 2)];
      }
      nebColors[i * 3] = c.r;
      nebColors[i * 3 + 1] = c.g;
      nebColors[i * 3 + 2] = c.b;
      nebSizes[i] = (Math.random() * 1.5 + 0.6) * (1 - distRatio * 0.4);
    }

    const nebGeo = new THREE.BufferGeometry();
    nebGeo.setAttribute("position", new THREE.BufferAttribute(nebPositions, 3));
    nebGeo.setAttribute("color", new THREE.BufferAttribute(nebColors, 3));
    nebGeo.setAttribute("size", new THREE.BufferAttribute(nebSizes, 1));

    const nebMat = new THREE.ShaderMaterial({
      uniforms: {
        pointTexture: { value: particleSprite },
        uTime: { value: 0 },
        uOpacity: { value: 1.0 },
      },
      vertexShader: NEBULA_VERTEX,
      fragmentShader: NEBULA_FRAGMENT,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const nebula = new THREE.Points(nebGeo, nebMat);
    scene.add(nebula);

    // ─── Layer 3: life-word text sprites ───
    const lifeWordSprites: LifeWordSprite[] = [];
    LIFE_WORDS.forEach((word) => {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: createTextSprite(word.t, word.c),
          transparent: true,
          opacity: 0.7,
          blending: THREE.NormalBlending,
          depthWrite: false,
        })
      );
      const r = 22 + Math.random() * 50;
      const theta = Math.random() * Math.PI * 2;
      const yOffset = (Math.random() - 0.5) * 14;
      sprite.position.set(Math.cos(theta) * r, yOffset, Math.sin(theta) * r);
      const sizeScale = 0.85 + Math.random() * 0.6;
      sprite.scale.set(7 * sizeScale, 1.75 * sizeScale, 1);
      scene.add(sprite);
      lifeWordSprites.push({
        sprite,
        baseY: yOffset,
        angle: theta,
        radius: r,
        driftSpeed: 0.00008 + Math.random() * 0.00018,
        pulseOffset: Math.random() * Math.PI * 2,
        baseOpacity: 0.55 + Math.random() * 0.25,
      });
    });

    // ─── Central Cia orb: solid sphere + 3 sprite halos ───
    const orbGroup = new THREE.Group();

    const core = new THREE.Mesh(
      new THREE.SphereGeometry(2.2, 64, 64),
      new THREE.MeshBasicMaterial({
        color: 0xd95f0e,
        transparent: true,
        opacity: 1,
      })
    );
    orbGroup.add(core);

    const haloOrange = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: createGlowSprite(0xd95f0e),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: 0.85,
      })
    );
    haloOrange.scale.set(10, 10, 1);
    orbGroup.add(haloOrange);

    const haloPurple = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: createGlowSprite(0x4f46e5),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: 0.7,
      })
    );
    haloPurple.scale.set(16, 16, 1);
    orbGroup.add(haloPurple);

    const haloLime = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: createGlowSprite(0xa3e635),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: 0.4,
      })
    );
    haloLime.scale.set(24, 24, 1);
    orbGroup.add(haloLime);

    scene.add(orbGroup);

    // ─── 8 domain spheres + sprite halos in 3D space ───
    const domainMeshes: DomainMesh[] = [];
    DOMAINS.forEach((d) => {
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.9, 32, 32),
        new THREE.MeshBasicMaterial({
          color: d.color,
          transparent: true,
          opacity: 1,
        })
      );

      const halo = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: createGlowSprite(d.color),
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          opacity: 0.85,
        })
      );
      halo.scale.set(5, 5, 1);
      sphere.add(halo);

      sphere.position.set(
        Math.cos(d.angle) * d.radius,
        d.yBase,
        Math.sin(d.angle) * d.radius
      );

      scene.add(sphere);
      domainMeshes.push({
        mesh: sphere,
        halo,
        angle: d.angle,
        radius: d.radius,
        yBase: d.yBase,
        orbitSpeed: 0.0003 + Math.random() * 0.0006,
        pulseOffset: Math.random() * Math.PI * 2,
      });
    });

    // ─── Knowledge-graph connection lines ───
    // 8 spokes (center -> domain) + 8 perimeter (domain i -> i+1) = 16 segments
    const lineCount = 16;
    const linePositions = new Float32Array(lineCount * 6);
    const lineColors = new Float32Array(lineCount * 6);

    for (let i = 0; i < lineCount; i++) {
      for (let j = 0; j < 6; j++) {
        linePositions[i * 6 + j] = 0;
        // Soft purple-white tint
        lineColors[i * 6 + j] =
          j % 3 === 0 ? 0.6 : j % 3 === 1 ? 0.55 : 1.0;
      }
    }

    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(linePositions, 3)
    );
    lineGeo.setAttribute("color", new THREE.BufferAttribute(lineColors, 3));
    const lineMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const knowledgeLines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(knowledgeLines);

    /** Update line endpoints every frame to follow orbiting domain spheres. */
    function updateKnowledgeGraph() {
      const pos = knowledgeLines.geometry.attributes.position
        .array as Float32Array;

      // 8 spokes: center (0,0,0) to each domain
      for (let i = 0; i < 8; i++) {
        const d = domainMeshes[i].mesh.position;
        pos[i * 6 + 0] = 0;
        pos[i * 6 + 1] = 0;
        pos[i * 6 + 2] = 0;
        pos[i * 6 + 3] = d.x;
        pos[i * 6 + 4] = d.y;
        pos[i * 6 + 5] = d.z;
      }
      // 8 perimeter links: domain[i] -> domain[(i+1) % 8]
      for (let i = 0; i < 8; i++) {
        const a = domainMeshes[i].mesh.position;
        const b = domainMeshes[(i + 1) % 8].mesh.position;
        const idx = (8 + i) * 6;
        pos[idx + 0] = a.x;
        pos[idx + 1] = a.y;
        pos[idx + 2] = a.z;
        pos[idx + 3] = b.x;
        pos[idx + 4] = b.y;
        pos[idx + 5] = b.z;
      }
      knowledgeLines.geometry.attributes.position.needsUpdate = true;
    }

    // ─── Render loop ───
    const startTime = performance.now();
    let lastFrame = 0;
    let currentAnimId = 0;

    function animate(now: number) {
      currentAnimId = requestAnimationFrame(animate);

      // Throttle to ~60 fps
      if (now - lastFrame < 16) return;
      lastFrame = now;

      const t = (now - startTime) * 0.001;
      nebMat.uniforms.uTime.value = t;

      // Rotate background layers slowly
      bgStars.rotation.y += 0.0001;
      nebula.rotation.y += 0.0006;

      // Pulse central orb
      const pulse = Math.sin(t * 1.6) * 0.06 + 1;
      core.scale.setScalar(pulse);
      haloOrange.scale.set(10 * pulse, 10 * pulse, 1);
      haloPurple.scale.set(16 * pulse * 1.04, 16 * pulse * 1.04, 1);
      haloLime.scale.set(24 * pulse * 1.08, 24 * pulse * 1.08, 1);

      // Orbit domains in 3D
      domainMeshes.forEach((d) => {
        const a = d.angle + t * d.orbitSpeed * 30;
        d.mesh.position.x = Math.cos(a) * d.radius;
        d.mesh.position.z = Math.sin(a) * d.radius;
        d.mesh.position.y = d.yBase + Math.sin(t * 0.7 + d.pulseOffset) * 0.6;
        const sp = 1 + Math.sin(t * 1.4 + d.pulseOffset) * 0.08;
        d.mesh.scale.setScalar(sp);
      });

      // Drift life-word sprites, pulse opacity for depth
      lifeWordSprites.forEach((w) => {
        w.angle += w.driftSpeed;
        w.sprite.position.x = Math.cos(w.angle) * w.radius;
        w.sprite.position.z = Math.sin(w.angle) * w.radius;
        w.sprite.position.y = w.baseY + Math.sin(t * 0.4 + w.pulseOffset) * 1.2;
        w.sprite.material.opacity =
          w.baseOpacity + Math.sin(t * 0.6 + w.pulseOffset) * 0.18;
      });

      // Update knowledge-graph to follow orbiting domains
      updateKnowledgeGraph();

      // Apply scroll-controlled camera + scene rotation
      const cs = cameraState.current;
      scene.rotation.y = cs.sceneRotateY;
      camera.position.set(cs.x, cs.y, cs.z);
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    }

    currentAnimId = requestAnimationFrame(animate);

    // ─── Resize handler ───
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const handleResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (!canvas) return;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        ScrollTrigger.refresh();
      }, 200);
    };
    window.addEventListener("resize", handleResize);

    // Store refs for ScrollTrigger callback and cleanup
    threeRef.current = {
      renderer,
      scene,
      camera,
      animId: currentAnimId,
      resizeTimer,
      resizeHandler: handleResize,
      lineMat,
      nebMat,
    };

    // ─── Cleanup on unmount ───
    return () => {
      cancelAnimationFrame(currentAnimId);
      if (resizeTimer) clearTimeout(resizeTimer);
      window.removeEventListener("resize", handleResize);

      // Dispose every Three.js resource
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
        if (obj instanceof THREE.Points) {
          obj.geometry.dispose();
          if (obj.material instanceof THREE.Material) {
            obj.material.dispose();
          }
        }
        if (obj instanceof THREE.LineSegments) {
          obj.geometry.dispose();
          if (obj.material instanceof THREE.Material) {
            obj.material.dispose();
          }
        }
        if (obj instanceof THREE.Sprite) {
          obj.material.map?.dispose();
          obj.material.dispose();
        }
      });

      particleSprite.dispose();
      renderer.dispose();
      threeRef.current = null;
    };
  }, []);

  // --- ScrollTrigger for camera zoom + text stage cycling ---
  useGSAP(
    () => {
      if (!sectionRef.current) return;

      let lastStage = -1;

      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.5,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const p = self.progress;
          const cs = cameraState.current;

          // Camera zoom: z 70 -> 18, y 6 -> 1, x arcs via sine
          cs.z = 70 - p * 52;
          cs.y = 6 - p * 5;
          cs.x = Math.sin(p * Math.PI) * 8;
          cs.sceneRotateY = p * Math.PI * 0.5; // 90 deg through scroll

          // Knowledge lines fade in as camera approaches
          const refs = threeRef.current;
          if (refs) {
            refs.lineMat.opacity = 0.18 + p * 0.35;
            refs.nebMat.uniforms.uOpacity.value = 0.85 + p * 0.15;
          }

          // Progress bar
          if (progressRef.current) {
            progressRef.current.style.width = `${p * 100}%`;
          }

          // Cycle through 3 text stages (only update on change)
          const stage = p < 0.33 ? 0 : p < 0.66 ? 1 : 2;
          if (stage !== lastStage) {
            lastStage = stage;
            stageRefs.current.forEach((el, i) => {
              if (!el) return;
              el.classList.toggle("visible", i === stage);
            });
          }
        },
      });
    },
    sectionRef,
    []
  );

  return (
    <section
      className="galaxy-3d-section"
      id="galaxy3D"
      ref={sectionRef}
      aria-label="3D Life Galaxy visualization"
    >
      <div className="galaxy-3d-pin">
        <canvas
          className="galaxy-3d-canvas"
          ref={canvasRef}
          aria-hidden="true"
        />
        <div className="galaxy-3d-vignette" aria-hidden="true" />

        <div className="galaxy-3d-overlay">
          {/* Stage 1 — starts visible */}
          <div className="galaxy-3d-stage visible" ref={setStageRef(0)}>
            <div
              className="eyebrow"
              style={{
                marginBottom: 16,
                justifyContent: "center",
                display: "inline-flex",
              }}
            >
              8 Life Domains &middot; One Coach
            </div>
            <h2 className="h-display">
              Your life,
              <br />
              <span className="serif">in motion.</span>
            </h2>
            <p>
              Cia tracks every dimension that matters &mdash; across health,
              finance, career, and beyond.
            </p>
          </div>

          {/* Stage 2 */}
          <div className="galaxy-3d-stage" ref={setStageRef(1)}>
            <div
              className="eyebrow"
              style={{
                marginBottom: 16,
                justifyContent: "center",
                display: "inline-flex",
              }}
            >
              Closer now
            </div>
            <h2 className="h-section">
              Eight orbits. <span className="serif">One mind.</span>
            </h2>
            <p>
              Health &middot; Finance &middot; Career &middot; Relations &middot;
              Mind &middot; Growth &middot; Learning &middot; Purpose
            </p>
          </div>

          {/* Stage 3 */}
          <div className="galaxy-3d-stage" ref={setStageRef(2)}>
            <div
              className="eyebrow"
              style={{
                marginBottom: 16,
                justifyContent: "center",
                display: "inline-flex",
              }}
            >
              All connected
            </div>
            <h2 className="h-section">
              Cia sees how <span className="serif">it all fits.</span>
            </h2>
            <p>
              Your sleep affects your spending. Your career affects your
              relationships. Cia holds the full picture.
            </p>
          </div>
        </div>

        <div className="galaxy-3d-progress" aria-hidden="true">
          <div className="galaxy-3d-progress-label">Scroll to enter</div>
          <div className="galaxy-3d-progress-bar">
            <div className="galaxy-3d-progress-fill" ref={progressRef} />
          </div>
        </div>
      </div>
    </section>
  );
}
