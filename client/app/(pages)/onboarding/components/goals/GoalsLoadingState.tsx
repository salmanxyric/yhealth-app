'use client';

import { motion } from 'framer-motion';
import { Sparkles, Loader2 } from 'lucide-react';

export function GoalsLoadingState() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <motion.div
        className="flex flex-col items-center justify-center min-h-[400px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="w-16 h-16 rounded-2xl bg-linear-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mb-6"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Sparkles className="w-8 h-8 text-emerald-400" />
        </motion.div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Generating Your Personalized Goals
        </h2>
        <p className="text-slate-400 text-center max-w-md">
          Our AI is analyzing your assessment responses to create SMART goals tailored
          specifically to your needs...
        </p>
        <div className="flex items-center gap-2 mt-6 text-emerald-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">This may take a few seconds</span>
        </div>
      </motion.div>
    </div>
  );
}
