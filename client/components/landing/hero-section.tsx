"use client";

import { useRef, useState, useEffect, useCallback, Fragment } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useScroll, useInView, useMotionValue, useSpring } from "framer-motion";
import { ArrowRight, Play, Sparkles, Brain, Activity, Heart, Zap, Shield, Cpu } from "lucide-react";
import { useGSAP } from "@/hooks/use-gsap";
import { gsap } from "@/lib/gsap-init";
import { useAuth } from "@/app/context/AuthContext";

const stats = [
  { value: 150, suffix: "K+", label: "Lives Transformed" },
  { value: 97, suffix: "%", label: "Goal Completion" },
  { value: 4.9, suffix: "/5", label: "User Rating", decimals: 1 },
];

const pillars = [
  { icon: Activity, label: "Fitness", color: "from-cyan-400 to-cyan-600", glow: "cyan" },
  { icon: Heart, label: "Nutrition", color: "from-purple-400 to-purple-600", glow: "purple" },
  { icon: Brain, label: "Wellbeing", color: "from-pink-400 to-pink-600", glow: "pink" },
];

// ─── Typewriter effect with glitch ───────────────────────────────────
function TypewriterText({ text, className = "", delay = 0 }: { text: string; className?: string; delay?: number }) {
  const [displayedChars, setDisplayedChars] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const [glitchActive, setGlitchActive] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    const timeout = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        i++;
        setDisplayedChars(i);
        // Random glitch effect
        if (Math.random() < 0.1 && i < text.length) {
          setGlitchActive(true);
          setTimeout(() => setGlitchActive(false), 50);
        }
        if (i >= text.length) {
          clearInterval(interval);
          setTimeout(() => setShowCursor(false), 2000);
        }
      }, 70);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [isInView, text, delay]);

  return (
    <span ref={ref} className={`relative ${className}`}>
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 10, rotateX: -90 }}
          animate={i < displayedChars ? { opacity: 1, y: 0, rotateX: 0 } : { opacity: 0, y: 10, rotateX: -90 }}
          transition={{ duration: 0.1 }}
          className={`inline-block ${glitchActive && i === displayedChars - 1 ? 'text-primary glitch-text' : ''}`}
          style={{ whiteSpace: char === " " ? "pre" : undefined, transformStyle: "preserve-3d" }}
        >
          {char}
        </motion.span>
      ))}
      {showCursor && isInView && (
        <motion.span
          animate={{ opacity: [1, 0], scaleY: [1, 0.5, 1] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
          className="inline-block w-[3px] h-[0.9em] bg-primary ml-0.5 align-middle shadow-[0_0_10px_hsl(var(--primary))]"
        />
      )}
    </span>
  );
}

// ─── Animated count-up hook ──────────────────────────────────────────
function useCountUp(target: number, decimals = 0, duration = 1500, enabled = false) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(parseFloat((eased * target).toFixed(decimals)));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, decimals, duration, enabled]);

  return value;
}

// ─── Animated Stat with holographic effect ──────────────────────────
function AnimatedStat({ value, suffix, label, decimals = 0, delay }: {
  value: number; suffix: string; label: string; decimals?: number; delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const count = useCountUp(value, decimals, 1500, isInView);
  const displayValue = Number.isFinite(count) ? count : value;
  const valueStr = decimals > 0 ? displayValue.toFixed(decimals) : String(Math.round(displayValue));

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="text-center group cursor-default"
    >
      <div className="relative">
        <div className="text-2xl sm:text-3xl font-bold gradient-text tabular-nums holographic-text">
          {valueStr}{suffix}
        </div>
        <motion.div
          className="absolute -inset-2 rounded-lg bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        />
      </div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </motion.div>
  );
}

// ─── Scroll progress bar (cyberpunk style) ──────────────────────────
function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[3px] z-[100] origin-left"
      style={{
        scaleX,
        background: "linear-gradient(90deg, hsl(var(--primary)), hsl(190 90% 50%), hsl(280 80% 60%), hsl(330 80% 60%))",
        boxShadow: "0 0 20px hsl(var(--primary)), 0 0 40px hsl(190 90% 50%)",
      }}
    />
  );
}

