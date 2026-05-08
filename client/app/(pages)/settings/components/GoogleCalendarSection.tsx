"use client";

import { motion } from "framer-motion";
import { useEffect, useState, useCallback } from "react";
import {
  Calendar as CalendarIcon,
  Check,
  CheckCircle,
  Key,
  Trash2,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api-client";
import { toast } from "sonner";
import { confirm } from "@/components/common/ConfirmDialog";

export function GoogleCalendarSection() {
  const [showForm, setShowForm] = useState(false);
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [redirectUri, setRedirectUri] = useState('');
  const [suggestedRedirectUri, setSuggestedRedirectUri] = useState('');
  const [saving, setSaving] = useState(false);
  const [hasCredentials, setHasCredentials] = useState(false);
  const [maskedId, setMaskedId] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [copied, setCopied] = useState(false);
  const searchParams = useSearchParams();

  // Compute a sensible default redirect URI from the public API URL.
  // Matches server default: `${API_URL}/api/calendar/callback`.
  const computeDefaultRedirectUri = useCallback(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    if (apiUrl) {
      // API URL typically ends in `/api`. Normalize to get the origin-based callback.
      return `${apiUrl.replace(/\/$/, '')}/calendar/callback`;
    }
    return 'http://localhost:9090/api/calendar/callback';
  }, []);

  // Check if credentials exist on mount and handle return from OAuth
  useEffect(() => {
    const fallback = computeDefaultRedirectUri();
    setSuggestedRedirectUri(fallback);

    api.get<{ hasCredentials: boolean; credentials: { clientId: string; redirectUri?: string } | null; suggestedRedirectUri?: string }>('/calendar/credentials')
      .then(res => {
        if (res.success && res.data) {
          setHasCredentials(res.data.hasCredentials);
          if (res.data.suggestedRedirectUri) {
            setSuggestedRedirectUri(res.data.suggestedRedirectUri);
          }
          if (res.data.credentials) {
            setMaskedId(res.data.credentials.clientId);
            setRedirectUri(res.data.credentials.redirectUri || fallback);
          } else {
            setRedirectUri(fallback);
          }
        }
      })
      .catch(() => {
        setRedirectUri(fallback);
      });

    // Handle OAuth return query params
    const status = searchParams?.get('calendar');
    if (status === 'connected') {
      toast.success('Google Calendar connected');
    } else if (status === 'error') {
      const reason = searchParams?.get('reason') || 'Unknown error';
      toast.error(`Calendar connect failed: ${decodeURIComponent(reason)}`);
    }
  }, [computeDefaultRedirectUri, searchParams]);

  const handleSave = async () => {
    if (!clientId.trim() || !clientSecret.trim()) return;
    const uri = (redirectUri.trim() || suggestedRedirectUri).trim();
    if (!/^https?:\/\//i.test(uri)) {
      toast.error('Redirect URI must start with http:// or https://');
      return;
    }
    setSaving(true);
    try {
      await api.post('/calendar/credentials', {
        clientId: clientId.trim(),
        clientSecret: clientSecret.trim(),
        redirectUri: uri,
      });
      setHasCredentials(true);
      setShowForm(false);
      setMaskedId(clientId.substring(0, 12) + '****');
      setRedirectUri(uri);
      toast.success('Google Calendar credentials saved');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to save credentials';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const result = await api.get<{ url: string }>('/calendar/auth-url');
      if (result.success && result.data?.url) {
        window.location.href = result.data.url;
      } else {
        toast.error('Failed to get authorization URL');
        setConnecting(false);
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to connect. Check your credentials.';
      toast.error(msg);
      setConnecting(false);
    }
  };

  const handleCopyRedirectUri = async () => {
    const uri = redirectUri || suggestedRedirectUri;
    try {
      await navigator.clipboard.writeText(uri);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Redirect URI copied');
    } catch {
      toast.error('Copy failed — select and copy manually');
    }
  };

  const handleDelete = async () => {
    const ok = await confirm({ description: 'Are you sure you want to remove Google Calendar credentials and disconnect?', confirmText: 'Remove', variant: 'destructive' });
    if (!ok) return;
    try {
      await api.delete('/calendar/credentials');
      setHasCredentials(false);
      setMaskedId('');
      setClientId('');
      setClientSecret('');
      toast.success('Google Calendar disconnected');
    } catch {
      toast.error('Failed to remove credentials');
    }
  };

  return (
    <div className="mb-6 p-5 rounded-2xl border border-sky-500/10 overflow-hidden" style={{ background: 'linear-gradient(145deg, rgba(14,165,233,0.04) 0%, #0a0d14 100%)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-sky-600/15 border border-sky-500/25 flex items-center justify-center">
            <CalendarIcon className="w-6 h-6 text-sky-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-white font-medium">Google Calendar</p>
              {hasCredentials && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                  Credentials Set
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">Sync your calendar for AI-aware scheduling & stress detection</p>
            {hasCredentials && maskedId && (
              <p className="text-[10px] text-slate-600 mt-0.5">Client ID: {maskedId}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasCredentials && (
            <button onClick={handleConnect} disabled={connecting}
              className="px-4 py-2 rounded-xl bg-sky-600/20 text-sky-400 hover:bg-sky-600/30 transition-colors text-sm font-medium border border-sky-500/25 disabled:opacity-50">
              {connecting ? 'Connecting...' : 'Connect Calendar'}
            </button>
          )}
          {!hasCredentials && !showForm && (
            <button onClick={() => setShowForm(true)}
              className="px-4 py-2 rounded-xl bg-sky-600/20 text-sky-400 hover:bg-sky-600/30 transition-colors text-sm font-medium border border-sky-500/25">
              Set Credentials
            </button>
          )}
        </div>
      </div>

      {/* Credentials Form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 pt-4 border-t border-white/[0.06] space-y-3">
          {/* Google Cloud Console setup instructions */}
          <div className="rounded-xl bg-sky-500/[0.05] border border-sky-500/20 p-3 text-[11px] text-slate-300 leading-relaxed">
            <p className="font-medium text-sky-300 mb-1">Setup steps in Google Cloud Console</p>
            <ol className="list-decimal list-inside space-y-0.5 text-slate-400">
              <li>Open <span className="text-slate-200">APIs & Services → Credentials</span></li>
              <li>Create or edit an <span className="text-slate-200">OAuth 2.0 Client ID</span> (type: Web application)</li>
              <li>Under <span className="text-slate-200">Authorized redirect URIs</span>, paste the URI below exactly</li>
              <li>Enable the <span className="text-slate-200">Google Calendar API</span> for the project</li>
              <li>Copy the Client ID + Secret back here, then Save</li>
            </ol>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">Client ID</label>
            <input type="text" value={clientId} onChange={e => setClientId(e.target.value)} placeholder="Your Google OAuth Client ID"
              className="w-full h-10 px-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500/40 transition-colors" />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">Client Secret</label>
            <input type="password" value={clientSecret} onChange={e => setClientSecret(e.target.value)} placeholder="Your Google OAuth Client Secret"
              className="w-full h-10 px-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500/40 transition-colors" />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
              Authorized Redirect URI
            </label>
            <div className="flex items-stretch gap-2">
              <input
                type="text"
                value={redirectUri}
                onChange={e => setRedirectUri(e.target.value)}
                placeholder={suggestedRedirectUri}
                className="flex-1 h-10 px-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500/40 transition-colors font-mono"
              />
              <button
                type="button"
                onClick={handleCopyRedirectUri}
                className="h-10 px-3 rounded-xl bg-white/[0.05] border border-white/[0.1] text-slate-300 hover:text-white hover:bg-white/[0.08] text-xs font-medium transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
                title="Copy redirect URI"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <CheckCircle className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="mt-1.5 text-[10px] text-slate-500">
              This exact URI must be listed under <span className="text-slate-400">Authorized redirect URIs</span> in Google Cloud Console.
              Mismatch causes <span className="text-red-400">redirect_uri_mismatch</span>.
            </p>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button onClick={handleSave} disabled={saving || !clientId.trim() || !clientSecret.trim()}
              className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium transition-colors disabled:opacity-40 shadow-lg shadow-sky-600/20">
              {saving ? 'Saving...' : 'Save Credentials'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white transition-colors">Cancel</button>
          </div>
        </motion.div>
      )}

      {/* Redirect URI display when credentials exist and form closed */}
      {hasCredentials && !showForm && redirectUri && (
        <div className="mt-3 pt-3 border-t border-white/[0.04]">
          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <span className="uppercase tracking-wider">Redirect URI</span>
            <code className="px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.05] text-slate-400 font-mono truncate max-w-[480px]">{redirectUri}</code>
            <button
              type="button"
              onClick={handleCopyRedirectUri}
              className="text-sky-400 hover:text-sky-300 transition-colors inline-flex items-center gap-1"
              title="Copy"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <>Copy</>}
            </button>
          </div>
        </div>
      )}

      {/* Edit / Delete links */}
      {hasCredentials && !showForm && (
        <div className="mt-2 flex items-center gap-3 text-xs">
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors">
            <Key className="w-3 h-3" /> Edit Credentials
          </button>
          <span className="text-slate-700">|</span>
          <button onClick={handleDelete} className="flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors">
            <Trash2 className="w-3 h-3" /> Delete Credentials
          </button>
        </div>
      )}
    </div>
  );
}
