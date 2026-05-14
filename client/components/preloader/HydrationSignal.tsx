"use client";

import { useEffect } from "react";

export function HydrationSignal() {
  useEffect(() => {
    window.dispatchEvent(new Event("app-hydrated"));
  }, []);
  return null;
}
