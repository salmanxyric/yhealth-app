'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { MessageCircle, Sparkles, Link2 } from 'lucide-react';
import type { LifeAreaDomain, LifeAreasDashboardSummary } from '../types';

interface Props {
  summary: LifeAreasDashboardSummary | null;
  domains: LifeAreaDomain[];
}

export function LifeAreasOverviewTab({ summary, domains }: Props) {
  const topAreas = summary?.areas.slice(0, 6) ?? [];

  return (
    <div className="space-y-8">
      <div className="grid sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-xl p-5"
        >
          <p className="text-xs uppercase tracking-wider text-slate-500">Active areas</p>
          <p className="mt-1 text-3xl font-semibold text-white tabular-nums">{summary?.activeAreaCount ?? 0}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-xl p-5"
        >
          <p className="text-xs uppercase tracking-wider text-slate-500">Linked plans</p>
          <p className="mt-1 text-3xl font-semibold text-emerald-300 tabular-nums">{summary?.totalLinks ?? 0}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-xl p-5 sm:col-span-1"
        >
          <p className="text-xs uppercase tracking-wider text-slate-500">Coach</p>
          <Link
            href="/ai-coach"
            className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-blue-300 hover:text-blue-200 transition"
          >
            <MessageCircle className="w-4 h-4" />
            Open AI Coach
          </Link>
        </motion.div>
      </div>

      {topAreas.length > 0 && (
        <div>
          <h2 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
            <Link2 className="w-4 h-4 text-slate-400" />
            Where you&rsquo;re investing energy
          </h2>
          <ul className="grid sm:grid-cols-2 gap-3">
            {topAreas.map((a) => (
              <li
                key={a.id}
                className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{a.display_name}</p>
                  <p className="text-xs text-slate-500 capitalize">{a.domain_type.replace(/_/g, ' ')}</p>
                </div>
                <span className="text-xs tabular-nums text-slate-400 shrink-0">{a.link_count} links</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h2 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          Start with a prompt
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {domains.slice(0, 6).map((d, i) => (
            <motion.div
              key={d.type}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-xl border border-white/10 bg-slate-950/40 p-4 flex flex-col gap-2"
            >
              <p className="text-sm font-medium text-white">{d.displayName}</p>
              <p className="text-xs text-slate-500 line-clamp-2">{d.description}</p>
              {d.examplePhrases[0] && (
                <Link
                  href={`/ai-coach?prompt=${encodeURIComponent(d.examplePhrases[0])}`}
                  className="mt-auto text-xs text-blue-400 hover:text-blue-300 truncate"
                >
                  &ldquo;{d.examplePhrases[0]}&rdquo;
                </Link>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
