"use client";

interface Props {
  cx: number;
  cy: number;
}

export function MindCore({ cx, cy }: Props) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: cx,
        top: cy,
        transform: "translate(-50%, -50%)",
        zIndex: 10,
      }}
    >
      {/* Central orb */}
      <div
        className="core-pulse rounded-full"
        style={{
          width: 164,
          height: 164,
          background:
            "radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(168,85,247,0.6) 40%, rgba(88,28,135,0.2) 70%, transparent 100%)",
          boxShadow:
            "0 0 80px 24px rgba(168,85,247,0.35), 0 0 160px 60px rgba(139,92,246,0.15)",
        }}
      />

      {/* Ripple rings (4 staggered) */}
      {[0, 1, 2, 3].map((i) => (
        <div
          key={`ripple-${i}`}
          className="core-ripple absolute rounded-full border border-purple-400/20"
          style={{
            width: 164,
            height: 164,
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            animationDelay: `${i * 0.75}s`,
          }}
        />
      ))}

      {/* Orbit ring 1 — slow clockwise */}
      <div
        className="core-orbit-ring absolute rounded-full border border-purple-500/10"
        style={{
          width: 320,
          height: 320,
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          animationDuration: "12s",
        }}
      />

      {/* Orbit ring 2 — slower counter-clockwise */}
      <div
        className="core-orbit-ring absolute rounded-full border border-indigo-400/8"
        style={{
          width: 440,
          height: 440,
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          animationDuration: "18s",
          animationDirection: "reverse",
        }}
      />

      {/* Orbital particles (6) */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const orbitRadius = i < 3 ? 160 : 220;
        const size = 4 + (i % 3) * 2;
        const duration = 6 + i * 0.4;
        const colors = [
          "bg-purple-300",
          "bg-indigo-300",
          "bg-blue-300",
          "bg-violet-300",
          "bg-purple-200",
          "bg-indigo-200",
        ];
        return (
          <div
            key={`particle-${i}`}
            className="core-particle absolute"
            style={{
              left: "50%",
              top: "50%",
              width: orbitRadius * 2,
              height: orbitRadius * 2,
              marginLeft: -orbitRadius,
              marginTop: -orbitRadius,
              animationDuration: `${duration}s`,
              animationDelay: `${i * -1}s`,
            }}
          >
            <div
              className={`absolute rounded-full ${colors[i]} opacity-60`}
              style={{
                width: size,
                height: size,
                top: 0,
                left: "50%",
                transform: "translateX(-50%)",
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
