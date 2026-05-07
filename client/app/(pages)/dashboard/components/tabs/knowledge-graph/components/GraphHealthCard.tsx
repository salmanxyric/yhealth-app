'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Activity, Moon, AlertTriangle, ChevronRight } from 'lucide-react';
import {
  knowledgeGraphService,
  type ReasoningOverlayData,
} from '@/src/shared/services/knowledge-graph.service';

interface GraphHealthCardProps {
  onAskAICoach?: (prompt: string) => void;
  onOpenArchitectureView?: () => void;
}

interface HealthSummary {
  graphHealth: number;
  activeCount: number;
  dormantCount: number;
  neverUsedCount: number;
  totalFeatures: number;
  topAlerts: Array<{ message: string; severity: string }>;
}

function computeHealth(data: ReasoningOverlayData): HealthSummary {
  const features = data.nodes.filter((n) => n.id !== 'ai-coach');
  const active = features.filter((n) => n.status === 'active');
  const dormant = features.filter((n) => n.status === 'dormant');
  const neverUsed = features.filter((n) => n.status === 'never_used');

  const coverageScore = features.length > 0 ? (active.length / features.length) * 100 : 0;
  const avgHealth = active.length > 0
    ? active.reduce((sum, n) => sum + n.healthScore, 0) / active.length
    : 0;
  const graphHealth = Math.round(coverageScore * 0.6 + avgHealth * 0.4);

  const alerts: Array<{ message: string; severity: string }> = [];
  for (const node of features) {
    for (const alert of node.alerts) {
      alerts.push({ message: alert.message, severity: alert.severity });
    }
  }
  alerts.sort((a, b) => {
    const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
    return (order[a.severity] ?? 3) - (order[b.severity] ?? 3);
  });

  return {
    graphHealth,
    activeCount: active.length,
    dormantCount: dormant.length,
    neverUsedCount: neverUsed.length,
    totalFeatures: features.length,
    topAlerts: alerts.slice(0, 3),
  };
}

function getHealthColor(score: number): string {
  if (score >= 70) return '#22C55E';
  if (score >= 40) return '#F59E0B';
  return '#EF4444';
}

export function GraphHealthCard({ onAskAICoach, onOpenArchitectureView }: GraphHealthCardProps) {
  const [summary, setSummary] = useState<HealthSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    knowledgeGraphService.getReasoningOverlay().then((res) => {
      if (cancelled) return;
      if (res.success && res.data) {
        setSummary(computeHealth(res.data));
      }
    }).catch(() => {}).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5 animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-white/5" />
          <div className="h-5 w-32 rounded bg-white/5" />
        </div>
        <div className="h-20 rounded-xl bg-white/5" />
      </div>
    );
  }

  if (!summary) return null;

  const healthColor = getHealthColor(summary.graphHealth);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5 hover:bg-white/[0.04] transition-colors"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Brain className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Graph Health</h3>
            <p className="text-xs text-slate-500">AI Coach reasoning coverage</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold" style={{ color: healthColor }}>
            {summary.graphHealth}
          </span>
          <span className="text-xs text-slate-500 ml-0.5">/100</span>
        </div>
      </div>

      {/* Feature breakdown */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="rounded-xl bg-white/[0.03] px-3 py-2 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Activity className="w-3 h-3 text-green-400" />
            <span className="text-xs text-slate-500">Active</span>
          </div>
          <span className="text-lg font-semibold text-green-400">{summary.activeCount}</span>
        </div>
        <div className="rounded-xl bg-white/[0.03] px-3 py-2 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Moon className="w-3 h-3 text-slate-400" />
            <span className="text-xs text-slate-500">Dormant</span>
          </div>
          <span className="text-lg font-semibold text-slate-400">{summary.dormantCount}</span>
        </div>
        <div className="rounded-xl bg-white/[0.03] px-3 py-2 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <span className="w-3 h-3 rounded-full border border-slate-600 inline-block" />
            <span className="text-xs text-slate-500">Unused</span>
          </div>
          <span className="text-lg font-semibold text-slate-600">{summary.neverUsedCount}</span>
        </div>
      </div>

      {/* Alerts */}
      {summary.topAlerts.length > 0 && (
        <div className="space-y-2 mb-4">
          {summary.topAlerts.map((alert, i) => (
            <div
              key={i}
              className="flex items-start gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]"
            >
              <AlertTriangle
                className="w-3.5 h-3.5 mt-0.5 shrink-0"
                style={{
                  color: alert.severity === 'high' ? '#EF4444' : alert.severity === 'medium' ? '#F59E0B' : '#6B7280',
                }}
              />
              <span className="text-xs text-slate-400 leading-relaxed">{alert.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        {onAskAICoach && summary.topAlerts.length > 0 && (
          <button
            onClick={() => onAskAICoach(
              `I see some alerts in my health graph. Can you help me understand what's happening?`
            )}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 hover:bg-amber-500/20 transition-colors"
          >
            <Brain className="w-3.5 h-3.5" />
            Ask AI Coach
          </button>
        )}
        {onOpenArchitectureView && (
          <button
            onClick={onOpenArchitectureView}
            className="flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            View Graph
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
