'use client';

import { useRef, type ReactNode } from 'react';
import { useSceneTimeline, type SceneTimelineConfig } from './useSceneTimeline';

interface SceneShellProps extends SceneTimelineConfig {
  id: string;
  ariaLabel: string;
  children: ReactNode | ((state: { progress: number; isActive: boolean; isMobile: boolean }) => ReactNode);
  className?: string;
  /** Force a minimum height in viewport heights (default 100) */
  heightVh?: number;
}

export function SceneShell({
  id,
  ariaLabel,
  children,
  className = '',
  heightVh = 100,
  ...timelineConfig
}: SceneShellProps) {
  const ref = useRef<HTMLElement>(null);
  const { progress, isActive, isMobile } = useSceneTimeline(ref, timelineConfig);

  return (
    <section
      ref={ref}
      id={id}
      aria-label={ariaLabel}
      className={`relative w-full overflow-hidden ${className}`}
      style={{ minHeight: `${heightVh}vh` }}
    >
      {typeof children === 'function'
        ? children({ progress, isActive, isMobile })
        : children}
    </section>
  );
}
