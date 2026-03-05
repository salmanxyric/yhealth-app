'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
  Activity,
  TrendingUp,
  Flame,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Trophy,
  Loader2,
  Sparkles,
  Zap,
} from 'lucide-react';
import type { Plan } from './types';

interface StatsCardsProps {
  completedToday: number;
  totalToday: number;
  todayProgress: number;
  effectiveWeekRate: number;
  weekChange: number;
  currentStreak: number;
  plan: Plan | null;
  isLoadingStats: boolean;
}

// Animated number counter component
function AnimatedNumber({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  const nodeRef = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) {
      setDisplayValue(value);
      return;
    }
    
    hasAnimated.current = true;
    const startTime = Date.now();
    const startValue = 0;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.round(startValue + (value - startValue) * easeOut);
      
      setDisplayValue(currentValue);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span ref={nodeRef}>{displayValue}</span>;
}

// 3D Tilt Card Component
function TiltCard({ 
  children, 
  className,
  glowColor = "primary",
  delay = 0 
}: { 
  children: React.ReactNode; 
  className?: string;
  glowColor?: "primary" | "emerald" | "orange" | "purple" | "pink";
  delay?: number;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });
  
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["8deg", "-8deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-8deg", "8deg"]);
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };
  
  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const glowColors = {
    primary: "from-cyan-500/20 to-blue-500/20",
    emerald: "from-emerald-500/20 to-green-500/20",
    orange: "from-orange-500/20 to-amber-500/20",
    purple: "from-purple-500/20 to-violet-500/20",
    pink: "from-pink-500/20 to-rose-500/20",
  };

  const borderGlows = {
    primary: "border-cyan-500/30",
    emerald: "border-emerald-500/30",
    orange: "border-orange-500/30",
    purple: "border-purple-500/30",
    pink: "border-pink-500/30",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={`relative ${className}`}
    >
      <div 
        className={`
          relative overflow-hidden rounded-2xl 
          bg-gradient-to-br ${glowColors[glowColor]}
          backdrop-blur-xl
          border ${borderGlows[glowColor]}
          transition-shadow duration-300
          hover:shadow-2xl
          ${glowColor === 'primary' ? 'hover:shadow-cyan-500/20' : ''}
          ${glowColor === 'emerald' ? 'hover:shadow-emerald-500/20' : ''}
          ${glowColor === 'orange' ? 'hover:shadow-orange-500/20' : ''}
          ${glowColor === 'purple' ? 'hover:shadow-purple-500/20' : ''}
          ${glowColor === 'pink' ? 'hover:shadow-pink-500/20' : ''}
        `}
        style={{ transform: "translateZ(20px)" }}
      >
        {/* Animated gradient background */}
        <div className="absolute inset-0 opacity-50">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            animate={{
              x: ["-100%", "100%"],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatType: "loop",
              ease: "linear",
            }}
          />
        </div>
        
        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    </motion.div>
  );
}

