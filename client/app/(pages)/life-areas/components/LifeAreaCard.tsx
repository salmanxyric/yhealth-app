'use client';
import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import type { LifeArea } from '../types';

interface Props {
  area: LifeArea;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function LifeAreaCard({ area, onClick, onEdit, onDelete }: Props) {
  const Icon = (Icons[(area.icon ?? 'Target') as keyof typeof Icons] ??
    Icons.Target) as React.ComponentType<{ className?: string }>;
  const accent = area.color ?? '#6366f1';
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function close(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      className="group relative w-full text-left rounded-2xl border border-white/10
                 bg-slate-900/50 backdrop-blur-sm p-5 hover:border-white/20 transition
                 shadow-lg shadow-black/20 overflow-hidden"
    >
      <div
        aria-hidden
        className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl opacity-40 group-hover:opacity-60 transition"
        style={{ background: accent }}
      />

      {/* Action menu */}
      <div className="absolute top-3 right-3 z-10" ref={menuRef}>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
          className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition opacity-0 group-hover:opacity-100"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-full mt-1 w-36 rounded-xl border border-white/10 bg-slate-900/95 backdrop-blur-xl shadow-xl py-1 overflow-hidden"
          >
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEdit(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </motion.div>
        )}
      </div>

      {/* Clickable content area */}
      <button type="button" onClick={onClick} className="relative w-full text-left">
        <div className="flex items-start justify-between mb-6">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center ring-1 ring-white/10"
            style={{ background: `${accent}22` }}
          >
            <Icon className="w-6 h-6" />
          </div>
          {area.is_flagship && (
            <span className="text-[10px] uppercase tracking-wider text-amber-300 bg-amber-400/10 border border-amber-400/20 rounded-md px-2 py-0.5">
              Flagship
            </span>
          )}
        </div>
        <div>
          <h3 className="text-white font-semibold text-lg truncate">{area.display_name}</h3>
          <p className="text-xs text-slate-400 mt-1 capitalize">{area.domain_type}</p>
        </div>
      </button>
    </motion.div>
  );
}
