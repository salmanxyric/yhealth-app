"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle,
  Loader2,
  Unlink,
} from "lucide-react";
import { dataSourceService } from '@/src/shared/services/data-source.service';
import { toast } from "sonner";

export function SpendingTrackerSection() {
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const connections = await dataSourceService.getConnections();
        const finance = connections.find(c => c.sourceType === 'finance' && c.status === 'active');
        if (finance) setConnected(true);
      } catch { /* silent */ }
      setChecking(false);
    })();
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    try {
      await dataSourceService.connect('finance', {});
      setConnected(true);
      toast.success('Spending tracker enabled!');
    } catch {
      toast.error('Failed to enable spending tracker. Please try again.');
    }
    setLoading(false);
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await dataSourceService.disconnect('finance');
      setConnected(false);
      toast.success('Spending tracker disabled');
    } catch {
      toast.error('Failed to disconnect');
    }
    setLoading(false);
  };

  if (checking) {
    return (
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-6">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
          <span className="text-sm text-slate-400">Checking spending tracker...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border p-6 transition-colors ${connected ? 'border-violet-500/30 bg-violet-500/[0.04]' : 'border-slate-700/50 bg-slate-800/30'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${connected ? 'bg-violet-500/20 border border-violet-500/30' : 'bg-violet-500/10 border border-violet-500/20'}`}>
            <span className="text-lg">💰</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-white">Spending Tracker</h4>
              {connected && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-500/15 text-violet-400 border border-violet-500/20">
                  <CheckCircle className="w-3 h-3" />
                  Active
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">Track spending for financial stress analysis</p>
          </div>
        </div>
        {connected && (
          <button
            onClick={handleDisconnect}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Unlink className="w-3 h-3" />}
            Disable
          </button>
        )}
      </div>

      {!connected && (
        <button
          onClick={handleConnect}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Enabling...
            </>
          ) : (
            'Enable Spending Tracker'
          )}
        </button>
      )}
    </div>
  );
}
