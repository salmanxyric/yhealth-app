'use client';
import { useEffect, useState } from 'react';

export function ScrollLine() {
  const [p, setP] = useState(0);
  useEffect(() => {
    let raf = 0;
    function upd() {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      setP(Math.min(1, Math.max(0, window.scrollY / max)));
      raf = requestAnimationFrame(upd);
    }
    raf = requestAnimationFrame(upd);
    return () => cancelAnimationFrame(raf);
  }, []);
  const len = 2400;
  const offset = len * (1 - p);
  return (
    <svg
      aria-hidden="true"
      className="fixed left-6 top-0 h-screen w-10 hidden lg:block pointer-events-none z-0"
      viewBox="0 0 80 2400"
      preserveAspectRatio="none"
    >
      <path
        d="M 40 0 Q 20 200 40 400 T 40 800 Q 60 1100 40 1400 T 40 1800 Q 20 2100 40 2400"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        style={{
          color: 'rgba(17,17,17,0.35)',
          strokeDasharray: len,
          strokeDashoffset: offset,
          transition: 'stroke-dashoffset 0.2s linear',
        }}
      />
    </svg>
  );
}
