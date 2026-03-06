"use client";

interface Props {
  starCount: number;
  onSwitchToList: () => void;
}

const MOODS = [
  { label: "Calm", color: "#60a5fa" },
  { label: "Happy", color: "#fbbf24" },
  { label: "Reflective", color: "#a78bfa" },
  { label: "Stressed", color: "#f87171" },
];

export function ObservatoryMoodLegend({ starCount, onSwitchToList }: Props) {
  return (
    <div
      className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-6 px-6 py-4"
      style={{ zIndex: 30 }}
    >
      {/* Mood dots */}
      <div className="flex items-center gap-4">
        {MOODS.map((mood) => (
          <div key={mood.label} className="flex items-center gap-1.5">
            <div
              className="rounded-full"
              style={{
                width: 6,
                height: 6,
                backgroundColor: mood.color,
                boxShadow: `0 0 6px 2px ${mood.color}40`,
              }}
            />
            <span
              className="observatory-font-display text-white/40"
              style={{ fontSize: 8, letterSpacing: "0.1em" }}
            >
              {mood.label.toUpperCase()}
            </span>
          </div>
        ))}
      </div>

      {/* Star count badge */}
      <div
        className="observatory-font-display px-3 py-1 rounded-full border border-white/10 text-white/40"
        style={{ fontSize: 8, letterSpacing: "0.12em" }}
      >
        {starCount} STARS MAPPED
      </div>

      {/* List View toggle */}
      <button
        onClick={onSwitchToList}
        className="observatory-font-display px-3 py-1 rounded-full border border-white/10 text-white/30 hover:text-white/50 hover:bg-white/5 transition-all duration-200"
        style={{ fontSize: 8, letterSpacing: "0.12em" }}
      >
        LIST VIEW
      </button>
    </div>
  );
}
