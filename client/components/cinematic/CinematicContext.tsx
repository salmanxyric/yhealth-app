"use client";

import { createContext, useContext, useState, useSyncExternalStore, type ReactNode } from "react";

// ── Domain data ──────────────────────────────────────────────────────────────

export interface Domain {
  id: string;
  label: string;
  subLabel: string;
  color: string;
  icon: string;
}

export const DOMAINS: Domain[] = [
  { id: "mental",       label: "Mental Wellbeing",     subLabel: "your inner world",       color: "#8B5CF6", icon: "🧠" },
  { id: "physical",     label: "Physical Health",      subLabel: "your body's story",       color: "#10B981", icon: "💪" },
  { id: "career",       label: "Career & Purpose",     subLabel: "your professional path",  color: "#3B82F6", icon: "🎯" },
  { id: "relationships",label: "Relationships",        subLabel: "your connections",        color: "#F43F5E", icon: "❤️" },
  { id: "financial",    label: "Financial Health",      subLabel: "your security",          color: "#F59E0B", icon: "💰" },
  { id: "growth",       label: "Personal Growth",      subLabel: "your evolution",          color: "#D97706", icon: "🌱" },
  { id: "spiritual",    label: "Spiritual Life",       subLabel: "your deeper self",        color: "#6366F1", icon: "✨" },
  { id: "recreation",   label: "Recreation",           subLabel: "your joy",               color: "#FB7185", icon: "🎮" },
  { id: "environment",  label: "Physical Environment", subLabel: "your spaces",            color: "#6EE7B7", icon: "🏠" },
  { id: "community",    label: "Community",            subLabel: "your belonging",          color: "#14B8A6", icon: "🤝" },
];

// ── Scene modes ──────────────────────────────────────────────────────────────

export type SceneMode = "constellation" | "contracting" | "ambient" | "timeline" | "fadeout";
export type ActiveAct = 1 | 2 | 3 | 4 | 5;

// ── Cinematic state ──────────────────────────────────────────────────────────

export interface CinematicState {
  progress: number;
  activeAct: ActiveAct;
  isInteractive: boolean;
  selectedDomain: string | null;
  selectedVision: string | null;
  selectedIntensity: string | null;
  canvasOpacity: number;
  sceneMode: SceneMode;
}

const INITIAL_STATE: CinematicState = {
  progress: 0,
  activeAct: 1,
  isInteractive: false,
  selectedDomain: null,
  selectedVision: null,
  selectedIntensity: null,
  canvasOpacity: 1,
  sceneMode: "constellation",
};

// ── Derive act/scene/opacity from raw progress ──────────────────────────────

function deriveFromProgress(progress: number): Pick<CinematicState, "activeAct" | "sceneMode" | "canvasOpacity"> {
  if (progress < 0.17) return { activeAct: 1, sceneMode: "constellation", canvasOpacity: 1 };
  if (progress < 0.22) return { activeAct: 2, sceneMode: "contracting",  canvasOpacity: 1 };
  if (progress < 0.40) return { activeAct: 2, sceneMode: "ambient",      canvasOpacity: Math.max(0.4, 1 - (progress - 0.22) / 0.18 * 0.6) };
  if (progress < 0.70) return { activeAct: 3, sceneMode: "ambient",      canvasOpacity: 0.15 };
  if (progress < 0.93) return { activeAct: 4, sceneMode: "timeline",     canvasOpacity: 0.6 };
  return { activeAct: 5, sceneMode: "fadeout", canvasOpacity: Math.max(0, 0.15 - (progress - 0.93) / 0.07 * 0.15) };
}

// ── Store (external store pattern for 60fps updates without re-renders) ─────

type Listener = () => void;

function createCinematicStore() {
  let state = { ...INITIAL_STATE };
  const listeners = new Set<Listener>();

  function getState() { return state; }

  function subscribe(listener: Listener) {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }

  function notify() { listeners.forEach((l) => l()); }

  function setProgress(progress: number) {
    const derived = deriveFromProgress(progress);
    state = { ...state, progress, ...derived };
    notify();
  }

  function setInteractive(isInteractive: boolean) {
    state = { ...state, isInteractive };
    notify();
  }

  function setSelection(key: "selectedDomain" | "selectedVision" | "selectedIntensity", value: string | null) {
    state = { ...state, [key]: value };
    notify();
  }

  return { getState, subscribe, setProgress, setInteractive, setSelection };
}

// ── React context ────────────────────────────────────────────────────────────

type CinematicStore = ReturnType<typeof createCinematicStore>;

const CinematicCtx = createContext<CinematicStore | null>(null);

export function CinematicProvider({ children }: { children: ReactNode }) {
  const [store] = useState<CinematicStore>(createCinematicStore);

  return <CinematicCtx.Provider value={store}>{children}</CinematicCtx.Provider>;
}

export function useCinematicStore(): CinematicStore {
  const store = useContext(CinematicCtx);
  if (!store) throw new Error("useCinematicStore must be used within CinematicProvider");
  return store;
}

export function useCinematicState(): CinematicState {
  const store = useCinematicStore();
  return useSyncExternalStore(store.subscribe, store.getState, store.getState);
}