// ─── Sci-Fi Grid Floor ───────────────────────────────────────────────
function SciFiGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ perspective: "1000px" }}>
      {/* Horizon grid */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[60%] origin-bottom"
        style={{ 
          transform: "rotateX(60deg)",
          background: `
            linear-gradient(to bottom, transparent 0%, hsl(var(--primary) / 0.03) 100%),
            linear-gradient(90deg, hsl(var(--primary) / 0.2) 1px, transparent 1px),
            linear-gradient(hsl(var(--primary) / 0.2) 1px, transparent 1px)
          `,
          backgroundSize: "100% 100%, 80px 80px, 80px 80px",
          maskImage: "linear-gradient(to top, black 0%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to top, black 0%, transparent 100%)",
        }}
      >
        {/* Animated grid lines moving */}
        <motion.div
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(90deg, transparent 0%, hsl(var(--primary) / 0.3) 50%, transparent 100%)
            `,
            backgroundSize: "200% 100%",
          }}
          animate={{
            backgroundPosition: ["200% 0%", "0% 0%"],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
      </div>
      
      {/* Floating grid nodes */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-primary"
          style={{
            left: `${5 + (i * 4.5)}%`,
            bottom: `${10 + (i % 5) * 8}%`,
            boxShadow: "0 0 10px hsl(var(--primary)), 0 0 20px hsl(var(--primary))",
          }}
          animate={{
            opacity: [0.2, 1, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 2 + (i % 3),
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  );
}

// ─── Data Stream Animation ───────────────────────────────────────────
function DataStreams() {
  const streams = [
    { x: 10, delay: 0, speed: 3, color: "hsl(var(--primary))" },
    { x: 25, delay: 0.5, speed: 4, color: "hsl(190 90% 50%)" },
    { x: 40, delay: 1, speed: 2.5, color: "hsl(280 80% 60%)" },
    { x: 60, delay: 0.3, speed: 3.5, color: "hsl(330 80% 60%)" },
    { x: 75, delay: 0.8, speed: 2, color: "hsl(var(--primary))" },
    { x: 90, delay: 0.2, speed: 4.5, color: "hsl(190 90% 50%)" },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {streams.map((stream, i) => (
        <motion.div
          key={i}
          className="absolute w-[2px] h-20 rounded-full"
          style={{
            left: `${stream.x}%`,
            background: `linear-gradient(to bottom, transparent, ${stream.color}, transparent)`,
            boxShadow: `0 0 20px ${stream.color}, 0 0 40px ${stream.color}`,
          }}
          animate={{
            top: ["-10%", "110%"],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: stream.speed,
            repeat: Infinity,
            delay: stream.delay,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}

// ─── Holographic Card ────────────────────────────────────────────────
function HolographicCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setRotateX((y - 0.5) * -20);
    setRotateY((x - 0.5) * 20);
    setGlarePosition({ x: x * 100, y: y * 100 });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setGlarePosition({ x: 50, y: 50 });
  };

  return (
    <div
      ref={cardRef}
      className={`relative ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        transformStyle: "preserve-3d",
        transition: "transform 0.1s ease-out",
      }}
    >
      {/* Holographic gradient overlay */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none z-10"
        style={{
          background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(255,255,255,0.3) 0%, transparent 60%)`,
          mixBlendMode: "overlay",
        }}
      />
      {/* Rainbow border glow */}
      <div 
        className="absolute -inset-[1px] rounded-2xl opacity-50 blur-sm"
        style={{
          background: "linear-gradient(135deg, hsl(var(--primary)), hsl(190 90% 50%), hsl(280 80% 60%), hsl(330 80% 60%))",
        }}
      />
      {children}
    </div>
  );
}

// ─── AI Core with enhanced 3D tilt and sci-fi elements ────────────────
function AICore() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springRotateX = useSpring(rotateX, { stiffness: 150, damping: 20 });
  const springRotateY = useSpring(rotateY, { stiffness: 150, damping: 20 });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    rotateY.set(dx * 15);
    rotateX.set(-dy * 15);
  }, [rotateX, rotateY]);

  const handleMouseLeave = useCallback(() => {
    rotateX.set(0);
    rotateY.set(0);
  }, [rotateX, rotateY]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center"
      style={{ perspective: "1000px" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        className="relative w-full h-full flex items-center justify-center"
        style={{ rotateX: springRotateX, rotateY: springRotateY, transformStyle: "preserve-3d" }}
      >
        {/* Deep background glow layers - refined */}
        <div className="absolute w-[450px] h-[450px] rounded-full bg-gradient-to-br from-primary/15 via-purple-500/10 to-cyan-500/10 blur-[100px]" />
        <motion.div 
          className="absolute w-[350px] h-[350px] rounded-full bg-gradient-to-br from-primary/10 to-purple-500/5 blur-[80px]"
          animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Elegant hexagonal frame - SVG based for better rendering */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute w-[360px] h-[360px]"
        >
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="hexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--primary) / 0.6)" />
                <stop offset="50%" stopColor="hsl(280 80% 60% / 0.4)" />
                <stop offset="100%" stopColor="hsl(190 90% 50% / 0.6)" />
              </linearGradient>
              <filter id="hexGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            {/* Main hexagon stroke */}
            <polygon
              points="50,2 95,25 95,75 50,98 5,75 5,25"
              fill="none"
              stroke="url(#hexGradient)"
              strokeWidth="0.5"
              filter="url(#hexGlow)"
              opacity="0.8"
            />
            {/* Inner hexagon for depth */}
            <polygon
              points="50,8 89,28 89,72 50,92 11,72 11,28"
              fill="none"
              stroke="hsl(var(--primary) / 0.2)"
              strokeWidth="0.3"
            />
            {/* Corner accents - small dots */}
            {[
              { cx: 50, cy: 2 },
              { cx: 95, cy: 25 },
              { cx: 95, cy: 75 },
              { cx: 50, cy: 98 },
              { cx: 5, cy: 75 },
              { cx: 5, cy: 25 },
            ].map((pos, i) => (
              <motion.circle
                key={i}
                cx={pos.cx}
                cy={pos.cy}
                r="1.5"
                fill="hsl(var(--primary))"
                filter="url(#hexGlow)"
                initial={{ opacity: 0.4 }}
                animate={{ opacity: [0.4, 0.9, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
              />
            ))}
          </svg>
        </motion.div>

        {/* Middle ring - elegant dotted circle */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute w-[280px] h-[280px]"
        >
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(280 80% 60% / 0.3)" />
                <stop offset="50%" stopColor="hsl(190 90% 50% / 0.3)" />
                <stop offset="100%" stopColor="hsl(280 80% 60% / 0.3)" />
              </linearGradient>
            </defs>
            {/* Dotted ring */}
            <circle
              cx="50"
              cy="50"
              r="48"
              fill="none"
              stroke="url(#ringGradient)"
              strokeWidth="0.5"
              strokeDasharray="4 6"
              opacity="0.6"
            />
            {/* Small accent dots */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
              const rad = (angle * Math.PI) / 180;
              const x = 50 + 48 * Math.cos(rad);
              const y = 50 + 48 * Math.sin(rad);
              return (
                <motion.circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="1"
                  fill="hsl(280 80% 60%)"
                  initial={{ opacity: 0.3 }}
                  animate={{ opacity: [0.3, 0.8, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15 }}
                />
              );
            })}
          </svg>
        </motion.div>

        {/* Inner ring - subtle glow ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute w-[200px] h-[200px] rounded-full"
          style={{ 
            background: "radial-gradient(circle, hsl(var(--primary) / 0.05) 0%, transparent 70%)",
            border: "1px solid hsl(var(--primary) / 0.2)",
            boxShadow: "0 0 40px hsl(var(--primary) / 0.1), inset 0 0 40px hsl(var(--primary) / 0.05)",
          }}
        />

        {/* Core with refined holographic effect */}
        <motion.div
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="relative w-28 h-28"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Soft outer glow */}
          <div className="absolute -inset-4 rounded-full bg-gradient-to-br from-primary/30 via-purple-500/20 to-cyan-500/30 blur-xl" />
          
          {/* Core gradient sphere */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary via-purple-500 to-cyan-500"
               style={{ boxShadow: "0 0 30px hsl(var(--primary) / 0.6), inset 0 0 20px rgba(255,255,255,0.2)" }} />
          
          {/* Glass effect overlay */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 via-transparent to-transparent" />
          
          {/* Inner core with icon */}
          <div className="absolute inset-1 rounded-full bg-gradient-to-br from-white/10 to-transparent backdrop-blur-sm flex items-center justify-center border border-white/20">
            <Brain className="w-12 h-12 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]" />
          </div>

          {/* Subtle pulse rings */}
          {[0, 0.7].map((delay, i) => (
            <motion.div
              key={i}
              className="absolute inset-0 rounded-full border"
              style={{ 
                borderColor: i === 0 ? "hsl(var(--primary) / 0.3)" : "hsl(280 80% 60% / 0.3)",
              }}
              animate={{ scale: [1, 1.8 + i * 0.3], opacity: [0.5, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut", delay }}
            />
          ))}
        </motion.div>

        {/* Orbiting satellites - refined */}
        {pillars.map((pillar, i) => (
          <motion.div
            key={pillar.label}
            className="absolute"
            style={{ top: "50%", left: "50%" }}
            animate={{ rotate: [i * 120, i * 120 + 360] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          >
            <motion.div
              className={`-translate-x-1/2 -translate-y-1/2 absolute p-2.5 rounded-lg backdrop-blur-sm border`}
              style={{
                transform: `translateX(160px)`,
                background: pillar.glow === "cyan" 
                  ? "linear-gradient(135deg, hsl(190 90% 50% / 0.15), transparent)" 
                  : pillar.glow === "purple" 
                    ? "linear-gradient(135deg, hsl(280 80% 60% / 0.15), transparent)" 
                    : "linear-gradient(135deg, hsl(330 80% 60% / 0.15), transparent)",
                borderColor: pillar.glow === "cyan" 
                  ? "hsl(190 90% 50% / 0.3)" 
                  : pillar.glow === "purple" 
                    ? "hsl(280 80% 60% / 0.3)" 
                    : "hsl(330 80% 60% / 0.3)",
                boxShadow: `0 0 15px ${pillar.glow === "cyan" ? "hsl(190 90% 50% / 0.2)" : pillar.glow === "purple" ? "hsl(280 80% 60% / 0.2)" : "hsl(330 80% 60% / 0.2)"}`,
              }}
              animate={{ rotate: [-i * 120, -i * 120 - 360] }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            >
              <pillar.icon className="w-4 h-4 text-white/90" />
            </motion.div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Cyberpunk Badge ─────────────────────────────────────────────────
function CyberpunkBadge() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className="inline-flex"
    >
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="relative inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium overflow-hidden group"
        style={{ 
          background: "linear-gradient(135deg, rgba(0,0,0,0.6), rgba(20,20,40,0.8))",
          border: "1px solid hsl(var(--primary) / 0.3)",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Animated border gradient */}
        <motion.div
          className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: "linear-gradient(90deg, hsl(var(--primary)), hsl(190 90% 50%), hsl(280 80% 60%), hsl(var(--primary)))",
            backgroundSize: "300% 100%",
          }}
          animate={{ backgroundPosition: ["0% 0%", "300% 0%"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
        <div className="absolute inset-[1px] rounded-full bg-gradient-to-r from-background/90 to-background/80" />
        
        {/* Content */}
        <div className="relative flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
          </span>
          <span className="gradient-text font-semibold">Intelligent Wellness Platform</span>
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Holographic Button ──────────────────────────────────────────────
function HolographicButton({ 
  children, 
  variant = "primary",
  href,
  onClick,
  isAuthenticated = false,
}: { 
  children: React.ReactNode; 
  variant?: "primary" | "outline";
  href?: string;
  onClick?: () => void;
  isAuthenticated?: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();
  
  // If authenticated, always go to dashboard instead of signup
  const targetHref = isAuthenticated ? "/dashboard" : href;
  
  const handleClick = (e: React.MouseEvent) => {
    if (isAuthenticated && href === "/auth/signup") {
      e.preventDefault();
      router.push("/dashboard");
    } else if (onClick) {
      onClick();
    }
  };
  
  const Component = targetHref ? Link : "button";
  
  return (
    <Component
      href={targetHref || ""}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative group inline-flex items-center justify-center h-14 px-8 text-lg font-medium rounded-xl overflow-hidden transition-all duration-300 ${
        variant === "primary" 
          ? "text-white" 
          : "text-foreground border border-white/20"
      }`}
    >
      {/* Background */}
      <div className={`absolute inset-0 transition-opacity duration-300 ${
        variant === "primary" 
          ? "bg-gradient-to-r from-primary via-purple-500 to-cyan-500 opacity-100 group-hover:opacity-90" 
          : "bg-white/5 backdrop-blur-xl"
      }`} />
      
      {/* Holographic shine effect */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100"
        style={{
          background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%)",
        }}
        animate={isHovered ? { x: ["-100%", "200%"] } : { x: "-100%" }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      />
      
      {/* Glow */}
      <div className={`absolute inset-0 blur-xl transition-opacity duration-300 ${
        variant === "primary" 
          ? "bg-primary/50 opacity-0 group-hover:opacity-100" 
          : ""
      }`} />
      
      {/* Border glow */}
      <div className={`absolute -inset-[1px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
        variant === "primary"
          ? "bg-gradient-to-r from-primary via-purple-500 to-cyan-500 blur-sm"
          : "bg-white/30 blur-sm"
      }`} />
      
      <span className="relative z-10 flex items-center gap-2">
        {children}
      </span>
    </Component>
  );
}

