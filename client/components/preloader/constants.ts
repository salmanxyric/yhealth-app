import * as THREE from "three";

// ---------------------------------------------------------------------------
// Color Tokens
// ---------------------------------------------------------------------------

export const COLORS = {
  coreCyan: new THREE.Color("#00E5FF"),
  electricBlue: new THREE.Color("#2979FF"),
  violet: new THREE.Color("#7C4DFF"),
  gold: new THREE.Color("#FFD740"),
  whiteHighlight: new THREE.Color("#FFFFFF"),
  deepBlack: new THREE.Color("#0A0A0F"),
  darkNavy: new THREE.Color("#0D1117"),
  paleBlue: new THREE.Color("#E0F7FA"),
} as const;

export const CSS_COLORS = {
  coreCyan: "#00E5FF",
  electricBlue: "#2979FF",
  violet: "#7C4DFF",
  gold: "#FFD740",
  deepBlack: "#0A0A0F",
} as const;

// ---------------------------------------------------------------------------
// Core Icosahedron
// ---------------------------------------------------------------------------

export const CORE = {
  radius: 1,
  detail: 1,
  innerSphereRadius: 0.6,
  innerSphereOpacity: 0.3,
  innerEmissiveIntensity: 0.8,
  breatheMin: 0.95,
  breatheMax: 1.05,
  breathePeriod: 3,
  rotationYPeriod: 8,
  rotationXPeriod: 12,
  emissiveMin: 0.6,
  emissiveMax: 1.0,
} as const;

// ---------------------------------------------------------------------------
// Orbital Rings
// ---------------------------------------------------------------------------

export const RINGS = [
  {
    radius: 1.8,
    tubeRadius: 0.008,
    tilt: {
      x: THREE.MathUtils.degToRad(15),
      y: 0,
      z: 0,
    },
    revolutionPeriod: 6,
    color: COLORS.coreCyan,
    opacity: 0.6,
    nodeCount: 2,
    nodeRadius: 0.04,
  },
  {
    radius: 2.7,
    tubeRadius: 0.006,
    tilt: {
      x: 0,
      y: 0,
      z: THREE.MathUtils.degToRad(-25),
    },
    revolutionPeriod: 10,
    color: COLORS.electricBlue,
    opacity: 0.4,
    nodeCount: 3,
    nodeRadius: 0.04,
  },
  {
    radius: 3.8,
    tubeRadius: 0.004,
    tilt: {
      x: THREE.MathUtils.degToRad(40),
      y: THREE.MathUtils.degToRad(10),
      z: 0,
    },
    revolutionPeriod: 16,
    color: COLORS.violet,
    opacity: 0.3,
    nodeCount: 2,
    nodeRadius: 0.04,
  },
] as const;

// ---------------------------------------------------------------------------
// Neural Particles (converging toward core)
// ---------------------------------------------------------------------------

export const NEURAL_PARTICLES = {
  count: 200,
  spawnRadiusMin: 5,
  spawnRadiusMax: 6,
  coreRadius: 1.2,
  travelTimeMin: 2,
  travelTimeMax: 4,
  trailLength: 4,
  sizeMin: 0.8,
  sizeMax: 2.5,
} as const;

// ---------------------------------------------------------------------------
// Ambient Particles (floating background field)
// ---------------------------------------------------------------------------

export const AMBIENT_PARTICLES = {
  count: 100,
  radiusMin: 8,
  radiusMax: 15,
  sizeMin: 0.5,
  sizeMax: 1.5,
  driftSpeed: 0.001,
  opacityMin: 0.3,
  opacityMax: 0.6,
} as const;

// ---------------------------------------------------------------------------
// HUD Panels
// ---------------------------------------------------------------------------

export const PANELS = {
  count: 4,
  positions: [
    [-3.5, 1.5, -1] as [number, number, number],
    [3.5, 1.0, -1] as [number, number, number],
    [-3.0, -1.5, -1] as [number, number, number],
    [3.0, -1.2, -1] as [number, number, number],
  ] as [number, number, number][],
  sizes: [
    [1.8, 0.9] as [number, number],
    [1.6, 1.0] as [number, number],
    [1.4, 0.8] as [number, number],
    [1.5, 0.9] as [number, number],
  ] as [number, number][],
  opacityMin: 0.05,
  opacityMax: 0.15,
  floatAmplitude: 0.05,
  floatPeriods: [4, 5, 4.5, 6] as const,
} as const;

// ---------------------------------------------------------------------------
// Ground Grid
// ---------------------------------------------------------------------------

export const GRID = {
  size: 20,
  divisions: 40,
  yPosition: -2,
  lineOpacityBase: 0.08,
  lineOpacityRipple: 0.3,
  rippleInterval: 3,
  rippleSpeed: 2,
  fadeRadius: 8,
} as const;

// ---------------------------------------------------------------------------
// Camera
// ---------------------------------------------------------------------------

export const CAMERA = {
  fov: 60,
  near: 0.1,
  far: 100,
  orbitRadius: 7,
  orbitElevationDeg: 15,
  orbitPeriod: 40,
  microZoomAmount: 3,
  microZoomInDuration: 1.5,
  microZoomOutDuration: 2,
  microZoomInterval: 9,
  verticalBobAmplitudeDeg: 3,
  verticalBobPeriod: 12,
} as const;

// ---------------------------------------------------------------------------
// Post-Processing
// ---------------------------------------------------------------------------

export const POST_PROCESSING = {
  bloom: {
    luminanceThreshold: 0.4,
    intensity: 0.6,
    mipmapBlur: true,
  },
  depthOfField: {
    focusDistance: 0.02,
    focalLength: 0.05,
    bokehScale: 2,
  },
  vignette: {
    offset: 0.3,
    darkness: 0.7,
  },
  chromaticAberration: {
    offset: 0.0005,
  },
  noise: {
    opacity: 0.03,
    premultiply: true,
  },
} as const;

// ---------------------------------------------------------------------------
// Lighting
// ---------------------------------------------------------------------------

export const LIGHTING = {
  coreGlow: {
    color: "#FFD740",
    intensity: 2.0,
    pulseMin: 1.5,
    pulseMax: 2.5,
  },
  rim: {
    color: "#2979FF",
    intensity: 0.5,
    position: [2, 3, -5] as [number, number, number],
  },
  fill: {
    color: "#FFFFFF",
    intensity: 0.05,
  },
  leftAccent: {
    color: "#7C4DFF",
    intensity: 0.8,
    position: [-4, 3, 2] as [number, number, number],
    angle: Math.PI / 6,
  },
  rightAccent: {
    color: "#00E5FF",
    intensity: 0.6,
    position: [4, 2, -2] as [number, number, number],
    angle: Math.PI / 7.2,
  },
} as const;

// ---------------------------------------------------------------------------
// Timing
// ---------------------------------------------------------------------------

export const TIMING = {
  minDisplayMs: 5000,
  maxDisplayMs: 10000,
  dissolutionDurationMs: 1500,
  flashDurationMs: 400,
  shatterDurationMs: 600,
  fadeDurationMs: 500,
  routeLoaderFadeInMs: 200,
  routeLoaderFadeOutMs: 300,
  progressSmoothingDuration: 0.8,
} as const;

// ---------------------------------------------------------------------------
// Session Storage Key
// ---------------------------------------------------------------------------

export const SPLASH_SHOWN_KEY = "balencia-splash-shown" as const;
