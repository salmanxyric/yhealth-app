"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { useGSAP, ScrollTrigger } from "@/hooks/use-gsap";

/* ------------------------------------------------------------------ */
/*  Gallery item data                                                  */
/* ------------------------------------------------------------------ */

interface GalleryItem {
  art: string;
  label: string;
}

const GALLERY_ITEMS: GalleryItem[] = [
  { art: "art-movement", label: "Movement" },
  { art: "art-stillness", label: "Stillness" },
  { art: "art-nourishment", label: "Nourishment" },
  { art: "art-connection", label: "Connection" },
  { art: "art-reflection", label: "Reflection" },
  { art: "art-recovery", label: "Recovery" },
  { art: "art-purpose", label: "Purpose" },
  { art: "art-growth", label: "Growth" },
];

const STAGE_LABELS = GALLERY_ITEMS.map((item) => item.label);
const UNIQUE_COUNT = GALLERY_ITEMS.length;

/** Duplicated items for seamless circular loop */
const ITEMS_DOUBLED = [...GALLERY_ITEMS, ...GALLERY_ITEMS];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function GallerySection() {
  const pinWrapRef = useRef<HTMLElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);

  const [stageNum, setStageNum] = useState("01");
  const [stageName, setStageName] = useState("Movement");

  /* ---- Mutable animation state (no re-renders) ---- */
  const state = useRef({
    pos: 0,
    target: 0,
    basePos: 0,
    dragOffset: 0,
    isDown: false,
    startX: 0,
    lastActiveIdx: -1,
    loopWidth: 0,
    rafId: 0,
    decayInterval: 0,
  });

  /* ---- Render loop: lerp, wrap, per-card bend curve, active detect ---- */
  const update = useCallback(() => {
    const s = state.current;
    const track = trackRef.current;
    const gallery = galleryRef.current;
    if (!track || !gallery) return;

    // Lerp toward target
    s.pos += (s.target - s.pos) * 0.14;

    // Modulo wrap for visual rendering
    const loopW = s.loopWidth;
    if (loopW <= 0) {
      s.rafId = requestAnimationFrame(update);
      return;
    }

    let visualPos = s.pos % loopW;
    if (visualPos > 0) visualPos -= loopW;
    track.style.transform = `translate(${visualPos.toFixed(2)}px, -50%)`;

    // Per-card bend curve + active center detection
    const galleryRect = gallery.getBoundingClientRect();
    const centerX = galleryRect.left + galleryRect.width / 2;
    const halfWidth = galleryRect.width / 2;

    const items = track.children;
    let closestDist = Infinity;
    let activeItem: HTMLElement | null = null;

    for (let i = 0; i < items.length; i++) {
      const item = items[i] as HTMLElement;
      const rect = item.getBoundingClientRect();
      const itemCenter = rect.left + rect.width / 2;
      const distAbsPx = Math.abs(itemCenter - centerX);
      if (distAbsPx < closestDist) {
        closestDist = distAbsPx;
        activeItem = item;
      }

      const dist = Math.max(-1.8, Math.min(1.8, (itemCenter - centerX) / halfWidth));
      const absDist = Math.abs(dist);
      const rotY = -dist * 22;
      const transY = absDist * 70;
      const scale = 1 - absDist * 0.15;
      const opacity = Math.max(0.25, 1 - absDist * 0.4);

      item.style.transform = `translateY(${transY.toFixed(1)}px) rotateY(${rotY.toFixed(1)}deg) scale(${scale.toFixed(3)})`;
      item.style.opacity = opacity.toFixed(2);
    }

    // Toggle active center class
    if (activeItem) {
      const idx = Array.prototype.indexOf.call(items, activeItem);
      if (idx !== s.lastActiveIdx) {
        for (let i = 0; i < items.length; i++) {
          (items[i] as HTMLElement).classList.remove("cg-active");
        }
        activeItem.classList.add("cg-active");
        s.lastActiveIdx = idx;
      }
    }

    s.rafId = requestAnimationFrame(update);
  }, []);

  /* ---- ScrollTrigger pin + scroll-driven carousel ---- */
  useGSAP(
    () => {
      const pinWrap = pinWrapRef.current;
      const track = trackRef.current;
      if (!pinWrap || !track) return;

      // Measure item dimensions
      const firstItem = track.children[0] as HTMLElement | undefined;
      if (!firstItem) return;
      const itemWidth = firstItem.offsetWidth || 280;
      const gap = 24;
      const stepWidth = itemWidth + gap;
      const loopWidth = stepWidth * UNIQUE_COUNT;

      const s = state.current;
      s.loopWidth = loopWidth;
      s.pos = -loopWidth / 2;
      s.target = s.pos;
      s.basePos = s.pos;

      const isDesktop = window.innerWidth > 880;

      if (isDesktop) {
        const pinScrollDistance = window.innerHeight * 3;
        pinWrap.style.height = `${pinScrollDistance + window.innerHeight}px`;

        ScrollTrigger.create({
          trigger: pinWrap,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.6,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const p = self.progress;

            // Map scroll progress 0-1 to one full carousel loop
            s.basePos = -loopWidth / 2 - p * loopWidth;
            s.target = s.basePos + s.dragOffset;

            // Stage label + progress bar
            const stageIdx = Math.min(
              Math.floor(p * UNIQUE_COUNT + 0.0001),
              UNIQUE_COUNT - 1
            );
            setStageNum(String(stageIdx + 1).padStart(2, "0"));
            setStageName(STAGE_LABELS[stageIdx]);

            if (progressFillRef.current) {
              progressFillRef.current.style.width = `${p * 100}%`;
            }
          },
        });

        // Decay drag offset over time when not actively dragging
        s.decayInterval = window.setInterval(() => {
          if (!s.isDown && Math.abs(s.dragOffset) > 0.5) {
            s.dragOffset *= 0.92;
            if (Math.abs(s.dragOffset) < 0.5) s.dragOffset = 0;
            s.target = s.basePos + s.dragOffset;
          }
        }, 16);
      } else {
        // Mobile: simple auto-drift fallback
        let lastUser = 0;
        s.decayInterval = window.setInterval(() => {
          if (!s.isDown && performance.now() - lastUser > 1000) {
            s.target -= 0.4;
          }
        }, 16);
      }

      // Start render loop
      s.rafId = requestAnimationFrame(update);
    },
    pinWrapRef,
    []
  );

  /* ---- Drag / touch handlers (added outside GSAP context) ---- */
  useEffect(() => {
    const gallery = galleryRef.current;
    if (!gallery) return;
    const s = state.current;

    const onMouseDown = (e: MouseEvent) => {
      s.isDown = true;
      s.startX = e.clientX;
      e.preventDefault();
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!s.isDown) return;
      const delta = (e.clientX - s.startX) * 1.4;
      s.startX = e.clientX;
      s.dragOffset += delta;
      s.target = s.basePos + s.dragOffset;
    };
    const onMouseUp = () => {
      s.isDown = false;
    };

    const onTouchStart = (e: TouchEvent) => {
      s.isDown = true;
      s.startX = e.touches[0].clientX;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!s.isDown) return;
      const delta = (e.touches[0].clientX - s.startX) * 1.4;
      s.startX = e.touches[0].clientX;
      s.dragOffset += delta;
      s.target = s.basePos + s.dragOffset;
    };
    const onTouchEnd = () => {
      s.isDown = false;
    };

    gallery.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    gallery.addEventListener("touchstart", onTouchStart, { passive: true });
    gallery.addEventListener("touchmove", onTouchMove, { passive: true });
    gallery.addEventListener("touchend", onTouchEnd);

    return () => {
      gallery.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);

      gallery.removeEventListener("touchstart", onTouchStart);
      gallery.removeEventListener("touchmove", onTouchMove);
      gallery.removeEventListener("touchend", onTouchEnd);

      cancelAnimationFrame(s.rafId);
      clearInterval(s.decayInterval);
    };
  }, []);

  return (
    <section className="gallery-pin-wrap" id="galleryPinWrap" ref={pinWrapRef}>
      <section className="gallery-section">
        {/* Progress bar */}
        <div className="gallery-progress">
          <div
            className="gallery-progress-fill"
            ref={progressFillRef}
          />
        </div>

        {/* Stage label (top-right) */}
        <div className="gallery-stage-label">
          <span className="gallery-stage-label-num">{stageNum}</span>
          <span style={{ opacity: 0.4 }}>/ 08 &mdash;</span>
          <span>{stageName}</span>
        </div>

        {/* Header */}
        <div className="gallery-header">
          <div className="eyebrow" style={{ marginBottom: 16 }}>
            Moments that matter
          </div>
          <h2 className="h-section">
            A life worth <span className="serif">living, fully.</span>
          </h2>
          <p
            style={{
              color: "var(--muted-light)",
              fontSize: 16,
              maxWidth: 520,
              margin: "24px auto 0",
              lineHeight: 1.5,
            }}
          >
            Every domain Cia coaches you through. Every part of who you&rsquo;re
            becoming.
          </p>
        </div>

        {/* Gallery stage area */}
        <div className="gallery-stage-wrap">
          <div className="circular-gallery" id="circularGallery" ref={galleryRef}>
            <div className="cg-track" ref={trackRef}>
              {ITEMS_DOUBLED.map((item, i) => (
                <div className="cg-item" key={`${item.art}-${i}`}>
                  <div
                    className={`premium-gallery-art ${item.art}`}
                    role="img"
                    aria-label={`Premium ${item.label.toLowerCase()} visual`}
                  />
                  <div className="cg-label">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="gallery-hint">
            Scroll to explore &mdash; center card lights up live
          </div>
        </div>
      </section>
    </section>
  );
}

export default GallerySection;