// ─── Live dynamic counter with sci-fi style ──────────────────────────
function LiveDynamicCounter() {
  const [count, setCount] = useState(127);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => {
      setCount((c) => Math.min(999, c + Math.floor(Math.random() * 2)));
    }, 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6 }}
      className="flex items-center gap-3 pt-2"
    >
      <div className="relative flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
        </span>
        <span className="text-sm text-emerald-400 font-mono">
          <span className="font-bold tabular-nums">{count}</span> ACTIVE
        </span>
      </div>
      <span className="text-sm text-muted-foreground">users optimizing their health right now</span>
    </motion.div>
  );
}

// ─── Floating particles with connection lines ────────────────────────
function ConnectedParticles() {
  const particles = [
    { x: 15, y: 20, color: "hsl(var(--primary))", size: 3 },
    { x: 25, y: 35, color: "hsl(190 90% 50%)", size: 2 },
    { x: 35, y: 15, color: "hsl(280 80% 60%)", size: 4 },
    { x: 45, y: 40, color: "hsl(330 80% 60%)", size: 2 },
    { x: 55, y: 25, color: "hsl(var(--primary))", size: 3 },
    { x: 65, y: 45, color: "hsl(190 90% 50%)", size: 2 },
    { x: 75, y: 30, color: "hsl(280 80% 60%)", size: 4 },
    { x: 85, y: 50, color: "hsl(330 80% 60%)", size: 3 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Connection lines */}
      <svg className="absolute inset-0 w-full h-full">
        {particles.map((p1, i) => 
          particles.slice(i + 1).map((p2, j) => {
            const distance = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
            if (distance > 30) return null;
            return (
              <motion.line
                key={`${i}-${j}`}
                x1={`${p1.x}%`}
                y1={`${p1.y}%`}
                x2={`${p2.x}%`}
                y2={`${p2.y}%`}
                stroke="hsl(var(--primary) / 0.2)"
                strokeWidth="1"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.1, 0.3, 0.1] }}
                transition={{ duration: 3, repeat: Infinity, delay: (i + j) * 0.2 }}
              />
            );
          })
        )}
      </svg>
      
      {/* Particles */}
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size * 3,
            height: p.size * 3,
            background: p.color,
            boxShadow: `0 0 ${p.size * 5}px ${p.color}, 0 0 ${p.size * 10}px ${p.color}`,
          }}
          animate={{
            y: [0, -20, 0],
            x: [0, (i % 2 === 0 ? 10 : -10), 0],
            opacity: [0.4, 0.8, 0.4],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 5 + i,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.3,
          }}
        />
      ))}
    </div>
  );
}

