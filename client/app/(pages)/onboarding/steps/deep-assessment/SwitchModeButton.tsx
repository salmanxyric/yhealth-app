'use client';

import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

interface SwitchModeButtonProps {
  onClick: () => void;
}

export function SwitchModeButton({ onClick }: SwitchModeButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all text-xs"
      whileTap={{ scale: 0.98 }}
    >
      <Zap className="w-3 h-3" />
      <span className="hidden sm:inline">Quick Mode</span>
    </motion.button>
  );
}
