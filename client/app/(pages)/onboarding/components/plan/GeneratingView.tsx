'use client';

import { motion } from 'framer-motion';
import { Sparkles, Check } from 'lucide-react';
import type { GeneratingViewProps } from './types';

/**
 * GeneratingView - Animated loading state during plan generation
 *
 * Features:
 * - Animated sparkle icon with orbiting particles
 * - Progress steps with completion states
 * - Loading dots for current phase
 */
export function GeneratingView({ phases, currentPhaseIndex }: GeneratingViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-center"
    >
      {/* Animated Icon */}
      <AnimatedSparkleIcon />

      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">
        Generating Your{' '}
        <span className="bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Personalized Plan
        </span>
      </h1>
      <p className="text-slate-400 mb-10">Our AI is crafting a unique plan just for you...</p>

      {/* Progress Steps */}
      <div className="space-y-3">
        {phases.map((phase, index) => {
          const isComplete = index < currentPhaseIndex;
          const isCurrent = index === currentPhaseIndex;

          return (
            <PhaseItem
              key={phase.id}
              phase={phase}
              index={index}
              isComplete={isComplete}
              isCurrent={isCurrent}
            />
          );
        })}
      </div>
    </motion.div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

function AnimatedSparkleIcon() {
  return (
    <motion.div
      className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-linear-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center relative"
      animate={{
        boxShadow: [
          '0 0 20px rgba(168, 85, 247, 0.3)',
          '0 0 40px rgba(236, 72, 153, 0.3)',
          '0 0 20px rgba(168, 85, 247, 0.3)',
        ],
      }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <Sparkles className="w-12 h-12 text-purple-400" />

      {/* Orbiting particles */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-purple-400"
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: i * 1,
            ease: 'linear',
          }}
          style={{
            transformOrigin: 'center center',
            left: '50%',
            top: '50%',
            marginLeft: -4,
            marginTop: -4,
          }}
        >
          <motion.div
            animate={{
              x: [0, 50, 0, -50, 0],
              y: [-50, 0, 50, 0, -50],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 1,
            }}
            className="w-2 h-2 rounded-full bg-purple-400"
          />
        </motion.div>
      ))}
    </motion.div>
  );
}

interface PhaseItemProps {
  phase: { id: string; label: string; icon: React.ReactNode };
  index: number;
  isComplete: boolean;
  isCurrent: boolean;
}

function PhaseItem({ phase, index, isComplete, isCurrent }: PhaseItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`
        flex items-center gap-4 p-4 rounded-xl transition-all duration-300
        ${
          isCurrent
            ? 'bg-purple-500/15 border border-purple-500/30'
            : isComplete
              ? 'bg-emerald-500/10'
              : 'bg-white/5'
        }
      `}
    >
      <div
        className={`
          w-10 h-10 rounded-xl flex items-center justify-center
          ${
            isComplete
              ? 'bg-emerald-500 text-white'
              : isCurrent
                ? 'bg-purple-500/20 text-purple-400'
                : 'bg-white/10 text-slate-500'
          }
        `}
      >
        {isComplete ? (
          <Check className="w-5 h-5" />
        ) : isCurrent ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            {phase.icon}
          </motion.div>
        ) : (
          phase.icon
        )}
      </div>

      <span
        className={`font-medium ${
          isComplete ? 'text-emerald-400' : isCurrent ? 'text-white' : 'text-slate-500'
        }`}
      >
        {phase.label}
      </span>

      {isCurrent && <LoadingDots />}
    </motion.div>
  );
}

function LoadingDots() {
  return (
    <motion.div className="ml-auto flex gap-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-purple-400"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </motion.div>
  );
}
