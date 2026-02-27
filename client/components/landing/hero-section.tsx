"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useInView, useMotionValue, useSpring } from "framer-motion";
import { ArrowRight, Play, Sparkles, Brain, Activity, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedGradientMesh, MagneticButton as SharedMagneticButton, ParallaxContainer } from "./shared";

const stats = [
  { value: 50, suffix: "K+", label: "Active Users" },
  { value: 98, suffix: "%", label: "Satisfaction" },
  { value: 4.9, suffix: "", label: "App Rating", decimals: 1 },
];

const pillars = [
  { icon: Activity, label: "Fitness", color: "from-cyan-400 to-cyan-600" },
  { icon: Heart, label: "Nutrition", color: "from-purple-400 to-purple-600" },
  { icon: Brain, label: "Wellbeing", color: "from-pink-400 to-pink-600" },
];

// ─── Typewriter effect ───────────────────────────────────────────────
function TypewriterText({ text, className = "", delay = 0 }: { text: string; className?: string; delay?: number }) {
  const [displayedChars, setDisplayedChars] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    const timeout = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        i++;
        setDisplayedChars(i);
        if (i >= text.length) {
          clearInterval(interval);
          // Keep cursor blinking for a bit then hide
          setTimeout(() => setShowCursor(false), 2000);
        }
      }, 70);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [isInView, text, delay]);

  return (
    <span ref={ref} className={className}>
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={i < displayedChars ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: 0.1 }}
          className="inline-block"
          style={{ whiteSpace: char === " " ? "pre" : undefined }}
        >
          {char}
        </motion.span>
      ))}
      {showCursor && isInView && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
          className="inline-block w-[3px] h-[0.9em] bg-primary ml-0.5 align-middle"
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
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
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

// ─── Animated Stat ───────────────────────────────────────────────────
function AnimatedStat({ value, suffix, label, decimals = 0, delay }: {
  value: number; suffix: string; label: string; decimals?: number; delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const count = useCountUp(value, decimals, 1500, isInView);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="text-center"
    >
      <div className="text-2xl sm:text-3xl font-bold gradient-text tabular-nums">
        {count.toFixed(decimals)}{suffix}
      </div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </motion.div>
  );
}

// Using shared MagneticButton component

// ─── Scroll progress bar (fixed at top) ──────────────────────────────
function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] z-[100] origin-left"
      style={{
        scaleX,
        background: "linear-gradient(90deg, hsl(var(--primary)), hsl(280 80% 60%), hsl(330 80% 60%))",
      }}
    />
  );
}

// ─── Floating orb ────────────────────────────────────────────────────
function FloatingOrb({ delay = 0, size = "lg", className = "" }: { delay?: number; size?: "sm" | "md" | "lg"; className?: string }) {
  const sizeClasses = { sm: "w-32 h-32", md: "w-48 h-48", lg: "w-64 h-64" };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 1.5, ease: "easeOut" }}
      className={`absolute rounded-full blur-3xl ${sizeClasses[size]} ${className}`}
    >
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay }}
        className="w-full h-full rounded-full bg-gradient-to-br from-primary/30 to-purple-500/30"
      />
    </motion.div>
  );
}

