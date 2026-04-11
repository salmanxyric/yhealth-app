'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, TrendingUp, Sparkles, FileText, Activity } from 'lucide-react';
import { InsightFeed } from './intelligence/InsightFeed';
import { CorrelationExplorer } from './intelligence/CorrelationExplorer';
import { PredictionTracker } from './intelligence/PredictionTracker';
import { ReportViewer } from './intelligence/ReportViewer';
import { HealthScoreBreakdown } from './intelligence/HealthScoreBreakdown';

const SUB_TABS = [
  { id: 'insights', label: 'Insights', icon: Sparkles },
  { id: 'correlations', label: 'Correlations', icon: TrendingUp },
  { id: 'predictions', label: 'Predictions', icon: Brain },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'health-score', label: 'Health Score', icon: Activity },
] as const;

type SubTabId = (typeof SUB_TABS)[number]['id'];

export function IntelligenceTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTabId>('insights');

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-2 p-1.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl overflow-x-auto scrollbar-hide">
        {SUB_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                isActive ? 'text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeIntelligenceSubTab"
                  className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-lg"
                  initial={false}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                  style={{ boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)' }}
                />
              )}
              <Icon className="w-4 h-4 relative z-10" />
              <span className="relative z-10">{tab.label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Sub-tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSubTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeSubTab === 'insights' && <InsightFeed />}
          {activeSubTab === 'correlations' && <CorrelationExplorer />}
          {activeSubTab === 'predictions' && <PredictionTracker />}
          {activeSubTab === 'reports' && <ReportViewer />}
          {activeSubTab === 'health-score' && <HealthScoreBreakdown />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
