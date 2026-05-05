'use client';

const NODES = [
  { cx: 15, cy: 50, r: 2.5, delay: 0 },
  { cx: 85, cy: 50, r: 2, delay: 1.5 },
  { cx: 50, cy: 12, r: 2.5, delay: 3 },
  { cx: 50, cy: 88, r: 2, delay: 4.5 },
  { cx: 25, cy: 20, r: 1.8, delay: 2 },
  { cx: 75, cy: 20, r: 1.8, delay: 5 },
  { cx: 25, cy: 80, r: 2, delay: 3.5 },
  { cx: 75, cy: 80, r: 2, delay: 1 },
  { cx: 40, cy: 35, r: 1.5, delay: 6 },
  { cx: 60, cy: 65, r: 1.5, delay: 7 },
];

const CONNECTIONS = [
  [0, 4], [4, 2], [2, 5], [5, 1], [1, 7], [7, 3], [3, 6], [6, 0],
  [0, 8], [1, 9], [8, 9], [4, 8], [5, 9], [6, 9], [7, 8],
];

export function OrbitalBackground({ className = '' }: { className?: string }) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id="hubGlow" cx="50%" cy="45%" r="30%">
            <stop offset="0%" stopColor="rgba(16,185,129,0.08)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <filter id="nodeGlow">
            <feGaussianBlur stdDeviation="0.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Central hub glow */}
        <circle cx="50" cy="45" r="30" fill="url(#hubGlow)" />

        {/* Orbital rings */}
        <ellipse
          cx="50" cy="50" rx="42" ry="28"
          fill="none"
          stroke="rgba(16,185,129,0.06)"
          strokeWidth="0.3"
          strokeDasharray="3 4"
          className="animate-[orbit-ring-1_40s_linear_infinite]"
          style={{ transformOrigin: '50% 50%' }}
        />
        <ellipse
          cx="50" cy="50" rx="35" ry="22"
          fill="none"
          stroke="rgba(6,182,212,0.05)"
          strokeWidth="0.25"
          strokeDasharray="2 5"
          className="animate-[orbit-ring-2_55s_linear_infinite]"
          style={{ transformOrigin: '50% 50%' }}
        />
        <ellipse
          cx="50" cy="50" rx="48" ry="35"
          fill="none"
          stroke="rgba(168,85,247,0.04)"
          strokeWidth="0.2"
          strokeDasharray="4 6"
          className="animate-[orbit-ring-3_70s_linear_infinite]"
          style={{ transformOrigin: '50% 50%' }}
        />

        {/* Neural connections */}
        {CONNECTIONS.map(([from, to], i) => (
          <line
            key={`conn-${i}`}
            x1={NODES[from].cx}
            y1={NODES[from].cy}
            x2={NODES[to].cx}
            y2={NODES[to].cy}
            stroke="rgba(16,185,129,0.06)"
            strokeWidth="0.15"
            className="animate-[neural-line-flow_8s_ease-in-out_infinite]"
            style={{
              animationDelay: `${i * 0.6}s`,
              strokeDasharray: '2 3',
            }}
          />
        ))}

        {/* Nodes */}
        {NODES.map((node, i) => (
          <g key={`node-${i}`} filter="url(#nodeGlow)">
            <circle
              cx={node.cx}
              cy={node.cy}
              r={node.r}
              fill="rgba(16,185,129,0.15)"
              className="animate-[neural-pulse_4s_ease-in-out_infinite]"
              style={{ animationDelay: `${node.delay}s` }}
            />
            <circle
              cx={node.cx}
              cy={node.cy}
              r={node.r * 0.4}
              fill="rgba(16,185,129,0.4)"
            />
          </g>
        ))}
      </svg>
    </div>
  );
}
