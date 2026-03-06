"use client";

interface Props {
  entryCount: number;
  onNewEntry: () => void;
}

export function ObservatoryHeader({ entryCount, onNewEntry }: Props) {
  return (
    <div
      className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4"
      style={{ zIndex: 30 }}
    >
      {/* Title */}
      <div>
        <h2
          className="observatory-font-display text-white/90"
          style={{ fontSize: 18, letterSpacing: "0.2em" }}
        >
          MIND OBSERVATORY
        </h2>
        <p
          className="observatory-font-body text-white/40 mt-0.5"
          style={{ fontSize: 11, letterSpacing: "0.06em" }}
        >
          {entryCount} {entryCount === 1 ? "reflection" : "reflections"} mapped
        </p>
      </div>

      {/* New Reflection button */}
      <button
        onClick={onNewEntry}
        className="observatory-font-display flex items-center gap-2 px-4 py-2 rounded-full border border-purple-500/30 bg-purple-500/10 backdrop-blur-sm text-purple-200 hover:bg-purple-500/20 hover:border-purple-400/50 transition-all duration-300"
        style={{ fontSize: 10, letterSpacing: "0.18em" }}
      >
        <span style={{ fontSize: 14 }}>+</span>
        NEW REFLECTION
      </button>
    </div>
  );
}