// ─── Neural network SVG ──────────────────────────────────────────────
function NeuralNetwork() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg className="absolute w-full h-full opacity-20" viewBox="0 0 800 600">
        <motion.g stroke="url(#neuralGradient)" strokeWidth="1" fill="none">
          {[
            { x1: 100, y1: 100, x2: 250, y2: 200 }, { x1: 250, y1: 200, x2: 400, y2: 150 },
            { x1: 400, y1: 150, x2: 550, y2: 250 }, { x1: 550, y1: 250, x2: 700, y2: 200 },
            { x1: 150, y1: 300, x2: 300, y2: 350 }, { x1: 300, y1: 350, x2: 450, y2: 300 },
            { x1: 450, y1: 300, x2: 600, y2: 400 }, { x1: 200, y1: 450, x2: 350, y2: 500 },
            { x1: 350, y1: 500, x2: 500, y2: 450 }, { x1: 500, y1: 450, x2: 650, y2: 550 },
          ].map((line, i) => (
            <motion.line
              key={i}
              x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.5 }}
              transition={{ duration: 2, delay: i * 0.2, repeat: Infinity, repeatType: "reverse", repeatDelay: 3 }}
            />
          ))}
        </motion.g>
        {[
          { cx: 100, cy: 100 }, { cx: 250, cy: 200 }, { cx: 400, cy: 150 }, { cx: 550, cy: 250 },
          { cx: 700, cy: 200 }, { cx: 150, cy: 300 }, { cx: 300, cy: 350 }, { cx: 450, cy: 300 },
          { cx: 600, cy: 400 }, { cx: 200, cy: 450 }, { cx: 350, cy: 500 }, { cx: 500, cy: 450 },
          { cx: 650, cy: 550 },
        ].map((node, i) => (
          <motion.circle
            key={i}
            cx={node.cx} cy={node.cy} r="4" fill="url(#neuralGradient)"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, delay: i * 0.1, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
        <defs>
          <linearGradient id="neuralGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="oklch(0.75 0.2 180)" />
            <stop offset="100%" stopColor="oklch(0.7 0.2 280)" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// ─── AI Core with 3D tilt ────────────────────────────────────────────
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
    rotateY.set(dx * 12); // max 12deg
    rotateX.set(-dy * 12);
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
        {/* Background glow */}
        <div className="absolute w-[400px] h-[400px] rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute w-[300px] h-[300px] rounded-full bg-purple-500/10 blur-[80px]" />

        {/* Outer rotating ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute w-80 h-80 rounded-full border border-primary/30"
          style={{ boxShadow: "0 0 40px hsl(var(--primary) / 0.15), inset 0 0 40px hsl(var(--primary) / 0.05)" }}
        >
          {[0, 90, 180, 270].map((angle, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 rounded-full bg-primary"
              style={{
                top: "50%", left: "50%",
                transform: `rotate(${angle}deg) translateX(160px) translateY(-50%)`,
                boxShadow: "0 0 15px hsl(var(--primary)), 0 0 30px hsl(var(--primary) / 0.5)",
              }}
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
            />
          ))}
        </motion.div>

        {/* Middle ring */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute w-60 h-60 rounded-full border border-purple-500/30"
          style={{ boxShadow: "0 0 30px hsl(280 80% 60% / 0.15), inset 0 0 30px hsl(280 80% 60% / 0.05)" }}
        />

        {/* Inner ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute w-40 h-40 rounded-full border border-pink-500/30"
          style={{ boxShadow: "0 0 25px hsl(330 80% 60% / 0.15), inset 0 0 25px hsl(330 80% 60% / 0.05)" }}
        />

        {/* Core */}
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="relative w-28 h-28 rounded-full bg-gradient-to-br from-primary via-purple-500 to-pink-500 flex items-center justify-center"
          style={{
            boxShadow: `0 0 30px hsl(var(--primary) / 0.6), 0 0 60px hsl(var(--primary) / 0.4), 0 0 90px hsl(280 80% 60% / 0.3), 0 0 120px hsl(330 80% 60% / 0.2)`,
          }}
        >
          <Brain className="w-12 h-12 text-white drop-shadow-lg" />
          {/* Pulse rings */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-primary/50"
            style={{ boxShadow: "0 0 20px hsl(var(--primary) / 0.5)" }}
            animate={{ scale: [1, 2], opacity: [0.5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-purple-500/50"
            style={{ boxShadow: "0 0 20px hsl(280 80% 60% / 0.5)" }}
            animate={{ scale: [1, 2.5], opacity: [0.5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-pink-500/50"
            style={{ boxShadow: "0 0 20px hsl(330 80% 60% / 0.5)" }}
            animate={{ scale: [1, 3], opacity: [0.4, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 1 }}
          />
        </motion.div>

        {/* Three Pillars orbiting */}
        <div className="absolute w-full h-full">
          {pillars.map((pillar, i) => (
            <motion.div
              key={pillar.label}
              className="absolute"
              style={{ top: "50%", left: "50%" }}
              animate={{ rotate: [i * 120, i * 120 + 360] }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            >
              <motion.div
                className={`-translate-x-1/2 -translate-y-1/2 absolute bg-gradient-to-br ${pillar.color} p-3 rounded-2xl`}
                style={{
                  transform: `translateX(140px)`,
                  boxShadow: `0 0 25px ${i === 0 ? "hsl(190 90% 50% / 0.5)" : i === 1 ? "hsl(280 80% 60% / 0.5)" : "hsl(330 80% 60% / 0.5)"}`,
                }}
                animate={{ rotate: [-i * 120, -i * 120 - 360] }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              >
                <pillar.icon className="w-6 h-6 text-white" />
              </motion.div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Animated glow orb ───────────────────────────────────────────────
function AnimatedGlow({
  className = "", color = "primary", size = "lg", intensity = 0.3, pulseSpeed = 4,
}: {
  className?: string;
  color?: "primary" | "purple" | "cyan" | "pink";
  size?: "sm" | "md" | "lg" | "xl";
  intensity?: number;
  pulseSpeed?: number;
}) {
  const sizeClasses = { sm: "w-32 h-32", md: "w-48 h-48", lg: "w-72 h-72", xl: "w-96 h-96" };
  const colorStyles = {
    primary: "hsl(var(--primary))",
    purple: "hsl(280 80% 60%)",
    cyan: "hsl(190 90% 50%)",
    pink: "hsl(330 80% 60%)",
  };

  return (
    <motion.div
      className={`absolute ${sizeClasses[size]} ${className}`}
      animate={{ scale: [1, 1.2, 1], opacity: [intensity, intensity * 1.5, intensity] }}
      transition={{ duration: pulseSpeed, repeat: Infinity, ease: "easeInOut" }}
      style={{
        background: `radial-gradient(ellipse at center, ${colorStyles[color]} 0%, transparent 70%)`,
        filter: "blur(60px)",
      }}
    />
  );
}

// ─── Professional background with gradient mesh ───────────────────────
function ProfessionalBackground() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-background" />

      {/* Animated Gradient Mesh */}
      <AnimatedGradientMesh intensity={0.25} speed={1} blur={100} />

      {/* Additional glow orbs for depth */}
      <AnimatedGlow className="-top-[10%] -left-[5%]" color="primary" size="xl" intensity={0.15} pulseSpeed={5} />
      <AnimatedGlow className="-top-[5%] right-[10%]" color="purple" size="lg" intensity={0.12} pulseSpeed={6} />
      <AnimatedGlow className="top-[40%] left-[20%]" color="cyan" size="md" intensity={0.1} pulseSpeed={4} />
      <AnimatedGlow className="bottom-[10%] right-[5%]" color="pink" size="lg" intensity={0.12} pulseSpeed={7} />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Noise texture */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,transparent_50%,rgba(0,0,0,0.3)_100%)]" />
    </div>
  );
}

// ─── Floating particles ──────────────────────────────────────────────
function FloatingParticles() {
  const particleColors = ["hsl(var(--primary))", "hsl(280 80% 60%)", "hsl(190 90% 50%)", "hsl(330 80% 60%)"];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(12)].map((_, i) => {
        const color = particleColors[i % particleColors.length];
        return (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              left: `${10 + i * 7}%`, top: `${15 + (i % 4) * 20}%`,
              background: color,
              boxShadow: `0 0 10px ${color}, 0 0 20px ${color}, 0 0 30px ${color}`,
            }}
            animate={{ y: [0, -30, 0], opacity: [0.3, 0.8, 0.3], scale: [1, 1.3, 1] }}
            transition={{ duration: 4 + i * 0.3, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
          />
        );
      })}
    </div>
  );
}

// ─── HERO SECTION ────────────────────────────────────────────────────
export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.9], { clamp: true });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0], { clamp: true });
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, -100], { clamp: true });

  return (
    <>
      <ScrollProgressBar />
      <section ref={sectionRef} className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        {/* Background with parallax */}
        <ParallaxContainer speed={0.3} direction="up" className="absolute inset-0 -z-10">
          <ProfessionalBackground />
        </ParallaxContainer>
        <FloatingParticles />
        <NeuralNetwork />

        {/* Floating Orbs with parallax */}
        <ParallaxContainer speed={0.2} direction="up" className="absolute inset-0 pointer-events-none">
          <FloatingOrb delay={0} size="md" className="top-32 left-[5%] opacity-60" />
          <FloatingOrb delay={0.5} size="sm" className="bottom-32 right-[10%] opacity-50" />
          <FloatingOrb delay={1} size="sm" className="top-1/2 right-1/3 opacity-40" />
        </ParallaxContainer>

        {/* Main content */}
        <motion.div
          ref={contentRef}
          style={{ 
            scale: heroScale, 
            opacity: heroOpacity, 
            y: heroY,
            willChange: "transform, opacity"
          }}
          className="container mx-auto px-4 relative z-10"
        >
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              >
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="inline-flex items-center gap-2 glass-card px-4 py-2 rounded-full text-sm font-medium border border-white/10 backdrop-blur-xl hover:border-primary/30 transition-all duration-300"
                  style={{ willChange: "transform" }}
                >
                  <div className="w-2 h-2 rounded-full bg-primary status-online" />
                  <span className="gradient-text font-semibold">AI Life Coach</span>
                  <Sparkles className="w-4 h-4 text-primary" />
                </motion.div>
              </motion.div>

              {/* Heading with typewriter */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight">
                  Your Personal
                  <span className="block gradient-text-animated">
                    <TypewriterText text="AI Life Coach" delay={600} />
                  </span>
                </h1>
              </motion.div>

              {/* Description */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <p className="text-lg sm:text-xl text-muted-foreground max-w-lg">
                  Experience the future of wellness. Our AI integrates{" "}
                  <span className="text-primary font-medium">Fitness</span>,{" "}
                  <span className="text-purple-500 font-medium">Nutrition</span>, and{" "}
                  <span className="text-pink-500 font-medium">Wellbeing</span>{" "}
                  to deliver insights impossible to discover alone.
                </p>
              </motion.div>

              {/* Three Pillars Badges */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-wrap gap-3"
              >
                {pillars.map((pillar, i) => (
                  <motion.div
                    key={pillar.label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${pillar.color} bg-opacity-10 border border-current/20`}
                  >
                    <pillar.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{pillar.label}</span>
                  </motion.div>
                ))}
              </motion.div>

              {/* CTA Buttons — Magnetic */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4, ease: [0.4, 0, 0.2, 1] }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <SharedMagneticButton>
                  <Button
                    size="lg"
                    className="h-14 px-8 text-lg bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 glow-cyan w-full sm:w-auto transition-all duration-300"
                    asChild
                  >
                    <Link href="/auth/signup">
                      Start Free Trial
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </SharedMagneticButton>
                <SharedMagneticButton>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-14 px-8 text-lg glass-card border-white/20 backdrop-blur-xl hover:border-primary/50 transition-all duration-300"
                  >
                    <Play className="mr-2 h-5 w-5" />
                    Watch Demo
                  </Button>
                </SharedMagneticButton>
              </motion.div>

              {/* Animated Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="flex items-center gap-8 pt-4"
              >
                {stats.map((stat, index) => (
                  <AnimatedStat
                    key={stat.label}
                    value={stat.value}
                    suffix={stat.suffix}
                    label={stat.label}
                    decimals={stat.decimals ?? 0}
                    delay={0.6 + index * 0.1}
                  />
                ))}
              </motion.div>
            </div>

            {/* Right Content — AI Visualization with 3D tilt */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="relative h-[500px] hidden lg:flex items-center justify-center"
            >
              <AICore />
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll Indicator */}
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
            <span className="text-xs text-muted-foreground uppercase tracking-widest">Scroll to explore</span>
            <div className="w-6 h-10 rounded-full border-2 border-primary/30 flex justify-center pt-2">
              <motion.div
                animate={{ y: [0, 12, 0], opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-primary"
              />
            </div>
          </motion.div>
        </motion.div>

        {/* Decorative */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 1 }}
          className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent"
        />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />
        <div className="absolute top-1/3 left-0 w-32 h-96 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
        <div className="absolute top-1/4 right-0 w-32 h-96 bg-gradient-to-l from-purple-500/5 to-transparent pointer-events-none" />
      </section>
    </>
  );
}
