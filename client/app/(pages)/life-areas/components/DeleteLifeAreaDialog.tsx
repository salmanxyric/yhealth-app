'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import type { LifeArea } from '../types';

interface Props {
  open: boolean;
  area: LifeArea | null;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
}

export function DeleteLifeAreaDialog({ open, area, onClose, onConfirm }: Props) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!area) return;
    setDeleting(true);
    try {
      await onConfirm(area.id);
      onClose();
    } catch {
      setDeleting(false);
    }
  }

  return (
    <AnimatePresence>
      {open && area && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 12 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900/90 backdrop-blur-xl p-6 shadow-2xl"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Delete Life Area</h3>
              <p className="text-sm text-slate-400 mt-2">
                Are you sure you want to delete <span className="text-white font-medium">&ldquo;{area.display_name}&rdquo;</span>? This will remove the area and unlink all associated goals, schedules, and contracts.
              </p>
              <p className="text-xs text-red-400/80 mt-2">This action cannot be undone.</p>
            </div>

            <div className="mt-6 flex items-center gap-2">
              <button
                onClick={onClose}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm text-slate-300 hover:text-white bg-white/[0.03] border border-white/10 hover:border-white/20 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white
                           bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-red-500/20"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