// ─── HERO SECTION ────────────────────────────────────────────────────
export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated } = useAuth();

  useGSAP(() => {
    if (!contentRef.current || !sectionRef.current) return;

    gsap.to(contentRef.current, {
      scale: 0.95,
      opacity: 0.5,
      y: -50,
      ease: "none",
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top top",
        end: "bottom top",
        scrub: 1,
      },
    });
  }, sectionRef);

  return (
    <>
      <ScrollProgressBar />
      <section ref={sectionRef} className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        {/* Multi-layer background */}
        <div className="absolute inset-0 -z-10">
          {/* Base gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-background" />
          
          {/* Animated mesh gradient */}
          <div className="absolute inset-0 opacity-30">
            <motion.div
              className="absolute inset-0"
              style={{
                background: `
                  radial-gradient(ellipse at 20% 80%, hsl(var(--primary) / 0.15) 0%, transparent 50%),
                  radial-gradient(ellipse at 80% 20%, hsl(280 80% 60% / 0.15) 0%, transparent 50%),
                  radial-gradient(ellipse at 40% 40%, hsl(190 90% 50% / 0.1) 0%, transparent 40%)
                `,
              }}
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, 0],
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            />
          </div>

          {/* Sci-fi grid floor */}
          <SciFiGrid />
          
          {/* Data streams */}
          <DataStreams />
          
          {/* Connected particles */}
          <ConnectedParticles />
          
          {/* Vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,transparent_50%,rgba(0,0,0,0.4)_100%)]" />
        </div>

        {/* Main content */}
        <div ref={contentRef} className="container mx-auto px-4 relative z-10" style={{ willChange: "transform, opacity" }}>
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              {/* Cyberpunk Badge */}
              <CyberpunkBadge />

              {/* Heading with sci-fi styling */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight">
                  <span className="block text-foreground/90">The Future of</span>
                  <span className="block mt-2">
                    <span className="gradient-text-animated glitch-text-wrapper">
                      <TypewriterText text="Health Is Personal" delay={600} />
                    </span>
                  </span>
                </h1>
              </motion.div>

              {/* Description with highlight words */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <p className="text-lg sm:text-xl text-muted-foreground max-w-lg leading-relaxed">
                  An AI coach that learns your body, adapts to your life, and evolves with your goals. 
                  Unifying{" "}
                  <span className="relative inline-block">
                    <span className="text-cyan-400 font-semibold">Fitness</span>
                    <motion.span 
                      className="absolute -bottom-1 left-0 h-[2px] bg-cyan-400"
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ delay: 1, duration: 0.5 }}
                    />
                  </span>
                  ,{" "}
                  <span className="relative inline-block">
                    <span className="text-purple-400 font-semibold">Nutrition</span>
                    <motion.span 
                      className="absolute -bottom-1 left-0 h-[2px] bg-purple-400"
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ delay: 1.2, duration: 0.5 }}
                    />
                  </span>
                  , and{" "}
                  <span className="relative inline-block">
                    <span className="text-pink-400 font-semibold">Wellbeing</span>
                    <motion.span 
                      className="absolute -bottom-1 left-0 h-[2px] bg-pink-400"
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ delay: 1.4, duration: 0.5 }}
                    />
                  </span>
                  {" "}into one seamless experience — powered by real-time biometric intelligence.
                </p>
              </motion.div>

              {/* Three Pillars - Holographic Cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-wrap gap-3"
              >
                {pillars.map((pillar, i) => {
                  const Icon = pillar.icon;
                  return (
                    <HolographicCard key={pillar.label} className="group">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 + i * 0.1 }}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r ${pillar.color} bg-opacity-10 border border-current/20 backdrop-blur-sm transition-all duration-300 group-hover:scale-105`}
                        style={{
                          boxShadow: pillar.glow === "cyan" 
                            ? "0 0 20px hsl(190 90% 50% / 0.3)" 
                            : pillar.glow === "purple" 
                              ? "0 0 20px hsl(280 80% 60% / 0.3)" 
                              : "0 0 20px hsl(330 80% 60% / 0.3)",
                        }}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{pillar.label}</span>
                      </motion.div>
                    </HolographicCard>
                  );
                })}
              </motion.div>

              {/* CTA Buttons - Holographic */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <HolographicButton 
                  href="/auth/signup" 
                  isAuthenticated={isAuthenticated}
                >
                  {isAuthenticated ? (
                    <>
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  ) : (
                    <>
                      Start Your Transformation
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </HolographicButton>
                
                {!isAuthenticated && (
                  <HolographicButton variant="outline">
                    <Play className="mr-2 h-5 w-5" />
                    See It in Action
                  </HolographicButton>
                )}
              </motion.div>
              
              {/* Trust indicators */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground"
              >
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-emerald-400" />
                  HIPAA Compliant
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  60-sec Setup
                </span>
                <span className="flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-cyan-400" />
                  AI-Powered
                </span>
              </motion.div>

              <LiveDynamicCounter />

              {/* Animated Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="flex flex-wrap items-center gap-x-8 gap-y-3 pt-4 border-t border-white/10"
              >
                {stats.map((stat, index) => (
                  <Fragment key={stat.label}>
                    <AnimatedStat
                      value={stat.value}
                      suffix={stat.suffix}
                      label={stat.label}
                      decimals={stat.decimals ?? 0}
                      delay={0.6 + index * 0.1}
                    />
                  </Fragment>
                ))}
              </motion.div>
            </div>

            {/* Right Content — AI Visualization */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="relative h-[600px] hidden lg:flex items-center justify-center"
            >
              <AICore />
              
              {/* Decorative tech elements */}
              <div className="absolute top-10 right-10 text-xs font-mono text-primary/50">
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  SYS.ONLINE
                </motion.div>
              </div>
              <div className="absolute bottom-10 left-10 text-xs font-mono text-primary/50">
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                >
                  AI.ACTIVE
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator with sci-fi style */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex flex-col items-center gap-2"
          >
            <span className="text-xs text-muted-foreground uppercase tracking-widest font-mono">Scroll to explore</span>
            <div className="w-6 h-10 rounded-full border-2 border-primary/30 flex justify-center pt-2 relative overflow-hidden">
              <motion.div
                animate={{ y: [0, 12, 0], opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary))]"
              />
              {/* Scan line */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-b from-primary/20 to-transparent h-1/2"
                animate={{ y: ["-100%", "200%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
            </div>
          </motion.div>
        </motion.div>

        {/* Decorative tech lines */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <div className="absolute top-0 bottom-0 left-0 w-px bg-gradient-to-b from-transparent via-primary/20 to-transparent" />
        <div className="absolute top-0 bottom-0 right-0 w-px bg-gradient-to-b from-transparent via-primary/20 to-transparent" />
        
        {/* Corner accents */}
        <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-primary/30" />
        <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-primary/30" />
        <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-primary/30" />
        <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-primary/30" />
      </section>
    </>
  );
}

export default HeroSection;
