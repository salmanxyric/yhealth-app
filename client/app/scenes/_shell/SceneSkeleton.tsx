'use client';

interface SceneSkeletonProps {
  /** Approximate height of the real scene so the scroll doesn't jump when it loads */
  heightVh?: number;
  /** Optional eyebrow label shown faintly for unimplemented scenes */
  label?: string;
}

export function SceneSkeleton({ heightVh = 100, label }: SceneSkeletonProps) {
  return (
    <section
      className="relative w-full flex items-center justify-center overflow-hidden"
      style={{ height: `${heightVh}vh`, background: '#0B0F17' }}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,0.06),transparent_60%)]" />
      <div className="relative flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400/20 to-purple-500/20 animate-pulse" />
        {label && (
          <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{label}</span>
        )}
      </div>
    </section>
  );
}
