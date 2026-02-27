'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Brain } from 'lucide-react';
import { SwitchModeButton } from './SwitchModeButton';
import { LanguageSelector } from './LanguageSelector';
import { ModeToggle } from './ModeToggle';
import type { SupportedLanguage } from '@/src/shared/services';
import type { AssessmentInteractionMode } from './types';
import { TARGET_USER_MESSAGES } from './constants';

interface ChatHeaderProps {
  userMessageCount: number;
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onBack: () => void;
  onSwitchMode: () => void;
  canChangeLanguage: boolean;
  interactionMode?: AssessmentInteractionMode;
  onInteractionModeChange?: (mode: AssessmentInteractionMode) => void;
}

export function ChatHeader({
  userMessageCount,
  language,
  onLanguageChange,
  onBack,
  onSwitchMode,
  canChangeLanguage,
  interactionMode = 'qa',
  onInteractionModeChange,
}: ChatHeaderProps) {
  const progress = Math.min((userMessageCount / TARGET_USER_MESSAGES) * 100, 100);

  return (
    <div className="flex-shrink-0 px-4 py-2 flex items-center justify-between bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/30">
      {/* Back button */}
      <motion.button
        onClick={onBack}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white transition-all"
        whileHover={{ x: -2 }}
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span className="text-xs font-medium">Back</span>
      </motion.button>

      {/* Center: Phase & Progress */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Brain className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-xs font-medium text-white">AI Coach</span>
        </div>
        <div className="h-1.5 w-24 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-slate-500">
          {userMessageCount}/{TARGET_USER_MESSAGES}
        </span>
      </div>

      {/* Right: Mode Toggle, Language & Quick Mode */}
      <div className="flex items-center gap-2 z-50">
        {onInteractionModeChange && (
          <ModeToggle
            mode={interactionMode}
            onModeChange={onInteractionModeChange}
            disabled={userMessageCount > 0}
          />
        )}
        <LanguageSelector
          language={language}
          onLanguageChange={onLanguageChange}
          canChange={canChangeLanguage}
        />
        <SwitchModeButton onClick={onSwitchMode} />
      </div>
    </div>
  );
}
