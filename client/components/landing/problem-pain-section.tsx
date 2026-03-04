"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import {
  HeartCrack,
  Target,
  RotateCcw,
  AlertTriangle,
  ArrowRight,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGSAP } from "@/hooks/use-gsap";
import { gsap } from "@/lib/gsap-init";
import { AnimatedGradientMesh, GSAPScrollReveal } from "./shared";

// ─── Data ────────────────────────────────────────────────────────────

const heroStats = [
  {
    value: 87,
    suffix: "%",
    label: "Abandon health goals",
    sublabel: "within 90 days",
    color: "from-red-500 to-orange-500",
  },
  {
    value: 72,
    prefix: "$",
    suffix: "B",
    label: "Wasted on fitness",
    sublabel: "annually worldwide",
    color: "from-amber-500 to-yellow-500",
  },
  {
    value: 4.2,
    suffix: "×",
    label: "Average restart cycle",
    sublabel: "before giving up entirely",
    color: "from-purple-500 to-pink-500",
  },
];

const painPoints = [
  {
    number: "01",
    icon: HeartCrack,
    stat: { value: 87, suffix: "%" },
    title: "The Accountability Void",
    headline: "Nobody's watching. Nobody cares.",
    description:
      "Without an intelligent system that adapts to your behavior, tracks your patterns, and intervenes before you slip — you're fighting biology with willpower alone. Willpower is a finite resource. It always runs out.",
    barLabel: "Quit rate without AI coaching",
    barValue: 87,
    gradient: "from-red-500 via-rose-500 to-pink-500",
    glowColor: "rgba(239, 68, 68, 0.3)",
  },
  {
    number: "02",
    icon: Target,
    stat: { value: 73, suffix: "%" },
    title: "The Personalization Myth",
    headline: "Built for everyone. Optimized for no one.",
    description:
      "Cookie-cutter programs ignore your genetics, stress levels, sleep quality, and lifestyle. You follow plans designed for a statistical average that doesn't exist — burning time on routines your body actively resists.",
    barLabel: "Using wrong-fit programs",
    barValue: 73,
    gradient: "from-amber-500 via-orange-500 to-red-500",
    glowColor: "rgba(245, 158, 11, 0.3)",
  },
  {
    number: "03",
    icon: RotateCcw,
    stat: { value: 4.2, suffix: "×" },
    title: "The Restart Spiral",
    headline: "Miss one week. Lose everything.",
    description:
      "You miss a workout, skip a meal plan, or hit a plateau. Without intelligent recovery protocols and adaptive programming, every setback erases weeks of progress. The cycle doesn't just repeat — it compounds into learned helplessness.",
    barLabel: "Average restart attempts",
    barValue: 84,
    gradient: "from-purple-500 via-violet-500 to-indigo-500",
    glowColor: "rgba(139, 92, 246, 0.3)",
  },
];

