'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Sparkles, Zap, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatEmptyStateProps {
  className?: string;
}

export function ChatEmptyState({ className }: ChatEmptyStateProps) {
  const icons = [
    { Icon: MessageSquare, delay: 0 },
    { Icon: Sparkles, delay: 0.2 },
    { Icon: Zap, delay: 0.4 },
    { Icon: Send, delay: 0.6 },
  ];

  // Generate fixed patterns for particles using useMemo
  // Using deterministic patterns based on index to avoid Math.random() in render
  const particles = useMemo(() => {
    const patterns = [
      { x: 10, y: 20, offset: 8, duration: 2.5, delay: 0 },
      { x: 30, y: 15, offset: -6, duration: 3.2, delay: 0.3 },
      { x: 50, y: 25, offset: 10, duration: 2.8, delay: 0.6 },
      { x: 70, y: 18, offset: -8, duration: 3.5, delay: 0.9 },
      { x: 20, y: 40, offset: 7, duration: 2.3, delay: 1.2 },
      { x: 40, y: 35, offset: -9, duration: 3.1, delay: 1.5 },
      { x: 60, y: 45, offset: 11, duration: 2.7, delay: 1.8 },
      { x: 80, y: 38, offset: -7, duration: 3.3, delay: 2.1 },
      { x: 15, y: 60, offset: 9, duration: 2.6, delay: 2.4 },
      { x: 35, y: 55, offset: -10, duration: 3.4, delay: 2.7 },
      { x: 55, y: 65, offset: 8, duration: 2.4, delay: 3.0 },
      { x: 75, y: 58, offset: -9, duration: 3.0, delay: 3.3 },
      { x: 25, y: 80, offset: 7, duration: 2.9, delay: 3.6 },
      { x: 45, y: 75, offset: -8, duration: 3.2, delay: 3.9 },
      { x: 65, y: 85, offset: 10, duration: 2.5, delay: 4.2 },
      { x: 85, y: 78, offset: -7, duration: 3.1, delay: 4.5 },
      { x: 12, y: 30, offset: 9, duration: 2.8, delay: 4.8 },
      { x: 32, y: 28, offset: -6, duration: 3.3, delay: 5.1 },
      { x: 52, y: 32, offset: 8, duration: 2.6, delay: 5.4 },
      { x: 72, y: 30, offset: -10, duration: 3.0, delay: 5.7 },
    ];
    return patterns.map((pattern, i) => ({
      id: i,
      initialX: pattern.x,
      initialY: pattern.y,
      randomOffset: pattern.offset,
      duration: pattern.duration,
      delay: pattern.delay,
    }));
  }, []);

  return (
    <div className={cn('relative flex h-full flex-col items-center justify-center overflow-hidden', className)}>
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20" />
      
      {/* Floating Orbs */}
      <motion.div
        className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-600/20 blur-3xl"
        animate={{
          scale: [1, 1.3, 1.1, 1.2, 1],
          opacity: [0.3, 0.6, 0.4, 0.5, 0.3],
          x: [0, 50, -20, 30, 0],
          y: [0, -40, 20, -30, 0],
          rotate: [0, 90, 180, 270, 360],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute right-1/4 bottom-1/4 h-80 w-80 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-600/20 blur-3xl"
        animate={{
          scale: [1.2, 1, 1.3, 1.1, 1.2],
          opacity: [0.3, 0.5, 0.4, 0.6, 0.3],
          x: [0, -40, 25, -30, 0],
          y: [0, 35, -25, 40, 0],
          rotate: [360, 270, 180, 90, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      {/* Additional floating orb */}
      <motion.div
        className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-purple-500/15 to-pink-600/15 blur-3xl"
        animate={{
          scale: [1, 1.4, 1.2, 1.3, 1],
          opacity: [0.2, 0.4, 0.3, 0.35, 0.2],
          x: [0, 30, -25, 20, 0],
          y: [0, -25, 30, -20, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 flex flex-col items-center gap-8 px-6 text-center"
      >
        {/* Animated Icons Grid */}
        <div className="relative grid grid-cols-2 gap-4">
          {icons.map(({ Icon, delay }, index) => {
            // Circular chain movement pattern without overlap
            // Grid: Icon 0 (top-left), Icon 1 (top-right), Icon 2 (bottom-left), Icon 3 (bottom-right)
            // Each icon moves in a curved arc to the next position, curving FAR outward to avoid overlap
            // Pattern: 0→1 (right), 1→2 (down-left), 2→3 (right), 3→0 (up-left)
            
            // Icon size: 80px, Gap: 16px, Total movement: 96px
            // Use very large arc paths that curve FAR outward (away from center) to prevent overlap
            // Each path curves outward by at least 60-80px to ensure no overlap
            const circularPaths = [
              // Icon 0 (top-left → top-right): curves far upward (60px) to avoid center and other icons
              { x: [0, 15, 96, 15, 0], y: [0, -60, 0, 60, 0] },
              // Icon 1 (top-right → bottom-left): curves far rightward (60px) then leftward (wide arc)
              { x: [0, 60, 30, -48, -96, -48, 30, 60, 0], y: [0, 0, 60, 90, 96, 90, 60, 0, 0] },
              // Icon 2 (bottom-left → bottom-right): curves far downward (60px) to avoid center
              { x: [0, 15, 96, 15, 0], y: [0, 60, 0, -60, 0] },
              // Icon 3 (bottom-right → top-left): curves far leftward (60px) then rightward (wide arc)
              { x: [0, -60, -30, 48, 96, 48, -30, -60, 0], y: [0, 0, -60, -90, -96, -90, -60, 0, 0] },
            ];
            
            const path = circularPaths[index];
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                }}
                transition={{
                  delay,
                  duration: 0.6,
                  type: 'spring',
                  stiffness: 200,
                  damping: 15,
                }}
                whileHover={{ scale: 1.15, zIndex: 10 }}
                className="relative"
              >
                <motion.div
                  className={cn(
                    'relative flex h-20 w-20 items-center justify-center rounded-2xl',
                    'bg-gradient-to-br from-emerald-500/20 to-teal-600/20',
                    'backdrop-blur-sm border border-emerald-500/30',
                    'shadow-lg shadow-emerald-500/20'
                  )}
                  initial={{ x: 0, y: 0 }}
                  animate={{
                    boxShadow: [
                      '0 0 20px rgba(16, 185, 129, 0.2)',
                      '0 0 40px rgba(16, 185, 129, 0.4)',
                      '0 0 20px rgba(16, 185, 129, 0.2)',
                    ],
                    x: path.x,
                    y: path.y,
                  }}
                  transition={{
                    x: {
                      duration: 3,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: delay + 1 + index * 0.15, // Stagger the start
                    },
                    y: {
                      duration: 3,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: delay + 1 + index * 0.15, // Stagger the start
                    },
                    boxShadow: {
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: delay + 0.8,
                    },
                  }}
                >
                  <motion.div
                    initial={{ rotate: 0, scale: 1 }}
                    animate={{
                      rotate: [0, 180, 360],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      rotate: {
                        duration: 3,
                        repeat: Infinity,
                        ease: 'linear',
                        delay: delay + 1 + index * 0.15,
                      },
                      scale: {
                        duration: 1.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: delay + 1 + index * 0.15,
                      },
                    }}
                  >
                    <Icon className="h-10 w-10 text-emerald-400" />
                  </motion.div>
                  
                  {/* Glow Effect */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-400/0 to-teal-500/0"
                    initial={{ scale: 1 }}
                    animate={{
                      background: [
                        'linear-gradient(135deg, rgba(16, 185, 129, 0) 0%, rgba(20, 184, 166, 0) 100%)',
                        'linear-gradient(135deg, rgba(16, 185, 129, 0.4) 0%, rgba(20, 184, 166, 0.4) 100%)',
                        'linear-gradient(135deg, rgba(16, 185, 129, 0) 0%, rgba(20, 184, 166, 0) 100%)',
                      ],
                      scale: [1, 1.3, 1],
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: delay + 0.8,
                    }}
                  />
                </motion.div>
              </motion.div>
            );
          })}
        </div>

        {/* Text Content */}
        <motion.div 
          className="space-y-3"
          animate={{
            y: [0, -8, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
            repeatType: 'reverse',
          }}
        >
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ 
              opacity: 1, 
              y: [0, -5, 0],
              scale: [1, 1.02, 1],
            }}
            transition={{ 
              delay: 0.8, 
              duration: 0.5,
              y: {
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
                repeatType: 'reverse',
              },
              scale: {
                duration: 2.5,
                repeat: Infinity,
                ease: 'easeInOut',
                repeatType: 'reverse',
              },
            }}
            className="bg-gradient-to-r from-foreground via-emerald-400/80 to-foreground/70 bg-clip-text text-3xl font-bold text-transparent"
          >
            Select a chat
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ 
              opacity: [0.7, 1, 0.7],
              y: [0, -3, 0],
            }}
            transition={{ 
              delay: 1, 
              duration: 0.5,
              opacity: {
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
                repeatType: 'reverse',
              },
              y: {
                duration: 3.5,
                repeat: Infinity,
                ease: 'easeInOut',
                repeatType: 'reverse',
              },
            }}
            className="max-w-md text-muted-foreground"
          >
            Choose a conversation from the sidebar to start messaging
          </motion.p>
        </motion.div>

        {/* Animated Particles */}
        <div className="absolute inset-0 overflow-hidden">
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute h-1 w-1 rounded-full bg-emerald-400/40"
              initial={{
                x: `${particle.initialX}%`,
                y: `${particle.initialY}%`,
                opacity: 0,
              }}
              animate={{
                y: [`${particle.initialY}%`, `${particle.initialY + particle.randomOffset}%`],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: particle.duration,
                repeat: Infinity,
                delay: particle.delay,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