export function StatsCards({
  completedToday,
  totalToday,
  todayProgress,
  effectiveWeekRate,
  weekChange,
  currentStreak,
  plan,
  isLoadingStats,
}: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
      {/* Today's Progress Card */}
      <TiltCard 
        className="col-span-2 lg:col-span-1" 
        glowColor="primary" 
        delay={0}
      >
        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <motion.div 
              className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-500/30 backdrop-blur-sm"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Activity className="w-5 h-5 text-cyan-400" />
            </motion.div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Today</span>
          </div>
          
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-baseline gap-1">
                <p className="text-3xl sm:text-4xl font-bold text-white">
                  <AnimatedNumber value={completedToday} />
                </p>
                <span className="text-xl text-slate-400">/</span>
                <span className="text-xl text-slate-400">{totalToday}</span>
              </div>
              <p className="text-sm text-slate-400 mt-1">Activities</p>
            </div>
            <div className="text-right">
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
                className={`text-2xl font-bold ${
                  todayProgress >= 70 ? 'text-emerald-400' : todayProgress >= 40 ? 'text-amber-400' : 'text-slate-400'
                }`}
              >
                <AnimatedNumber value={Math.round(todayProgress)} />%
              </motion.span>
            </div>
          </div>
          
          {/* Progress bar with shimmer */}
          <div className="mt-4 h-2.5 rounded-full bg-slate-700/50 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-400"
              initial={{ width: 0 }}
              animate={{ width: `${todayProgress}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
            >
              <motion.div
                className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
            </motion.div>
          </div>
        </div>
      </TiltCard>

      {/* Week Progress Card */}
      <TiltCard glowColor="emerald" delay={0.1} className="h-full">
        <div className="p-4 sm:p-5 h-full flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <motion.div 
              className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/30 to-green-500/30 backdrop-blur-sm"
              whileHover={{ scale: 1.1, rotate: -5 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </motion.div>
            {isLoadingStats ? (
              <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                  weekChange >= 0 
                    ? 'bg-emerald-500/20 text-emerald-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                {weekChange >= 0 ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {weekChange >= 0 ? '+' : ''}{weekChange}%
              </motion.div>
            )}
          </div>
          
          <motion.p 
            className="text-3xl sm:text-4xl font-bold text-white"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
          >
            <AnimatedNumber value={Math.round(effectiveWeekRate)} />%
          </motion.p>
          <p className="text-sm text-slate-400 mt-1">Week Progress</p>
          
          {/* Mini sparkline decoration */}
          <div className="mt-3 flex items-end gap-0.5 h-6">
            {[40, 65, 45, 80, 55, 70, effectiveWeekRate].map((h, i) => (
              <motion.div
                key={i}
                className="flex-1 rounded-t-sm bg-emerald-500/30"
                initial={{ height: 0 }}
                animate={{ height: `${h / 5}%` }}
                transition={{ delay: 0.5 + i * 0.05 }}
              />
            ))}
          </div>
        </div>
      </TiltCard>

      {/* Current Streak Card */}
      <TiltCard glowColor="orange" delay={0.2}>
        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <motion.div 
              className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500/30 to-amber-500/30 backdrop-blur-sm"
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Flame className="w-5 h-5 text-orange-400" />
            </motion.div>
            {currentStreak >= 7 && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="flex items-center gap-1"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <Trophy className="w-4 h-4 text-amber-400" />
              </motion.div>
            )}
          </div>
          
          {isLoadingStats ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
              <span className="text-slate-400">Loading...</span>
            </div>
          ) : (
            <>
              <motion.div className="flex items-baseline gap-2">
                <motion.p 
                  className="text-3xl sm:text-4xl font-bold text-white"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
                >
                  <AnimatedNumber value={currentStreak} />
                </motion.p>
                {currentStreak >= 7 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-xs font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full"
                  >
                    HOT!
                  </motion.div>
                )}
              </motion.div>
              <p className="text-sm text-slate-400 mt-1">Day Streak</p>
              
              {/* Streak fire animation */}
              {currentStreak > 0 && (
                <motion.div 
                  className="mt-3 flex gap-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  {Array.from({ length: Math.min(currentStreak, 7) }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0, y: 10 }}
                      animate={{ scale: 1, y: 0 }}
                      transition={{ delay: 0.7 + i * 0.1 }}
                    >
                      <Zap className={`w-4 h-4 ${i < 3 ? 'text-orange-400 fill-orange-400' : 'text-orange-400/50'}`} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </>
          )}
        </div>
      </TiltCard>

      {/* Plan Week Card */}
      <TiltCard glowColor="purple" delay={0.3}>
        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <motion.div 
              className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/30 to-violet-500/30 backdrop-blur-sm"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Calendar className="w-5 h-5 text-purple-400" />
            </motion.div>
            <motion.span 
              className="text-xs font-medium text-purple-400 uppercase tracking-wider"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Current
            </motion.span>
          </div>
          
          <motion.p 
            className="text-3xl sm:text-4xl font-bold text-white"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
          >
            Week <AnimatedNumber value={plan?.currentWeek || 1} />
          </motion.p>
          <p className="text-sm text-slate-400 mt-1">
            of {plan?.durationWeeks || 12} weeks
          </p>
          
          {/* Week progress dots */}
          <div className="mt-4 flex gap-1.5">
            {Array.from({ length: plan?.durationWeeks || 12 }).map((_, i) => (
              <motion.div
                key={i}
                className={`h-1.5 rounded-full flex-1 ${
                  i < (plan?.currentWeek || 1) - 1
                    ? 'bg-purple-500'
                    : i === (plan?.currentWeek || 1) - 1
                    ? 'bg-purple-400 animate-pulse'
                    : 'bg-slate-700'
                }`}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.5 + i * 0.03 }}
              />
            ))}
          </div>
        </div>
      </TiltCard>
    </div>
  );
}