// ─── Animated Counter ────────────────────────────────────────────────
function AnimatedCounter({
  value,
  suffix = "",
  prefix = "",
  decimals = 0,
  className,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let frame: number;
    const duration = 1800;
    const start = performance.now();
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setCount(Number((eased * value).toFixed(decimals)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isInView, value, decimals]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {prefix}
      {decimals > 0 ? count.toFixed(decimals) : count}
      {suffix}
    </span>
  );
}

// ─── Animated Progress Bar ───────────────────────────────────────────
function AnimatedBar({
  value,
  gradient,
  label,
  delay = 0,
}: {
  value: number;
  gradient: string;
  label: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <div ref={ref} className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground/70 font-medium">
          {label}
        </span>
        <span className="text-xs font-bold text-foreground/60 tabular-nums">
          {value}%
        </span>
      </div>
      <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full bg-gradient-to-r", gradient)}
          initial={{ width: 0 }}
          animate={isInView ? { width: `${value}%` } : { width: 0 }}
          transition={{
            duration: 1.5,
            ease: [0.22, 1, 0.36, 1],
            delay: delay + 0.3,
          }}
        />
      </div>
    </div>
  );
}

// ─── PROBLEM PAIN SECTION ────────────────────────────────────────────
export function ProblemPainSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  // GSAP section entrance
  useGSAP(
    () => {
      if (!sectionRef.current) return;
      gsap.fromTo(
        sectionRef.current,
        { opacity: 0.2, y: 60 },
        {
          opacity: 1,
          y: 0,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 92%",
            end: "top 45%",
            scrub: 1,
          },
        }
      );
    },
    sectionRef,
    []
  );

  // GSAP staggered card reveal
  useGSAP(
    () => {
      if (!cardsRef.current) return;
      const cards = cardsRef.current.querySelectorAll(".pain-card");
      if (!cards.length) return;
      gsap.fromTo(
        cards,
        { opacity: 0, y: 60, scale: 0.96 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          stagger: 0.15,
          duration: 0.7,
          ease: "power3.out",
          scrollTrigger: {
            trigger: cardsRef.current,
            start: "top 80%",
            toggleActions: "play none none none",
            once: true,
          },
        }
      );
    },
    cardsRef,
    []
  );

  return (
    <section
      ref={sectionRef}
      className="relative py-24 md:py-32 lg:py-40 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <AnimatedGradientMesh intensity={0.15} blur={120} />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-red-950/[0.08] to-background" />
        <div className="absolute top-1/4 left-[10%] w-72 h-72 bg-red-500/[0.06] rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 right-[15%] w-96 h-96 bg-orange-500/[0.05] rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-500/[0.03] rounded-full blur-[150px]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6">
        {/* Header */}
        <GSAPScrollReveal
          direction="up"
          distance={30}
          duration={0.7}
          className="text-center max-w-4xl mx-auto mb-16 md:mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-xs sm:text-sm font-medium text-red-400 mb-6">
            <AlertTriangle className="w-3.5 h-3.5" />
            The problem
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight leading-[1.1]">
            The wellness industry has
            <span className="block mt-2 bg-gradient-to-r from-red-400 via-orange-400 to-amber-400 bg-clip-text text-transparent">
              an 87% failure rate.
            </span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground/80 max-w-2xl mx-auto leading-relaxed">
            Fragmented apps, conflicting advice, and zero personalization leave
            millions trapped in an endless cycle of starting over. Here&apos;s
            exactly why traditional approaches fail.
          </p>
        </GSAPScrollReveal>

        {/* Hero Stats Row */}
        <GSAPScrollReveal
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto mb-20 md:mb-28"
          direction="up"
          distance={24}
          stagger={0.1}
          staggerSelector=".hero-stat"
          start="top 82%"
        >
          {heroStats.map((stat) => (
            <div
              key={stat.label}
              className="hero-stat relative group rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm p-6 sm:p-8 text-center overflow-hidden hover:border-white/15 transition-all duration-500"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-b from-white/[0.02] to-transparent" />
              <p
                className={cn(
                  "text-4xl sm:text-5xl font-black mb-2 bg-gradient-to-br bg-clip-text text-transparent",
                  stat.color
                )}
              >
                <AnimatedCounter
                  value={stat.value}
                  suffix={stat.suffix}
                  prefix={stat.prefix || ""}
                  decimals={stat.value % 1 !== 0 ? 1 : 0}
                />
              </p>
              <p className="text-sm font-semibold text-foreground/80 mb-1">
                {stat.label}
              </p>
              <p className="text-xs text-muted-foreground/60">
                {stat.sublabel}
              </p>
            </div>
          ))}
        </GSAPScrollReveal>

        {/* Pain Point Cards */}
        <div ref={cardsRef} className="max-w-5xl mx-auto space-y-6 md:space-y-8">
          {painPoints.map((pain, i) => {
            const Icon = pain.icon;
            return (
              <motion.div
                key={pain.number}
                className="pain-card group relative rounded-3xl border border-white/[0.08] bg-white/[0.015] backdrop-blur-sm overflow-hidden transition-all duration-500 hover:border-white/15"
                whileHover={{
                  boxShadow: `0 0 60px -12px ${pain.glowColor}, 0 0 0 1px rgba(255,255,255,0.1)`,
                }}
              >
                {/* Gradient top border */}
                <div
                  className={cn(
                    "absolute top-0 left-0 right-0 h-px bg-gradient-to-r opacity-40 group-hover:opacity-80 transition-opacity duration-500",
                    pain.gradient
                  )}
                />

                {/* Corner glow */}
                <div
                  className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                  style={{
                    background: `linear-gradient(135deg, ${pain.glowColor}, transparent)`,
                  }}
                />

                <div className="relative p-6 sm:p-8 md:p-10">
                  <div className="flex flex-col md:flex-row md:items-start gap-6 md:gap-10">
                    {/* Left: Number + Icon */}
                    <div className="flex md:flex-col items-center md:items-start gap-4 md:gap-5 shrink-0">
                      <span
                        className={cn(
                          "text-6xl sm:text-7xl md:text-8xl font-black leading-none bg-gradient-to-br bg-clip-text text-transparent opacity-20 group-hover:opacity-40 transition-opacity duration-500 select-none",
                          pain.gradient
                        )}
                      >
                        {pain.number}
                      </span>
                      <div
                        className={cn(
                          "w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg",
                          pain.gradient
                        )}
                      >
                        <Icon
                          className="w-7 h-7 md:w-8 md:h-8 text-white"
                          strokeWidth={2}
                        />
                      </div>
                    </div>

                    {/* Right: Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-muted-foreground/50 uppercase tracking-[0.2em] mb-2">
                        {pain.title}
                      </p>
                      <h3 className="text-2xl sm:text-3xl font-bold mb-4 tracking-tight text-foreground/90">
                        {pain.headline}
                      </h3>
                      <p className="text-muted-foreground/70 text-sm sm:text-base leading-relaxed mb-6 max-w-2xl">
                        {pain.description}
                      </p>

                      {/* Animated bar */}
                      <AnimatedBar
                        value={pain.barValue}
                        gradient={pain.gradient}
                        label={pain.barLabel}
                        delay={i * 0.15}
                      />
                    </div>

                    {/* Far right: Large stat (desktop only) */}
                    <div className="hidden lg:flex flex-col items-center justify-center shrink-0 px-4">
                      <p
                        className={cn(
                          "text-5xl xl:text-6xl font-black bg-gradient-to-br bg-clip-text text-transparent",
                          pain.gradient
                        )}
                      >
                        <AnimatedCounter
                          value={pain.stat.value}
                          suffix={pain.stat.suffix}
                          decimals={pain.stat.value % 1 !== 0 ? 1 : 0}
                        />
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Transition CTA */}
        <GSAPScrollReveal
          direction="up"
          distance={20}
          duration={0.6}
          delay={0.1}
          className="text-center mt-16 md:mt-20"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-primary/10 border border-primary/20">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground/80">
              This is exactly why we built{" "}
              <span className="text-primary font-bold">YHealth</span>
            </span>
            <ArrowRight className="w-4 h-4 text-primary" />
          </div>
        </GSAPScrollReveal>
      </div>
    </section>
  );
}
