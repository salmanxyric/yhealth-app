/* eslint-disable @next/next/no-img-element */
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import {
  Settings,
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Moon,
  Sun,
  Smartphone,
  Mail,
  MessageSquare,
  Heart,
  Target,
  BarChart2,
  Flame,
  Check,
  Loader2,
  AlertCircle,
  Save,
  Link as LinkIcon,
  Unlink,
  CheckCircle,
  Radio,
  Wifi,
  Trash2,
  Download,
  LogOut,
  Key,
  Eye,
  EyeOff,
  X,
  Power,
  PowerOff,
  Brain,
  Sparkles,
  MessageCircle,
  Zap,
  Focus,
  Calendar as CalendarIcon,
  Lock,
  CreditCard,
  HelpCircle,
  Crosshair,
  ExternalLink,
  Accessibility,
  Send,
  Phone,
  Calendar,
  BadgeCheck,
  Copy,
  Hash,
  Cake,
  ShieldCheck,
  Crown as CrownIcon,
} from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { useVoiceAssistant } from "@/app/context/VoiceAssistantContext";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { LanguageSelector } from "@/components/common/language-selector";
import { api, ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { DashboardSidebar, MobileBottomNav } from "../dashboard/components";
import { toast } from "sonner";
import { confirm } from "@/components/common/ConfirmDialog";
import { dataSourceService, DataSourceType } from '@/src/shared/services/data-source.service';
import {
  communicationService,
  type CommunicationPreferences,
  type CommunicationPreferencesUpdate,
} from "@/src/shared/services/communication.service";
import { CoachPersonaPicker } from "@/components/coach/CoachPersonaPicker";
import { DashboardPageSkeleton } from "@/components/loading";
import { coachingStyleForPersona, personaFromCoachingStyle } from "@shared/types/domain/coach-persona";

// ============================================
// Google Calendar Section Component
// ============================================

function GoogleCalendarSection() {
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

// Types - Local UI state (simpler structure for form management)
interface UserPreferences {
  coaching: {
    aiCoachPersona: string;
    style: string;
    intensity: string;
    preferredChannel: string;
    checkInFrequency: string;
    preferredCheckInTime: string;
    timezone: string;
    useEmojis: boolean;
    formalityLevel: string;
    encouragementLevel: string;
    messageStyle: string;
    focusAreas: string[];
  };
  notifications: {
    enabled: boolean;
    email: boolean;
    push: boolean;
    sms: boolean;
    whatsapp: boolean;
    /** Mirrors `notifications.types` on the API (weekly check-in / goal nudges). */
    weeklyReport: boolean;
    aiSuggestions: boolean;
    quietHours: {
      enabled: boolean;
      start: string;
      end: string;
    };
  };
  appearance: {
    theme: string;
    compactMode: boolean;
  };
  privacy: {
    shareProgress: boolean;
    anonymousAnalytics: boolean;
    healthProfileVisibility: 'disabled' | 'friends' | 'all' | 'custom';
    healthProfileAllowedUsers: string[];
  };
}

// API Response type (matches backend format)
interface ApiPreferencesResponse {
  id: string;
  userId: string;
  notifications: {
    channels: Record<string, boolean>;
    quietHours: {
      enabled: boolean;
      start: string;
      end: string;
    };
    frequency: {
      maxPerDay: number;
      maxPerWeek: number;
    };
    types: Record<string, boolean>;
  };
  coaching: {
    style: string;
    aiCoachPersona?: string;
    intensity: string;
    preferredChannel: string;
    checkInFrequency: string;
    preferredCheckInTime: string;
    timezone: string;
    aiPersonality: {
      useEmojis: boolean;
      formalityLevel: string;
      encouragementLevel: string;
    };
    focusAreas: string[];
    messageStyle?: string;
  };
  display: {
    units: {
      weight: string;
      height: string;
      distance: string;
      temperature: string;
    };
    dateFormat: string;
    timeFormat: string;
    language: string;
    theme: string;
  };
  privacy: {
    shareProgressWithCoach: boolean;
    allowAnonymousDataForResearch: boolean;
    showInLeaderboards: boolean;
    profileVisibility: string;
    healthProfileVisibility?: "disabled" | "friends" | "all" | "custom";
    healthProfileAllowedUsers?: string[];
  };
  integrations: {
    autoSyncEnabled: boolean;
    syncOnWifiOnly: boolean;
    backgroundSyncEnabled: boolean;
    dataRetentionDays: number;
  };
  voiceAssistant?: {
    avatarUrl: string | null;
    assistantName?: string;
  };
}

// ============================================
// Prayer Times Section Component
// ============================================

function PrayerTimesSection() {
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [checking, setChecking] = useState(true);
  const [savedConfig, setSavedConfig] = useState<{ city: string; country: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const connections = await dataSourceService.getConnections();
        const prayer = connections.find(c => c.sourceType === 'prayer_times' && c.status === 'active');
        if (prayer) {
          setConnected(true);
          const cfg = prayer.config as { city?: string; country?: string };
          setSavedConfig({ city: cfg.city || '', country: cfg.country || '' });
        }
      } catch { /* silent */ }
      setChecking(false);
    })();
  }, []);

  const handleConnect = async () => {
    if (!city.trim() || !country.trim()) { toast.error('Enter both city and country'); return; }
    setLoading(true);
    try {
      await dataSourceService.connect('prayer_times', { city: city.trim(), country: country.trim(), method: 2 });
      setConnected(true);
      setSavedConfig({ city: city.trim(), country: country.trim() });
      toast.success('Prayer times connected! Syncing prayer schedule...');
    } catch {
      toast.error('Failed to connect prayer times. Please try again.');
    }
    setLoading(false);
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await dataSourceService.disconnect('prayer_times');
      setConnected(false);
      setSavedConfig(null);
      setCity('');
      setCountry('');
      toast.success('Prayer times disconnected');
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
          <span className="text-sm text-slate-400">Checking prayer times connection...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border p-6 transition-colors ${connected ? 'border-emerald-500/30 bg-emerald-500/[0.04]' : 'border-slate-700/50 bg-slate-800/30'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${connected ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-emerald-500/10 border border-emerald-500/20'}`}>
            <span className="text-lg">🕌</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-white">Prayer Times</h4>
              {connected && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle className="w-3 h-3" />
                  Connected
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {connected && savedConfig
                ? `${savedConfig.city}, ${savedConfig.country}`
                : 'Track daily prayers & spiritual routine'}
            </p>
          </div>
        </div>
        {connected && (
          <button
            onClick={handleDisconnect}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Unlink className="w-3 h-3" />}
            Disconnect
          </button>
        )}
      </div>

      {!connected && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="City (e.g. Nairobi)"
              className="flex-1 px-3 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-colors"
            />
            <input
              type="text"
              value={country}
              onChange={e => setCountry(e.target.value)}
              placeholder="Country (e.g. Kenya)"
              className="flex-1 px-3 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-colors"
              onKeyDown={e => { if (e.key === 'Enter') handleConnect(); }}
            />
          </div>
          <button
            onClick={handleConnect}
            disabled={loading || !city.trim() || !country.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Connecting...
              </>
            ) : (
              'Enable Prayer Times'
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================
// Spending Tracker Section Component
// ============================================

function SpendingTrackerSection() {
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

// Transform API response to local UI state
function apiToLocalPreferences(apiPrefs: ApiPreferencesResponse): UserPreferences {
  const channels = apiPrefs.notifications?.channels || {};
  const types = (apiPrefs.notifications?.types || {}) as Record<string, boolean>;
  const typeBool = (camel: string, snake: string, fallback: boolean) =>
    types[camel] ?? types[snake] ?? fallback;
  return {
    coaching: {
      style: apiPrefs.coaching?.style || "supportive",
      aiCoachPersona:
        apiPrefs.coaching?.aiCoachPersona ||
        personaFromCoachingStyle(apiPrefs.coaching?.style || "supportive"),
      intensity: apiPrefs.coaching?.intensity || "moderate",
      preferredChannel: apiPrefs.coaching?.preferredChannel || "push",
      checkInFrequency: apiPrefs.coaching?.checkInFrequency || "daily",
      preferredCheckInTime: apiPrefs.coaching?.preferredCheckInTime || "09:00",
      timezone: apiPrefs.coaching?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      useEmojis: apiPrefs.coaching?.aiPersonality?.useEmojis ?? true,
      formalityLevel: apiPrefs.coaching?.aiPersonality?.formalityLevel || "balanced",
      encouragementLevel: apiPrefs.coaching?.aiPersonality?.encouragementLevel || "medium",
      messageStyle: apiPrefs.coaching?.messageStyle || "friendly",
      focusAreas: apiPrefs.coaching?.focusAreas || [],
    },
    notifications: {
      enabled: Object.values(channels).some(Boolean),
      email: channels.email ?? true,
      push: channels.push ?? true,
      sms: channels.sms ?? false,
      whatsapp: channels.whatsapp ?? false,
      weeklyReport: typeBool("weeklyReport", "weekly_report", true),
      aiSuggestions: typeBool("aiSuggestions", "ai_suggestions", true),
      quietHours: {
        enabled: apiPrefs.notifications?.quietHours?.enabled ?? false,
        start: apiPrefs.notifications?.quietHours?.start || "22:00",
        end: apiPrefs.notifications?.quietHours?.end || "07:00",
      },
    },
    appearance: {
      theme: apiPrefs.display?.theme || "dark",
      compactMode: false, // Not stored in backend, local only
    },
    privacy: {
      shareProgress: apiPrefs.privacy?.shareProgressWithCoach ?? false,
      anonymousAnalytics: apiPrefs.privacy?.allowAnonymousDataForResearch ?? true,
      healthProfileVisibility: apiPrefs.privacy?.healthProfileVisibility || 'friends',
      healthProfileAllowedUsers: apiPrefs.privacy?.healthProfileAllowedUsers || [],
    },
  };
}

// Transform local UI state to API format for saving
function localToApiPreferences(localPrefs: UserPreferences, assistantName?: string) {
  return {
    coaching: {
      style: localPrefs.coaching.style,
      aiCoachPersona: localPrefs.coaching.aiCoachPersona,
      intensity: localPrefs.coaching.intensity,
      preferredChannel: localPrefs.coaching.preferredChannel,
      checkInFrequency: localPrefs.coaching.checkInFrequency,
      preferredCheckInTime: localPrefs.coaching.preferredCheckInTime,
      timezone: localPrefs.coaching.timezone,
      aiPersonality: {
        useEmojis: localPrefs.coaching.useEmojis,
        formalityLevel: localPrefs.coaching.formalityLevel,
        encouragementLevel: localPrefs.coaching.encouragementLevel,
      },
      focusAreas: localPrefs.coaching.focusAreas,
      messageStyle: localPrefs.coaching.messageStyle,
    },
    notifications: {
      channels: {
        push: localPrefs.notifications.push,
        email: localPrefs.notifications.email,
        sms: localPrefs.notifications.sms,
        whatsapp: localPrefs.notifications.whatsapp,
      },
      types: {
        weeklyReport: localPrefs.notifications.weeklyReport,
        aiSuggestions: localPrefs.notifications.aiSuggestions,
      },
      quietHours: {
        enabled: localPrefs.notifications.quietHours.enabled,
        start: localPrefs.notifications.quietHours.start,
        end: localPrefs.notifications.quietHours.end,
      },
    },
    display: {
      theme: localPrefs.appearance.theme,
    },
    privacy: {
      shareProgressWithCoach: localPrefs.privacy.shareProgress,
      allowAnonymousDataForResearch: localPrefs.privacy.anonymousAnalytics,
      healthProfileVisibility: localPrefs.privacy.healthProfileVisibility,
      healthProfileAllowedUsers: localPrefs.privacy.healthProfileAllowedUsers,
    },
    voiceAssistant: assistantName ? {
      assistantName: assistantName.trim() || 'Aurea',
    } : undefined,
  };
}

interface ConnectedIntegration {
  provider: string;
  displayName: string;
  description: string;
  tier: number;
  dataTypes: string[];
  syncFrequencyMinutes: number;
  authType: string;
  scopes: string[];
  isConnected: boolean;
  lastSync?: string;
}

const intensityLevels = [
  { id: "light", label: "Light" },
  { id: "moderate", label: "Balanced" },
  { id: "intensive", label: "Intensive" },
];

const formalityOptions = [
  { id: "casual", label: "Casual", preview: "Hey! Great job today" },
  { id: "balanced", label: "Balanced", preview: "Good progress on your workout today." },
  { id: "formal", label: "Formal", preview: "Your training session results have been recorded." },
];

const encouragementOptions = [
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" },
];

const messageStyleOptions = [
  {
    id: "friendly",
    label: "Friendly",
    icon: <MessageCircle className="w-5 h-5" />,
    gradient: "from-green-500 to-emerald-500",
    description: "Warm and approachable tone",
  },
  {
    id: "professional",
    label: "Professional",
    icon: <Brain className="w-5 h-5" />,
    gradient: "from-blue-500 to-indigo-500",
    description: "Clear, concise communication",
  },
  {
    id: "motivational",
    label: "Motivational",
    icon: <Zap className="w-5 h-5" />,
    gradient: "from-sky-500 to-emerald-600",
    description: "High-energy and inspiring",
  },
];

const availableFocusAreas = [
  "Weight Loss",
  "Muscle Building",
  "Endurance",
  "Flexibility",
  "Nutrition",
  "Sleep Quality",
  "Stress Management",
  "Mental Health",
  "Recovery",
  "General Wellness",
];

// Reusable segmented control component
function SegmentedControl({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string; preview?: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  const activeIndex = options.findIndex((o) => o.id === value);
  return (
    <div className="relative flex rounded-xl bg-white/[0.03] border border-white/[0.06] p-1">
      {/* Animated active indicator */}
      <motion.div
        className="absolute top-1 bottom-1 rounded-lg bg-gradient-to-r from-sky-500/30 to-emerald-600/30 border border-sky-500/20"
        initial={false}
        animate={{
          left: `calc(${(activeIndex / options.length) * 100}% + 4px)`,
          width: `calc(${100 / options.length}% - 8px)`,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      />
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => onChange(option.id)}
          className={`relative z-10 flex-1 py-2.5 px-3 text-sm font-medium rounded-lg transition-colors ${
            value === option.id
              ? "text-white"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

// Reusable toggle switch component
function ToggleSwitch({
  checked,
  onChange,
  disabled,
  color = "sky",
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  color?: "sky" | "indigo";
}) {
  const bgColor = color === "indigo" ? "bg-indigo-500" : "bg-sky-500";
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`relative w-12 h-6 rounded-full transition-colors disabled:opacity-50 ${
        checked ? bgColor : "bg-slate-700"
      }`}
    >
      <motion.div
        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-lg"
        animate={{
          left: checked ? "calc(100% - 20px)" : "4px",
        }}
      />
    </button>
  );
}

// Glass card wrapper
function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-6 ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * Rounded hour selector with a capped-height popover list.
 * Replaces the native <select> so we can style the open dropdown
 * (rounded options + max-h-[10rem] scroll area).
 */
function HourSelect({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (popRef.current?.contains(t)) return;
      if (triggerRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const display = value === null ? "Off" : `${value}:00`;
  const options: Array<{ val: number | null; label: string }> = [
    { val: null, label: "Off" },
    ...Array.from({ length: 24 }, (_, h) => ({ val: h, label: `${h}:00` })),
  ];

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="w-full px-4 py-3 rounded-xl bg-slate-950/90 border border-white/[0.08] text-slate-100 outline-none focus:border-sky-500/70 focus:ring-1 focus:ring-sky-500/30 transition-colors cursor-pointer flex items-center justify-between"
      >
        <span>{display}</span>
        <svg
          aria-hidden
          className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={popRef}
            role="listbox"
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 right-0 z-50 mt-2 rounded-xl border border-white/[0.08] bg-slate-950/95 backdrop-blur-xl shadow-2xl p-1.5 max-h-[10rem] overflow-y-auto"
            style={{ scrollbarWidth: "thin" }}
          >
            {options.map((opt) => {
              const selected =
                (opt.val === null && value === null) || opt.val === value;
              return (
                <button
                  key={opt.val === null ? "off" : opt.val}
                  role="option"
                  aria-selected={selected}
                  type="button"
                  onClick={() => {
                    onChange(opt.val);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    selected
                      ? "bg-sky-500/15 text-sky-300"
                      : "text-slate-200 hover:bg-white/[0.05]"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CommunicationSettingsSection() {
  const [prefs, setPrefs] = useState<CommunicationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [maxCheckinsDraft, setMaxCheckinsDraft] = useState<string>("1");
  const [missedHoursDraft, setMissedHoursDraft] = useState<string>("24");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await communicationService.getPreferences();
      if (res.success && res.data) {
        setPrefs(res.data);
        setMaxCheckinsDraft(String(res.data.max_checkins_per_day));
        setMissedHoursDraft(String(res.data.missed_followup_hours));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const patch = async (body: CommunicationPreferencesUpdate) => {
    const res = await communicationService.updatePreferences(body);
    if (res.success && res.data) {
      setPrefs(res.data);
      setMaxCheckinsDraft(String(res.data.max_checkins_per_day));
      setMissedHoursDraft(String(res.data.missed_followup_hours));
      toast.success("Communication preferences saved");
    } else {
      toast.error(res.error?.message ?? "Could not save preferences");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-10 h-10 animate-spin text-slate-500" />
      </div>
    );
  }

  if (!prefs) {
    return (
      <GlassCard>
        <p className="text-slate-400 text-sm">
          Communication preferences are unavailable. Ensure the API is running and you are signed in.
        </p>
      </GlassCard>
    );
  }

  const hourField = (
    label: string,
    value: number | null,
    onChange: (v: number | null) => void
  ) => (
    <div className="flex-1 min-w-[120px]">
      <label className="text-sm text-slate-400 mb-2 block">{label}</label>
      <HourSelect value={value} onChange={onChange} />
    </div>
  );

  return (
    <div className="space-y-6">
      <GlassCard>
        <SectionHeader
          icon={<Send className="w-5 h-5" />}
          title="Proactive check-ins"
          gradient="from-violet-500 to-fuchsia-500"
        />
        <p className="text-sm text-slate-400 mb-6">
          Scheduled voice check-ins open in the voice assistant. Timing respects your quiet hours when set below.
        </p>
        <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] mb-4">
          <span className="text-slate-300">Push for check-ins</span>
          <ToggleSwitch
            checked={prefs.checkin_push_enabled}
            onChange={() => patch({ checkin_push_enabled: !prefs.checkin_push_enabled })}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {hourField("Quiet hours start", prefs.quiet_hours_start, (v) =>
            patch({ quiet_hours_start: v })
          )}
          {hourField("Quiet hours end", prefs.quiet_hours_end, (v) =>
            patch({ quiet_hours_end: v })
          )}
        </div>
        <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] mb-4">
          <span className="text-slate-300">Workdays only (Mon–Fri)</span>
          <ToggleSwitch
            checked={prefs.workdays_only}
            onChange={() => patch({ workdays_only: !prefs.workdays_only })}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Max check-ins per day</label>
            <input
              type="number"
              min={0}
              max={5}
              value={maxCheckinsDraft}
              onChange={(e) => setMaxCheckinsDraft(e.target.value)}
              onBlur={() => {
                const n = Math.min(5, Math.max(0, Number(maxCheckinsDraft) || 0));
                setMaxCheckinsDraft(String(n));
                if (n !== prefs.max_checkins_per_day) patch({ max_checkins_per_day: n });
              }}
              className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white outline-none focus:border-sky-500 transition-colors"
            />
          </div>
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Missed follow-up (hours)</label>
            <input
              type="number"
              min={1}
              max={168}
              value={missedHoursDraft}
              onChange={(e) => setMissedHoursDraft(e.target.value)}
              onBlur={() => {
                const n = Math.min(168, Math.max(1, Number(missedHoursDraft) || 1));
                setMissedHoursDraft(String(n));
                if (n !== prefs.missed_followup_hours) patch({ missed_followup_hours: n });
              }}
              className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white outline-none focus:border-sky-500 transition-colors"
            />
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <SectionHeader
          icon={<Smartphone className="w-5 h-5" />}
          title="Push categories"
          gradient="from-blue-500 to-cyan-500"
        />
        <p className="text-sm text-slate-400 mb-6">
          Controls which notification categories may open a device push (FCM when configured server-side).
        </p>
        <div className="space-y-3">
          {[
            { key: "push_achievements" as const, label: "Achievements & celebrations" },
            { key: "push_streaks" as const, label: "Streaks & warnings" },
            { key: "push_nudges" as const, label: "Nudges & coaching tips" },
          ].map((row) => (
            <div
              key={row.key}
              className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]"
            >
              <span className="text-slate-300">{row.label}</span>
              <ToggleSwitch
                checked={prefs[row.key]}
                onChange={() => patch({ [row.key]: !prefs[row.key] })}
              />
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <SectionHeader
          icon={<Mail className="w-5 h-5" />}
          title="Email"
          gradient="from-emerald-500 to-teal-500"
        />
        <div className="space-y-3 mt-2">
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <div>
              <p className="text-slate-300">Prefer digest-style email</p>
              <p className="text-xs text-slate-500 mt-1">Non-urgent updates batch when digest jobs run.</p>
            </div>
            <ToggleSwitch
              checked={prefs.email_digest}
              onChange={() => patch({ email_digest: !prefs.email_digest })}
            />
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <div>
              <p className="text-slate-300">Urgent-only immediate email</p>
              <p className="text-xs text-slate-500 mt-1">Suppresses non-urgent sends on the high-priority path.</p>
            </div>
            <ToggleSwitch
              checked={prefs.email_urgent_only}
              onChange={() => patch({ email_urgent_only: !prefs.email_urgent_only })}
            />
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <SectionHeader
          icon={<Shield className="w-5 h-5" />}
          title="Social accountability"
          gradient="from-orange-500 to-amber-500"
        />
        <p className="text-sm text-slate-400 mb-4">
          Triggers, contacts, and group chat targets live on the Dashboard Accountability tab — single place to edit consent and message templates.
        </p>
        <Link
          href="/dashboard?tab=accountability"
          className="inline-flex items-center gap-2 text-sm font-medium text-amber-300 hover:text-amber-200 transition-colors"
        >
          Open Accountability
          <ExternalLink className="w-4 h-4" />
        </Link>
      </GlassCard>
    </div>
  );
}

// Section header with gradient icon badge
const SETTINGS_SECTION_IDS = [
  "profile",
  "aiCoach",
  "voiceAssistant",
  "goals",
  "notifications",
  "communication",
  "integrations",
  "appearance",
  "accountability",
  "contracts",
  "subscription",
  "security",
  "privacy",
  "helpSupport",
  "account",
] as const;

type SettingsSectionId = (typeof SETTINGS_SECTION_IDS)[number];

function isValidSettingsSection(s: string | null): s is SettingsSectionId {
  return !!s && (SETTINGS_SECTION_IDS as readonly string[]).includes(s);
}

const REDUCE_MOTION_STORAGE_KEY = "yhealth-reduce-motion";

function SectionHeader({
  icon,
  title,
  gradient = "from-sky-500 to-emerald-600",
}: {
  icon: React.ReactNode;
  title: string;
  gradient?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div
        className={`p-2.5 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}
      >
        <span className="text-white">{icon}</span>
      </div>
      <h2 className="text-lg font-semibold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
        {title}
      </h2>
    </div>
  );
}

// ============================================
// Profile Settings Section (Premium Redesign)
// ============================================

type ProfileUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  phone: string | null;
  role: string;
  isEmailVerified: boolean;
  onboardingStatus: string;
  createdAt: string;
  updatedAt: string;
} | null | undefined;

function formatProfileDate(value: string | null | undefined, fallback = "—") {
  if (!value) return fallback;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return fallback;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function calculateAge(dob: string | null | undefined): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age >= 0 && age < 150 ? age : null;
}

function calculateProfileCompletion(user: NonNullable<ProfileUser>): number {
  const fields = [
    user.firstName,
    user.lastName,
    user.email,
    user.phone,
    user.dateOfBirth,
    user.gender,
    user.avatarUrl,
  ];
  const filled = fields.filter((v) => v && String(v).trim().length > 0).length;
  return Math.round((filled / fields.length) * 100);
}

function ProfileInfoTile({
  icon,
  label,
  value,
  empty = false,
  iconGradient = "from-blue-500/20 to-indigo-500/20",
  iconColor = "text-blue-400",
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  empty?: boolean;
  iconGradient?: string;
  iconColor?: string;
}) {
  return (
    <div className="group relative p-3.5 sm:p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] hover:bg-white/[0.035] transition-all">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg bg-gradient-to-br ${iconGradient} ${iconColor} flex-shrink-0`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-wider text-slate-500 font-medium mb-1">
            {label}
          </p>
          <p className={`text-sm font-medium truncate ${empty ? "text-slate-600 italic" : "text-white"}`}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function ProfileSettingsSection({ user }: { user: ProfileUser }) {
  const [copied, setCopied] = useState(false);

  const fullName =
    user?.firstName || user?.lastName
      ? `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim()
      : "Unnamed User";
  const initials =
    `${(user?.firstName?.[0] ?? "").toUpperCase()}${(user?.lastName?.[0] ?? "").toUpperCase()}` ||
    "U";
  const completion = user ? calculateProfileCompletion(user) : 0;
  const age = calculateAge(user?.dateOfBirth);
  const memberSince = formatProfileDate(user?.createdAt);
  const lastUpdated = formatProfileDate(user?.updatedAt);
  const dobDisplay = user?.dateOfBirth
    ? `${formatProfileDate(user.dateOfBirth)}${age !== null ? ` · ${age} yrs` : ""}`
    : null;

  const accountAgeDays = (() => {
    if (!user?.createdAt) return null;
    const created = new Date(user.createdAt);
    if (Number.isNaN(created.getTime())) return null;
    const diff = Math.floor(
      (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diff >= 0 ? diff : null;
  })();

  const handleCopyId = async () => {
    if (!user?.id) return;
    try {
      await navigator.clipboard.writeText(user.id);
      setCopied(true);
      toast.success("User ID copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copy failed");
    }
  };

  const quickLinks = [
    {
      label: "View Public Profile",
      desc: "How others see you",
      href: "/profile",
      icon: <User className="w-4 h-4" />,
      gradient: "from-blue-500/20 to-indigo-500/20",
      color: "text-blue-400",
    },
    {
      label: "Edit Preferences",
      desc: "Customize your experience",
      href: "/preferences",
      icon: <Settings className="w-4 h-4" />,
      gradient: "from-emerald-500/20 to-teal-500/20",
      color: "text-emerald-400",
    },
    {
      label: "Manage Goals",
      desc: "Set and track targets",
      href: "/goals",
      icon: <Crosshair className="w-4 h-4" />,
      gradient: "from-amber-500/20 to-orange-500/20",
      color: "text-amber-400",
    },
    {
      label: "Subscription",
      desc: "Plan & billing",
      href: "/subscription",
      icon: <CreditCard className="w-4 h-4" />,
      gradient: "from-violet-500/20 to-purple-500/20",
      color: "text-violet-400",
    },
    {
      label: "Security",
      desc: "Password & privacy",
      href: "/security",
      icon: <Shield className="w-4 h-4" />,
      gradient: "from-rose-500/20 to-pink-500/20",
      color: "text-rose-400",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-5 sm:space-y-6"
    >
      {/* ============= Card 1: Profile Hero ============= */}
      <GlassCard className="relative overflow-hidden !p-0">
        {/* Decorative gradient backdrop */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.08] via-indigo-500/[0.04] to-transparent pointer-events-none" />
        <div
          className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"
          aria-hidden
        />
        <div
          className="absolute -bottom-32 -left-16 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"
          aria-hidden
        />

        <div className="relative p-5 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-6">
            {/* Avatar */}
            <div className="relative flex-shrink-0 mx-auto sm:mx-0">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 blur-md opacity-60" />
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl sm:text-4xl font-bold ring-4 ring-slate-950/40 overflow-hidden">
                {user?.avatarUrl ? (
                   
                  <img
                    src={user.avatarUrl}
                    alt={fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{initials || "U"}</span>
                )}
              </div>
              {user?.isEmailVerified && (
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center ring-2 ring-slate-950 shadow-lg">
                  <BadgeCheck className="w-4 h-4 text-white" />
                </div>
              )}
            </div>

            {/* Identity */}
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
                <h2 className="text-xl sm:text-2xl font-bold text-white truncate">
                  {fullName}
                </h2>
                {user?.role && user.role !== "user" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30">
                    <CrownIcon className="w-3 h-3" />
                    {user.role}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-400 flex items-center justify-center sm:justify-start gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span className="truncate">{user?.email || "No email set"}</span>
              </p>
              <p className="text-xs text-slate-500 mt-1.5">
                Member since {memberSince}
              </p>
            </div>

            {/* CTA */}
            <div className="flex sm:flex-col gap-2 justify-center sm:justify-start sm:items-end">
              <Link
                href="/profile/edit"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-blue-500/20 transition-all hover:shadow-blue-500/40 hover:scale-[1.02]"
              >
                <User className="w-4 h-4" />
                Edit Profile
              </Link>
              <Link
                href="/profile"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-sm font-medium border border-white/[0.06] transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">View</span>
              </Link>
            </div>
          </div>

          {/* Stat strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mt-6 pt-6 border-t border-white/[0.06]">
            <div className="p-3 rounded-xl bg-white/[0.025] border border-white/[0.05]">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                Profile
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-lg sm:text-xl font-bold text-white">
                  {completion}
                </span>
                <span className="text-xs text-slate-500">%</span>
              </div>
              <div className="mt-1.5 h-1 rounded-full bg-white/[0.05] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${completion}%` }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.025] border border-white/[0.05]">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                Account Age
              </p>
              <p className="text-lg sm:text-xl font-bold text-white">
                {accountAgeDays !== null ? accountAgeDays : "—"}
                <span className="text-xs text-slate-500 font-normal ml-1">
                  days
                </span>
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.025] border border-white/[0.05]">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                Email
              </p>
              <div className="flex items-center gap-1.5">
                {user?.isEmailVerified ? (
                  <>
                    <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span className="text-sm font-semibold text-emerald-400 truncate">
                      Verified
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span className="text-sm font-semibold text-amber-400 truncate">
                      Unverified
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.025] border border-white/[0.05]">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                Onboarding
              </p>
              <p className="text-sm font-semibold text-white capitalize truncate">
                {user?.onboardingStatus?.toLowerCase() || "—"}
              </p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* ============= Card 2: Personal Information ============= */}
      <GlassCard>
        <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
          <SectionHeader
            icon={<User className="w-5 h-5" />}
            title="Personal Information"
            gradient="from-blue-500 to-indigo-500"
          />
          <Link
            href="/profile/edit"
            className="text-xs sm:text-sm text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1.5 transition-colors"
          >
            Edit
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
        <p className="text-sm text-slate-400 -mt-3 mb-5">
          Your personal details and account information.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ProfileInfoTile
            icon={<User className="w-4 h-4" />}
            label="First Name"
            value={user?.firstName || "Not set"}
            empty={!user?.firstName}
          />
          <ProfileInfoTile
            icon={<User className="w-4 h-4" />}
            label="Last Name"
            value={user?.lastName || "Not set"}
            empty={!user?.lastName}
          />
          <ProfileInfoTile
            icon={<Mail className="w-4 h-4" />}
            label="Email Address"
            value={
              <span className="flex items-center gap-1.5">
                <span className="truncate">{user?.email || "Not set"}</span>
                {user?.isEmailVerified && (
                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                )}
              </span>
            }
            empty={!user?.email}
            iconGradient="from-emerald-500/20 to-teal-500/20"
            iconColor="text-emerald-400"
          />
          <ProfileInfoTile
            icon={<Phone className="w-4 h-4" />}
            label="Phone Number"
            value={user?.phone || "Add phone number"}
            empty={!user?.phone}
            iconGradient="from-violet-500/20 to-purple-500/20"
            iconColor="text-violet-400"
          />
          <ProfileInfoTile
            icon={<Cake className="w-4 h-4" />}
            label="Date of Birth"
            value={dobDisplay || "Not set"}
            empty={!user?.dateOfBirth}
            iconGradient="from-pink-500/20 to-rose-500/20"
            iconColor="text-pink-400"
          />
          <ProfileInfoTile
            icon={<UserIcon className="w-4 h-4" />}
            label="Gender"
            value={user?.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1).toLowerCase() : "Not set"}
            empty={!user?.gender}
            iconGradient="from-cyan-500/20 to-sky-500/20"
            iconColor="text-cyan-400"
          />
        </div>
      </GlassCard>

      {/* ============= Card 3: Account Snapshot + Quick Links ============= */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 sm:gap-6">
        {/* Account Snapshot */}
        <GlassCard className="lg:col-span-2">
          <SectionHeader
            icon={<Hash className="w-5 h-5" />}
            title="Account Details"
            gradient="from-slate-500 to-slate-700"
          />
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />
                Member Since
              </p>
              <p className="text-sm font-semibold text-white">{memberSince}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                <Loader2 className="w-3 h-3" />
                Last Updated
              </p>
              <p className="text-sm font-semibold text-white">{lastUpdated}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                <CrownIcon className="w-3 h-3" />
                Account Type
              </p>
              <p className="text-sm font-semibold text-white capitalize">
                {user?.role || "Standard"}
              </p>
            </div>

            <button
              onClick={handleCopyId}
              className="w-full p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] hover:bg-white/[0.04] transition-all text-left group"
            >
              <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                <Hash className="w-3 h-3" />
                User ID
              </p>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-mono text-slate-300 truncate">
                  {user?.id ? `${user.id.slice(0, 8)}...${user.id.slice(-4)}` : "—"}
                </p>
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-colors flex-shrink-0" />
                )}
              </div>
            </button>
          </div>
        </GlassCard>

        {/* Quick Links */}
        <GlassCard className="lg:col-span-3">
          <SectionHeader
            icon={<Sparkles className="w-5 h-5" />}
            title="Quick Links"
            gradient="from-violet-500 to-fuchsia-500"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.12] hover:bg-white/[0.04] transition-all"
              >
                <div
                  className={`p-2 rounded-lg bg-gradient-to-br ${link.gradient} ${link.color} flex-shrink-0 group-hover:scale-110 transition-transform`}
                >
                  {link.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">
                    {link.label}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {link.desc}
                  </p>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-300 flex-shrink-0 transition-colors" />
              </Link>
            ))}
          </div>
        </GlassCard>
      </div>
    </motion.div>
  );
}

// Alias to keep ProfileInfoTile gender icon explicit (lucide doesn't have a gender icon)
const UserIcon = User;

function SettingsPageInner() {
  const { isAuthenticated, isLoading: authLoading, user, logout } = useAuth();
  const {
    assistantName,
    setAssistantName,
    selectedLanguage,
    setSelectedLanguage,
  } = useVoiceAssistant();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<SettingsSectionId>(() => {
    const s = searchParams.get("section");
    return isValidSettingsSection(s) ? s : "aiCoach";
  });
  const [reduceMotionPref, setReduceMotionPref] = useState(false);
  const [integrations, setIntegrations] = useState<ConnectedIntegration[]>([]);
  const [whoopStatus, setWhoopStatus] = useState<{
    isConnected: boolean;
    hasCredentials: boolean;
    status?: string;
    lastSyncAt?: string;
    connectedAt?: string;
    webhookRegistered?: boolean;
    initialSyncComplete?: boolean;
    email?: string;
    whoopUserId?: number;
    firstName?: string;
    lastName?: string;
  } | null>(null);

  // Token management state
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [tokenData, setTokenData] = useState({
    accessToken: '',
    refreshToken: '',
    tokenExpiry: '',
  });
  const [showTokens, setShowTokens] = useState({ access: false, refresh: false });
  const [tokenInfo, setTokenInfo] = useState<{
    hasTokens: boolean;
    accessTokenMasked?: string;
    refreshTokenMasked?: string;
    tokenExpiry?: string;
    status?: string;
  } | null>(null);

  // Credentials management state
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [credentialsData, setCredentialsData] = useState({
    clientId: '',
    clientSecret: '',
  });
  const [showCredentials, setShowCredentials] = useState({ clientId: false, clientSecret: false });
  const [isSavingCredentials, setIsSavingCredentials] = useState(false);

  // Spotify state
  const [spotifyStatus, setSpotifyStatus] = useState<{
    isConnected: boolean;
    isConfigured: boolean;
    hasCredentials: boolean;
    clientIdMasked?: string;
    credentialSource?: 'user' | 'env';
    displayName?: string;
    accountType?: string;
    connectedAt?: string;
    avatarUrl?: string;
  } | null>(null);
  const [isSpotifyConnecting, setIsSpotifyConnecting] = useState(false);
  const [showSpotifyCredentialsModal, setShowSpotifyCredentialsModal] = useState(false);
  const [spotifyCredentialsData, setSpotifyCredentialsData] = useState({ clientId: '', clientSecret: '' });
  const [showSpotifyCredentials, setShowSpotifyCredentials] = useState({ clientId: false, clientSecret: false });
  const [isSavingSpotifyCredentials, setIsSavingSpotifyCredentials] = useState(false);

  // Dashboard sidebar state
  const [sidebarActiveTab, setSidebarActiveTab] = useState("settings");

  const [preferences, setPreferences] = useState<UserPreferences>({
    coaching: {
      aiCoachPersona: "gentle_friend",
      style: "supportive",
      intensity: "moderate",
      preferredChannel: "push",
      checkInFrequency: "daily",
      preferredCheckInTime: "09:00",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      useEmojis: true,
      formalityLevel: "balanced",
      encouragementLevel: "medium",
      messageStyle: "friendly",
      focusAreas: [],
    },
    notifications: {
      enabled: true,
      email: true,
      push: true,
      sms: false,
      whatsapp: false,
      weeklyReport: true,
      aiSuggestions: true,
      quietHours: {
        enabled: false,
        start: "22:00",
        end: "07:00",
      },
    },
    appearance: {
      theme: "dark",
      compactMode: false,
    },
    privacy: {
      shareProgress: false,
      anonymousAnalytics: true,
      healthProfileVisibility: 'friends',
      healthProfileAllowedUsers: [],
    },
  });

  // Handle sidebar tab change (navigate to other pages)
  const handleTabChange = useCallback(
    (tab: string) => {
      if (tab === "ai-coach") {
        router.push("/ai-coach");
      } else if (tab === "voice-assistant") {
        router.push("/voice-assistant");
      } else if (tab === "activity-status") {
        router.push("/activity-status");
      } else if (tab === "settings") {
        // Already on settings
        return;
      } else {
        setSidebarActiveTab(tab);
        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", tab);
        router.push(`/dashboard?${params.toString()}`, { scroll: false });
      }
    },
    [router, searchParams]
  );

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/signin?callbackUrl=/settings");
    }
  }, [isAuthenticated, authLoading, router]);

  // Handle Spotify OAuth callback
  useEffect(() => {
    const callback = searchParams.get('callback');
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (callback === 'spotify' && code && state) {
      (async () => {
        try {
          setIsSpotifyConnecting(true);
          setActiveSection("integrations");
          const response = await api.post<{
            isConnected: boolean;
            displayName?: string;
            accountType?: string;
            connectedAt?: string;
            avatarUrl?: string;
          }>('/spotify/auth/callback', { code, state });

          if (response.success && response.data) {
            setSpotifyStatus(prev => ({
              isConnected: response.data?.isConnected ?? true,
              isConfigured: true,
              hasCredentials: prev?.hasCredentials ?? true,
              displayName: response.data?.displayName,
              accountType: response.data?.accountType,
              connectedAt: response.data?.connectedAt,
              avatarUrl: response.data?.avatarUrl,
              clientIdMasked: prev?.clientIdMasked,
              credentialSource: prev?.credentialSource,
            }));
            toast.success(`Spotify connected as ${response.data.displayName || 'user'}`);
          }
        } catch (err) {
          console.error('Spotify OAuth callback failed:', err);
          toast.error('Failed to connect Spotify. Please try again.');
        } finally {
          setIsSpotifyConnecting(false);
          // Clean URL params
          const params = new URLSearchParams(searchParams.toString());
          params.delete('callback');
          params.delete('code');
          params.delete('state');
          const cleanUrl = params.toString() ? `/settings?${params.toString()}` : '/settings';
          router.replace(cleanUrl);
        }
      })();
    }
  }, [searchParams, router]);

  // Handle post-exchange redirect from /api/integrations/oauth/callback/spotify.
  // That route already exchanged the code server-side and redirected here with
  // ?spotify=connected (success) or ?spotify=error&spotifyError=<msg> (failure).
  useEffect(() => {
    const spotify = searchParams.get('spotify');
    if (!spotify) return;

    (async () => {
      setActiveSection('integrations');

      if (spotify === 'connected') {
        toast.success('Spotify connected successfully');
        await fetchPreferences();
      } else if (spotify === 'error') {
        const detail = searchParams.get('spotifyError') || '';
        const msg = detail
          ? `Spotify connection failed: ${detail.replace(/_/g, ' ')}`
          : 'Spotify connection failed. Please try again.';
        toast.error(msg);
      }

      // Clean URL params
      const params = new URLSearchParams(searchParams.toString());
      params.delete('spotify');
      params.delete('spotifyError');
      const cleanUrl = params.toString() ? `/settings?${params.toString()}` : '/settings';
      router.replace(cleanUrl);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, router]);

  // Deep link + browser history: ?section=privacy (and all other tabs)
  useEffect(() => {
    const s = searchParams.get("section");
    if (isValidSettingsSection(s)) {
      setActiveSection(s);
    }
  }, [searchParams]);

  useEffect(() => {
    try {
      setReduceMotionPref(localStorage.getItem(REDUCE_MOTION_STORAGE_KEY) === "1");
    } catch {
      setReduceMotionPref(false);
    }
  }, []);

  const setReduceMotion = useCallback((enabled: boolean) => {
    setReduceMotionPref(enabled);
    try {
      if (enabled) {
        localStorage.setItem(REDUCE_MOTION_STORAGE_KEY, "1");
        document.documentElement.classList.add("reduce-motion");
      } else {
        localStorage.removeItem(REDUCE_MOTION_STORAGE_KEY);
        document.documentElement.classList.remove("reduce-motion");
      }
    } catch {
      /* ignore */
    }
  }, []);

  const goToSettingsSection = useCallback(
    (id: SettingsSectionId) => {
      setActiveSection(id);
      const params = new URLSearchParams(searchParams.toString());
      params.set("section", id);
      router.replace(`/settings?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  // Fetch preferences
  const fetchPreferences = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<{ preferences: ApiPreferencesResponse }>(
        "/preferences"
      );
      if (response.success && response.data?.preferences) {
        // Transform API response to local UI state
        const localPrefs = apiToLocalPreferences(response.data.preferences);
        setPreferences(localPrefs);

        // Load assistant name from preferences if available
        if (response.data.preferences.voiceAssistant?.assistantName) {
          setAssistantName(response.data.preferences.voiceAssistant.assistantName);
        }
      }

      // Fetch integrations
      const intResponse = await api.get<{
        integrations: ConnectedIntegration[];
      }>("/integrations");
      if (intResponse.success && intResponse.data) {
        setIntegrations(intResponse.data.integrations || []);
      }

      // Fetch WHOOP status
      try {
        const whoopResponse = await api.get<{
          isConnected: boolean;
          hasCredentials: boolean;
          status?: string;
          lastSyncAt?: string;
          connectedAt?: string;
          webhookRegistered?: boolean;
          initialSyncComplete?: boolean;
          email?: string;
          whoopUserId?: number;
          firstName?: string;
          lastName?: string;
        }>("/integrations/whoop/status");
        if (whoopResponse.success && whoopResponse.data) {
          console.log("WHOOP status response:", whoopResponse.data);
          setWhoopStatus(whoopResponse.data);
        } else {
          console.log("WHOOP status response failed or empty:", whoopResponse);
          setWhoopStatus({ isConnected: false, hasCredentials: false });
        }
      } catch (err) {
        // WHOOP not configured yet or error fetching status
        console.error("Failed to fetch WHOOP status:", err);
        setWhoopStatus({ isConnected: false, hasCredentials: false });
      }

      // Fetch Spotify status
      try {
        const spotifyResponse = await api.get<{
          isConnected: boolean;
          isConfigured: boolean;
          hasCredentials: boolean;
          clientIdMasked?: string;
          credentialSource?: 'user' | 'env';
          displayName?: string;
          accountType?: string;
          connectedAt?: string;
          avatarUrl?: string;
        }>("/spotify/auth/status");
        if (spotifyResponse.success && spotifyResponse.data) {
          setSpotifyStatus(spotifyResponse.data);
        } else {
          setSpotifyStatus({ isConnected: false, isConfigured: false, hasCredentials: false });
        }
      } catch {
        setSpotifyStatus({ isConnected: false, isConfigured: false, hasCredentials: false });
      }

      // Fetch token info if connected
      try {
        const tokenResponse = await api.get<{
          hasTokens: boolean;
          accessTokenMasked?: string;
          refreshTokenMasked?: string;
          tokenExpiry?: string;
          status?: string;
        }>("/integrations/whoop/tokens");
        if (tokenResponse.success && tokenResponse.data) {
          setTokenInfo(tokenResponse.data);
        } else {
          setTokenInfo({ hasTokens: false });
        }
      } catch (err) {
        // Token info is optional, don't show error
        console.log("Token info not available:", err);
        setTokenInfo({ hasTokens: false });
      }
    } catch (err) {
      if (err instanceof ApiError && err.code !== "NOT_FOUND") {
        console.error("Failed to load preferences:", err);
      }
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPreferences();
    }
  }, [isAuthenticated, fetchPreferences]);

  // Save preferences
  const savePreferences = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Transform local UI state to API format before saving (include assistant name)
      const apiPayload = localToApiPreferences(preferences, assistantName);
      await api.patch("/preferences", apiPayload);
      setSuccess("Settings saved successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to save settings");
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // Update preference helper
  const updatePreference = (
    section: keyof UserPreferences,
    key: string,
    value: unknown
  ) => {
    setPreferences((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  // Toggle focus area
  const toggleFocusArea = (area: string) => {
    setPreferences((prev) => {
      const current = prev.coaching.focusAreas;
      if (current.includes(area)) {
        return {
          ...prev,
          coaching: {
            ...prev.coaching,
            focusAreas: current.filter((a) => a !== area),
          },
        };
      }
      if (current.length >= 5) return prev;
      return {
        ...prev,
        coaching: {
          ...prev.coaching,
          focusAreas: [...current, area],
        },
      };
    });
  };

  const sections = [
    { id: "profile", label: "Profile", icon: <User className="w-5 h-5" />, gradient: "from-blue-500 to-indigo-500" },
    { id: "aiCoach", label: "AI Coach", icon: <Brain className="w-5 h-5" />, gradient: "from-sky-500 to-emerald-600" },
    { id: "voiceAssistant", label: "Voice Assistant", icon: <MessageSquare className="w-5 h-5" />, gradient: "from-indigo-500 to-violet-500" },
    { id: "goals", label: "Goals & Plans", icon: <Crosshair className="w-5 h-5" />, gradient: "from-teal-500 to-cyan-500" },
    { id: "notifications", label: "Notifications", icon: <Bell className="w-5 h-5" />, gradient: "from-blue-500 to-cyan-500" },
    { id: "communication", label: "Communication", icon: <Send className="w-5 h-5" />, gradient: "from-violet-500 to-fuchsia-500" },
    { id: "integrations", label: "Integrations", icon: <LinkIcon className="w-5 h-5" />, gradient: "from-green-500 to-emerald-500" },
    { id: "appearance", label: "Appearance", icon: <Palette className="w-5 h-5" />, gradient: "from-orange-500 to-amber-500" },
    { id: "accountability", label: "Accountability", icon: <Shield className="w-5 h-5" />, gradient: "from-orange-500 to-amber-500" },
    { id: "contracts", label: "Contracts", icon: <Target className="w-5 h-5" />, gradient: "from-cyan-500 to-emerald-500" },
    { id: "subscription", label: "Subscription", icon: <CreditCard className="w-5 h-5" />, gradient: "from-amber-500 to-yellow-500" },
    { id: "security", label: "Security", icon: <Lock className="w-5 h-5" />, gradient: "from-red-500 to-rose-500" },
    { id: "privacy", label: "Privacy", icon: <Shield className="w-5 h-5" />, gradient: "from-rose-500 to-emerald-600" },
    { id: "helpSupport", label: "Help & Support", icon: <HelpCircle className="w-5 h-5" />, gradient: "from-sky-500 to-blue-500" },
    { id: "account", label: "Account", icon: <User className="w-5 h-5" />, gradient: "from-slate-400 to-slate-500" },
  ];

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-slate-950">
        {/* Sidebar placeholder - Desktop */}
        <div className="hidden md:block">
          <DashboardSidebar activeTab={sidebarActiveTab} onTabChange={handleTabChange} />
        </div>
        <MobileBottomNav activeTab={sidebarActiveTab} onTabChange={handleTabChange} />

        <div className="md:ml-64 min-h-screen pb-20 md:pb-0 overflow-x-hidden">
          {/* Background blurs */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl" />
            <div className="absolute top-1/2 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
          </div>

          <div className="relative max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
            {/* Header skeleton */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-8 w-32 bg-white/10 rounded-lg" />
                  <div className="h-4 w-56 bg-white/5 rounded-lg mt-2" />
                </div>
                <div className="h-10 w-36 bg-white/10 rounded-xl" />
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
              {/* Section sidebar skeleton */}
              <nav className="lg:w-64 shrink-0">
                <div className="sticky top-8 space-y-1">
                  {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl">
                      <div className="w-5 h-5 bg-white/10 rounded" />
                      <div className="h-4 bg-white/10 rounded" style={{ width: `${60 + i * 10}px` }} />
                    </div>
                  ))}
                </div>
              </nav>

              {/* Main content skeleton */}
              <main className="flex-1 min-w-0 space-y-6">
                {/* Section card */}
                <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-white/10 rounded-xl" />
                    <div className="h-6 w-48 bg-white/10 rounded-lg" />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-white/10 rounded-xl" />
                          <div className="flex-1">
                            <div className="h-4 w-24 bg-white/10 rounded" />
                            <div className="h-3 w-40 bg-white/5 rounded mt-2" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Second section card */}
                <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-white/10 rounded-xl" />
                    <div className="h-6 w-36 bg-white/10 rounded-lg" />
                  </div>
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02]">
                        <div>
                          <div className="h-4 w-32 bg-white/10 rounded" />
                          <div className="h-3 w-48 bg-white/5 rounded mt-1" />
                        </div>
                        <div className="w-12 h-6 bg-white/10 rounded-full" />
                      </div>
                    ))}
                  </div>
                </div>
              </main>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Sidebar - Desktop */}
      <div className="hidden md:block">
        <DashboardSidebar activeTab={sidebarActiveTab} onTabChange={handleTabChange} />
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav activeTab={sidebarActiveTab} onTabChange={handleTabChange} />

      {/* Main Content */}
      <div className="md:ml-64 min-h-screen pb-20 md:pb-0 overflow-x-hidden">
        {/* Animated Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-emerald-600/8 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  <span className="bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">
                    Settings
                  </span>
                </h1>
                <p className="text-slate-400 mt-1">
                  Manage your preferences and account
                </p>
              </div>

              <button
                onClick={savePreferences}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-emerald-600 text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-sky-500/20"
              >
                {isSaving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                Save Changes
              </button>
            </div>

            {/* Success/Error Messages */}
            {(success || error) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-4 p-4 rounded-xl backdrop-blur-xl ${
                  success
                    ? "bg-green-500/20 border border-green-500/30"
                    : "bg-red-500/20 border border-red-500/30"
                }`}
              >
                <div className="flex items-center gap-2">
                  {success ? (
                    <Check className="w-5 h-5 text-green-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  )}
                  <p className={success ? "text-green-400" : "text-red-400"}>
                    {success || error}
                  </p>
                </div>
              </motion.div>
            )}
          </motion.header>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Internal Section Sidebar */}
            <motion.nav
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:w-64 shrink-0"
            >
              <div className="sticky top-8 space-y-1">
                {sections.map((section) => {
                  const isActive = activeSection === section.id;
                  return (
                    <button
                      key={section.id}
                      onClick={() => goToSettingsSection(section.id as SettingsSectionId)}
                      className={`relative w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                        isActive
                          ? "bg-white/[0.05] text-white"
                          : "text-slate-400 hover:text-white hover:bg-white/[0.03]"
                      }`}
                    >
                      {/* Active gradient left bar */}
                      {isActive && (
                        <motion.div
                          layoutId="settings-section-indicator"
                          className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-gradient-to-b from-sky-500 to-emerald-600"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                      <span
                        className={
                          isActive
                            ? `bg-gradient-to-r ${section.gradient} bg-clip-text text-transparent`
                            : ""
                        }
                      >
                        {section.icon}
                      </span>
                      <span className="font-medium">{section.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.nav>

            {/* Main Content Area */}
            <motion.main
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex-1 min-w-0"
            >
              {/* Profile */}
              {activeSection === "profile" && (
                <ProfileSettingsSection user={user} />
              )}

              {/* AI Coach Settings */}
              {activeSection === "aiCoach" && (
                <div className="space-y-6">
                  {/* Card 1: Coaching Style & Intensity */}
                  <GlassCard>
                    <SectionHeader
                      icon={<Sparkles className="w-5 h-5" />}
                      title="Coach personality & engagement"
                      gradient="from-sky-500 to-emerald-600"
                    />

                    <div className="mb-8">
                      <CoachPersonaPicker
                        value={preferences.coaching.aiCoachPersona}
                        disabled={isSaving}
                        onChange={(id) => {
                          setPreferences((prev) => ({
                            ...prev,
                            coaching: {
                              ...prev.coaching,
                              aiCoachPersona: id,
                              style: coachingStyleForPersona(id),
                            },
                          }));
                        }}
                      />
                    </div>

                    {/* Intensity Level - Segmented Pill */}
                    <div>
                      <label className="text-sm text-slate-400 mb-3 block font-medium">
                        Engagement Level
                      </label>
                      <SegmentedControl
                        options={intensityLevels}
                        value={preferences.coaching.intensity}
                        onChange={(id) => updatePreference("coaching", "intensity", id)}
                      />
                    </div>

                    {/* Check-in Time */}
                    <div className="mt-6 flex items-center gap-4">
                      <div className="flex-1">
                        <label className="text-sm text-slate-400 mb-2 block">
                          Preferred Check-in Time
                        </label>
                        <input
                          type="time"
                          value={preferences.coaching.preferredCheckInTime}
                          onChange={(e) =>
                            updatePreference(
                              "coaching",
                              "preferredCheckInTime",
                              e.target.value
                            )
                          }
                          className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white outline-none focus:border-sky-500 transition-colors"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-sm text-slate-400 mb-2 block">
                          Timezone
                        </label>
                        <div className="px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-slate-300 flex items-center gap-2">
                          <Globe className="w-4 h-4 text-slate-500" />
                          <span className="truncate text-sm">{preferences.coaching.timezone}</span>
                        </div>
                      </div>
                    </div>
                  </GlassCard>

                  {/* Card 2: Communication Preferences */}
                  <GlassCard>
                    <SectionHeader
                      icon={<MessageCircle className="w-5 h-5" />}
                      title="Communication Preferences"
                      gradient="from-blue-500 to-cyan-500"
                    />

                    {/* Formality Level */}
                    <div className="mb-6">
                      <label className="text-sm text-slate-400 mb-3 block font-medium">
                        Formality Level
                      </label>
                      <SegmentedControl
                        options={formalityOptions}
                        value={preferences.coaching.formalityLevel}
                        onChange={(id) =>
                          updatePreference("coaching", "formalityLevel", id)
                        }
                      />
                      {/* Preview text */}
                      <motion.div
                        key={preferences.coaching.formalityLevel}
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 px-4 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]"
                      >
                        <p className="text-sm text-slate-400 italic">
                          &quot;{formalityOptions.find((o) => o.id === preferences.coaching.formalityLevel)?.preview}&quot;
                        </p>
                      </motion.div>
                    </div>

                    {/* Encouragement Level */}
                    <div className="mb-6">
                      <label className="text-sm text-slate-400 mb-3 block font-medium">
                        Encouragement Level
                      </label>
                      <SegmentedControl
                        options={encouragementOptions}
                        value={preferences.coaching.encouragementLevel}
                        onChange={(id) =>
                          updatePreference("coaching", "encouragementLevel", id)
                        }
                      />
                    </div>

                    {/* Use Emojis Toggle */}
                    <div className="flex items-center justify-between mb-6 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                      <div>
                        <p className="text-white font-medium">Use Emojis</p>
                        <p className="text-sm text-slate-400 mt-0.5">
                          Allow emojis in coach messages
                        </p>
                      </div>
                      <ToggleSwitch
                        checked={preferences.coaching.useEmojis}
                        onChange={() =>
                          updatePreference(
                            "coaching",
                            "useEmojis",
                            !preferences.coaching.useEmojis
                          )
                        }
                      />
                    </div>

                    {/* Message Style */}
                    <div>
                      <label className="text-sm text-slate-400 mb-3 block font-medium">
                        Message Style
                      </label>
                      <div className="grid sm:grid-cols-3 gap-3">
                        {messageStyleOptions.map((style) => {
                          const isSelected = preferences.coaching.messageStyle === style.id;
                          return (
                            <button
                              key={style.id}
                              onClick={() =>
                                updatePreference("coaching", "messageStyle", style.id)
                              }
                              className={`relative p-4 rounded-xl border text-center transition-all ${
                                isSelected
                                  ? "bg-white/[0.06] border-sky-500/40 shadow-[0_0_15px_rgba(14,165,233,0.15)]"
                                  : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.04]"
                              }`}
                            >
                              <div className="flex flex-col items-center gap-2">
                                <div
                                  className={`p-2.5 rounded-xl bg-gradient-to-br ${style.gradient} shadow-lg ${
                                    isSelected ? "" : "opacity-60"
                                  }`}
                                >
                                  <span className="text-white">{style.icon}</span>
                                </div>
                                <span
                                  className={`font-medium text-sm ${
                                    isSelected ? "text-white" : "text-slate-300"
                                  }`}
                                >
                                  {style.label}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {style.description}
                                </span>
                              </div>
                              {isSelected && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="absolute top-2 right-2"
                                >
                                  <Check className="w-4 h-4 text-sky-400" />
                                </motion.div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </GlassCard>

                  {/* Card 3: Focus Areas */}
                  <GlassCard>
                    <SectionHeader
                      icon={<Focus className="w-5 h-5" />}
                      title="Focus Areas"
                      gradient="from-emerald-500 to-teal-500"
                    />
                    <p className="text-sm text-slate-400 mb-4">
                      Select up to 5 areas your coach should prioritize.{" "}
                      <span className="text-slate-500">(max 5)</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {availableFocusAreas.map((area) => {
                        const isSelected = preferences.coaching.focusAreas.includes(area);
                        const isDisabled =
                          !isSelected && preferences.coaching.focusAreas.length >= 5;
                        return (
                          <button
                            key={area}
                            onClick={() => toggleFocusArea(area)}
                            disabled={isDisabled}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                              isSelected
                                ? "bg-gradient-to-r from-sky-500/30 to-emerald-600/30 text-white border border-sky-500/40 ring-1 ring-sky-500/20 shadow-[0_0_10px_rgba(14,165,233,0.1)]"
                                : isDisabled
                                ? "bg-white/[0.02] border border-white/[0.04] text-slate-600 cursor-not-allowed"
                                : "bg-white/[0.02] border border-white/[0.08] text-slate-300 hover:border-white/[0.15] hover:bg-white/[0.04]"
                            }`}
                          >
                            {isSelected && (
                              <Check className="w-3 h-3 inline mr-1.5 -mt-0.5" />
                            )}
                            {area}
                          </button>
                        );
                      })}
                    </div>
                    {preferences.coaching.focusAreas.length > 0 && (
                      <p className="text-xs text-slate-500 mt-3">
                        {preferences.coaching.focusAreas.length}/5 selected
                      </p>
                    )}
                  </GlassCard>
                </div>
              )}

              {/* Notifications Settings */}
              {activeSection === "notifications" && (
                <div className="space-y-6">
                  <GlassCard>
                    <div className="flex items-center justify-between mb-6">
                      <SectionHeader
                        icon={<Bell className="w-5 h-5" />}
                        title="Notification Channels"
                        gradient="from-blue-500 to-cyan-500"
                      />
                      <ToggleSwitch
                        checked={preferences.notifications.enabled}
                        onChange={() =>
                          updatePreference(
                            "notifications",
                            "enabled",
                            !preferences.notifications.enabled
                          )
                        }
                      />
                    </div>

                    <div className="space-y-3">
                      {[
                        {
                          id: "push",
                          label: "Push Notifications",
                          icon: <Smartphone className="w-5 h-5" />,
                          key: "push",
                        },
                        {
                          id: "email",
                          label: "Email",
                          icon: <Mail className="w-5 h-5" />,
                          key: "email",
                        },
                        {
                          id: "sms",
                          label: "SMS",
                          icon: <MessageSquare className="w-5 h-5" />,
                          key: "sms",
                        },
                        {
                          id: "whatsapp",
                          label: "WhatsApp",
                          icon: <MessageSquare className="w-5 h-5" />,
                          key: "whatsapp",
                        },
                      ].map((channel) => (
                        <div
                          key={channel.id}
                          className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-white/[0.06] text-slate-400">
                              {channel.icon}
                            </div>
                            <span className="text-slate-300">{channel.label}</span>
                          </div>
                          <ToggleSwitch
                            checked={
                              !!preferences.notifications[
                                channel.key as keyof typeof preferences.notifications
                              ]
                            }
                            onChange={() =>
                              updatePreference(
                                "notifications",
                                channel.key,
                                !preferences.notifications[
                                  channel.key as keyof typeof preferences.notifications
                                ]
                              )
                            }
                            disabled={!preferences.notifications.enabled}
                          />
                        </div>
                      ))}
                    </div>
                  </GlassCard>

                  <GlassCard>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <Moon className="w-5 h-5 text-indigo-400" />
                        <h2 className="text-lg font-semibold text-white">
                          Quiet Hours
                        </h2>
                      </div>
                      <ToggleSwitch
                        checked={preferences.notifications.quietHours.enabled}
                        onChange={() =>
                          setPreferences((prev) => ({
                            ...prev,
                            notifications: {
                              ...prev.notifications,
                              quietHours: {
                                ...prev.notifications.quietHours,
                                enabled: !prev.notifications.quietHours.enabled,
                              },
                            },
                          }))
                        }
                        color="indigo"
                      />
                    </div>

                    {preferences.notifications.quietHours.enabled && (
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <label className="text-sm text-slate-400 mb-2 block">
                            From
                          </label>
                          <input
                            type="time"
                            value={preferences.notifications.quietHours.start}
                            onChange={(e) =>
                              setPreferences((prev) => ({
                                ...prev,
                                notifications: {
                                  ...prev.notifications,
                                  quietHours: {
                                    ...prev.notifications.quietHours,
                                    start: e.target.value,
                                  },
                                },
                              }))
                            }
                            className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white outline-none focus:border-sky-500 transition-colors"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-sm text-slate-400 mb-2 block">
                            To
                          </label>
                          <input
                            type="time"
                            value={preferences.notifications.quietHours.end}
                            onChange={(e) =>
                              setPreferences((prev) => ({
                                ...prev,
                                notifications: {
                                  ...prev.notifications,
                                  quietHours: {
                                    ...prev.notifications.quietHours,
                                    end: e.target.value,
                                  },
                                },
                              }))
                            }
                            className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white outline-none focus:border-sky-500 transition-colors"
                          />
                        </div>
                      </div>
                    )}
                  </GlassCard>
                </div>
              )}

              {activeSection === "communication" && <CommunicationSettingsSection />}

              {/* Integrations */}
              {activeSection === "integrations" && (
                <div className="space-y-6">
                  <GlassCard>
                    <SectionHeader
                      icon={<LinkIcon className="w-5 h-5" />}
                      title="Connected Apps"
                      gradient="from-green-500 to-emerald-500"
                    />

                    {/* WHOOP Integration */}
                    <div className={`mb-6 p-4 rounded-xl border transition-all ${
                      whoopStatus?.isConnected
                        ? 'bg-green-500/5 border-green-500/30'
                        : 'bg-white/[0.02] border-white/[0.06]'
                    }`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3 flex-1">
                          {/* Animated Connection Icon */}
                          <div className="relative">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                              whoopStatus?.isConnected
                                ? 'bg-green-500/20 border-2 border-green-500/50'
                                : whoopStatus?.hasCredentials
                                ? 'bg-yellow-500/20 border-2 border-yellow-500/50'
                                : 'bg-white/[0.06] border border-white/[0.06]'
                            }`}>
                              {whoopStatus?.isConnected ? (
                                <motion.div
                                  animate={{
                                    scale: [1, 1.1, 1],
                                    rotate: [0, 5, -5, 0],
                                  }}
                                  transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                  }}
                                >
                                  <CheckCircle className="w-6 h-6 text-green-400" />
                                </motion.div>
                              ) : (
                                <LinkIcon className={`w-6 h-6 ${
                                  whoopStatus?.hasCredentials ? 'text-yellow-400' : 'text-slate-400'
                                }`} />
                              )}
                            </div>

                            {/* Pulsing ring animation when connected */}
                            {whoopStatus?.isConnected && (
                              <>
                                <motion.div
                                  className="absolute inset-0 rounded-xl border-2 border-green-400/50"
                                  animate={{
                                    scale: [1, 1.3, 1.3],
                                    opacity: [0.6, 0, 0],
                                  }}
                                  transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeOut",
                                  }}
                                />
                                <motion.div
                                  className="absolute inset-0 rounded-xl border-2 border-green-400/30"
                                  animate={{
                                    scale: [1, 1.5, 1.5],
                                    opacity: [0.4, 0, 0],
                                  }}
                                  transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    delay: 0.5,
                                    ease: "easeOut",
                                  }}
                                />
                              </>
                            )}

                            {/* Socket connection indicator */}
                            {whoopStatus?.isConnected && (
                              <motion.div
                                className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"
                                animate={{
                                  scale: [1, 1.2, 1],
                                  opacity: [1, 0.7, 1],
                                }}
                                transition={{
                                  duration: 1.5,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                                }}
                              >
                                <motion.div
                                  className="absolute inset-0 bg-green-400 rounded-full"
                                  animate={{
                                    scale: [1, 2, 2],
                                    opacity: [0.8, 0, 0],
                                  }}
                                  transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    ease: "easeOut",
                                  }}
                                />
                              </motion.div>
                            )}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-white font-medium">WHOOP</p>
                              {whoopStatus?.isConnected && (
                                <motion.span
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400 border border-green-500/30 flex items-center gap-1"
                                >
                                  <Radio className="w-2.5 h-2.5 fill-green-400 text-green-400" />
                                  Connected
                                </motion.span>
                              )}
                              {whoopStatus?.hasCredentials && !whoopStatus?.isConnected && (
                                <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                                  Credentials Set
                                </span>
                              )}
                              {whoopStatus?.webhookRegistered && (
                                <span className="px-2 py-0.5 text-xs rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center gap-1">
                                  <Wifi className="w-2.5 h-2.5" />
                                  Webhook Active
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500">
                              Advanced recovery and strain data
                            </p>
                            {whoopStatus?.isConnected && (
                              <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-2 space-y-1"
                              >
                                {whoopStatus?.email && (
                                  <p className="text-xs text-slate-400">
                                    Email: <span className="text-white">{whoopStatus.email}</span>
                                  </p>
                                )}
                                {whoopStatus?.lastSyncAt && (
                                  <p className="text-xs text-green-400 flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    Last synced: {new Date(whoopStatus.lastSyncAt).toLocaleString()}
                                  </p>
                                )}
                                {whoopStatus?.status && (
                                  <p className="text-xs text-slate-400">
                                    Status: <span className="capitalize text-green-400">{whoopStatus.status}</span>
                                  </p>
                                )}
                              </motion.div>
                            )}
                            {!whoopStatus?.isConnected && whoopStatus?.lastSyncAt && (
                              <p className="text-xs text-slate-400 mt-1">
                                Last synced: {new Date(whoopStatus.lastSyncAt).toLocaleString()}
                              </p>
                            )}
                            {!whoopStatus?.isConnected && whoopStatus?.status && (
                              <p className="text-xs text-slate-400 mt-1">
                                Status: <span className="capitalize">{whoopStatus.status}</span>
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Token Management Button - Always visible */}
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                // Fetch unmasked tokens for form prefilling
                                const unmaskedResponse = await api.get<{
                                  hasTokens: boolean;
                                  accessToken?: string;
                                  refreshToken?: string;
                                  tokenExpiry?: string;
                                  tokenExpiryISO?: string;
                                  status?: string;
                                }>("/integrations/whoop/tokens?unmasked=true");

                                // Also fetch masked tokens for display
                                const maskedResponse = await api.get<{
                                  hasTokens: boolean;
                                  accessTokenMasked?: string;
                                  refreshTokenMasked?: string;
                                  tokenExpiry?: string;
                                  status?: string;
                                }>("/integrations/whoop/tokens");

                                if (unmaskedResponse.success && unmaskedResponse.data?.hasTokens) {
                                  // Prefill form with actual tokens
                                  setTokenData({
                                    accessToken: unmaskedResponse.data.accessToken || '',
                                    refreshToken: unmaskedResponse.data.refreshToken || '',
                                    tokenExpiry: unmaskedResponse.data.tokenExpiry || '',
                                  });
                                  // Set masked info for display
                                  if (maskedResponse.success && maskedResponse.data) {
                                    setTokenInfo(maskedResponse.data);
                                  } else {
                                    setTokenInfo({
                                      hasTokens: true,
                                      accessTokenMasked: '***',
                                      refreshTokenMasked: '***',
                                      tokenExpiry: unmaskedResponse.data.tokenExpiryISO,
                                      status: unmaskedResponse.data.status,
                                    });
                                  }
                                } else {
                                  // No tokens exist
                                  setTokenData({ accessToken: '', refreshToken: '', tokenExpiry: '' });
                                  if (maskedResponse.success && maskedResponse.data) {
                                    setTokenInfo(maskedResponse.data);
                                  } else {
                                    setTokenInfo({ hasTokens: false });
                                  }
                                }
                              } catch (err) {
                                // If no tokens exist, that's okay - show modal for adding
                                console.log("No tokens found or error fetching:", err);
                                setTokenData({ accessToken: '', refreshToken: '', tokenExpiry: '' });
                                setTokenInfo({ hasTokens: false });
                              }
                              // Always show modal
                              setShowTokenModal(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 border border-sky-500/30 transition-colors text-sm font-medium flex items-center gap-2"
                            title="Manage Tokens (Add/Update/Delete/View)"
                          >
                            <Key className="w-4 h-4" />
                            <span>Manage Tokens</span>
                          </button>

                          {!whoopStatus?.isConnected ? (
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  const response = await api.post<{
                                    authUrl: string;
                                    state: string;
                                  }>("/integrations/oauth/initiate", {
                                    provider: "whoop",
                                  });
                                  if (response.success && response.data?.authUrl) {
                                    window.location.href = response.data.authUrl;
                                  } else {
                                    toast.error("Failed to initiate WHOOP connection. Please ensure WHOOP_CLIENT_ID and WHOOP_CLIENT_SECRET are configured.");
                                  }
                                } catch (err: unknown) {
                                  const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                                  console.error("Failed to initiate OAuth:", err);
                                  toast.error(errorMessage || "Failed to connect WHOOP. Please check server configuration.");
                                }
                              }}
                              disabled={!whoopStatus?.hasCredentials}
                              className="px-3 py-1.5 rounded-lg bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 border border-sky-500/30 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {whoopStatus?.hasCredentials ? "Connect WHOOP" : "WHOOP Not Configured"}
                            </button>
                          ) : (
                            <button
                              onClick={async () => {
                                try {
                                  await api.delete("/integrations/whoop");
                                  await fetchPreferences();
                                  toast.success("WHOOP disconnected successfully");
                                } catch (err) {
                                  console.error("Failed to disconnect:", err);
                                  toast.error("Failed to disconnect WHOOP");
                                }
                              }}
                              className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                              title="Disconnect WHOOP"
                            >
                              <Unlink className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Connection Status Card - Only show when connected */}
                      {whoopStatus?.isConnected && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mb-3 p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <motion.div
                                animate={{
                                  scale: [1, 1.1, 1],
                                }}
                                transition={{
                                  duration: 2,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                                }}
                                className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center"
                              >
                                <Wifi className="w-4 h-4 text-green-400" />
                              </motion.div>
                              {/* Data flow animation */}
                              <motion.div
                                className="absolute -left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-green-400 rounded-full"
                                animate={{
                                  x: [0, 8, 0],
                                  opacity: [0, 1, 0],
                                }}
                                transition={{
                                  duration: 1.5,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                                }}
                              />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-white font-medium">Live Connection Active</p>
                              <p className="text-xs text-green-400/80 mt-0.5">
                                Data is syncing in real-time from your WHOOP device
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {!whoopStatus?.isConnected && !whoopStatus?.hasCredentials && (
                        <div className="mt-4 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                          <p className="text-xs text-yellow-400 mb-3">
                            WHOOP OAuth credentials are not configured. Please add your WHOOP Client ID and Client Secret below to connect.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setShowCredentialsModal(true);
                              setCredentialsData({ clientId: '', clientSecret: '' });
                            }}
                            className="px-3 py-1.5 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border border-yellow-500/30 transition-colors text-sm font-medium flex items-center gap-2"
                          >
                            <Key className="w-4 h-4" />
                            Add Credentials
                          </button>
                        </div>
                      )}
                      {whoopStatus?.isConnected && !whoopStatus?.hasCredentials && (
                        <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                          <p className="text-xs text-blue-400">
                            Connected using app-level credentials. You can add your own credentials to manage your connection independently.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Spotify Integration */}
                    <div className={`mb-6 p-4 rounded-xl border transition-all ${
                      spotifyStatus?.isConnected
                        ? 'bg-green-500/5 border-green-500/30'
                        : spotifyStatus?.hasCredentials
                        ? 'bg-green-500/[0.02] border-green-500/10'
                        : 'bg-white/[0.02] border-white/[0.06]'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3 flex-1">
                          {/* Spotify Icon with animation */}
                          <div className="relative">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                              spotifyStatus?.isConnected
                                ? 'bg-green-500/20 border-2 border-green-500/50'
                                : spotifyStatus?.hasCredentials
                                ? 'bg-green-500/10 border-2 border-green-500/30'
                                : 'bg-white/[0.06] border border-white/[0.06]'
                            }`}>
                              {spotifyStatus?.isConnected ? (
                                <motion.div
                                  animate={{ scale: [1, 1.1, 1] }}
                                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                >
                                  <svg className="w-6 h-6 text-green-400" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                                  </svg>
                                </motion.div>
                              ) : (
                                <svg className={`w-6 h-6 ${spotifyStatus?.hasCredentials ? 'text-green-400/60' : 'text-slate-400'}`} viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                                </svg>
                              )}
                            </div>

                            {/* Pulsing ring when connected */}
                            {spotifyStatus?.isConnected && (
                              <>
                                <motion.div
                                  className="absolute inset-0 rounded-xl border-2 border-green-400/50"
                                  animate={{ scale: [1, 1.3, 1.3], opacity: [0.6, 0, 0] }}
                                  transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                                />
                                <motion.div
                                  className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"
                                  animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                />
                              </>
                            )}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-white font-medium">Spotify</p>
                              {spotifyStatus?.isConnected && (
                                <motion.span
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400 border border-green-500/30 flex items-center gap-1"
                                >
                                  <Radio className="w-2.5 h-2.5 fill-green-400 text-green-400" />
                                  Connected
                                </motion.span>
                              )}
                              {!spotifyStatus?.isConnected && spotifyStatus?.hasCredentials && (
                                <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                                  Credentials Set
                                </span>
                              )}
                              {spotifyStatus?.accountType === 'premium' && (
                                <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                  Premium
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500">
                              Music for workouts, meditation & recovery
                            </p>
                            {spotifyStatus?.isConnected && (
                              <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-2 space-y-1"
                              >
                                {spotifyStatus.displayName && (
                                  <p className="text-xs text-slate-400">
                                    Account: <span className="text-white">{spotifyStatus.displayName}</span>
                                  </p>
                                )}
                                {spotifyStatus.connectedAt && (
                                  <p className="text-xs text-green-400 flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    Connected: {new Date(spotifyStatus.connectedAt).toLocaleString()}
                                  </p>
                                )}
                              </motion.div>
                            )}
                            {/* Show masked credentials */}
                            {!spotifyStatus?.isConnected && spotifyStatus?.hasCredentials && spotifyStatus?.clientIdMasked && (
                              <p className="text-xs text-slate-500 mt-1">
                                Client ID: <span className="text-slate-400 font-mono">{spotifyStatus.clientIdMasked}</span>
                                {spotifyStatus.credentialSource === 'env' && (
                                  <span className="ml-1 text-slate-600">(env)</span>
                                )}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Credentials button (gear icon) */}
                          <button
                            type="button"
                            onClick={() => setShowSpotifyCredentialsModal(true)}
                            className="p-2 rounded-lg bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                            title="Manage Spotify Credentials"
                          >
                            <Key className="w-4 h-4" />
                          </button>

                          {!spotifyStatus?.isConnected ? (
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  setIsSpotifyConnecting(true);
                                  // Send the correct redirect URI based on current origin
                                  const redirectUri = `${window.location.origin}/api/integrations/oauth/callback/spotify`;
                                  const response = await api.post<{
                                    authUrl: string;
                                    state: string;
                                  }>('/spotify/auth/connect', { redirectUri });
                                  if (response.success && response.data?.authUrl) {
                                    window.location.href = response.data.authUrl;
                                  } else {
                                    toast.error('Failed to initiate Spotify connection.');
                                  }
                                } catch (err) {
                                  console.error('Failed to connect Spotify:', err);
                                  toast.error('Failed to connect Spotify. Please add your credentials first.');
                                } finally {
                                  setIsSpotifyConnecting(false);
                                }
                              }}
                              disabled={!spotifyStatus?.hasCredentials || isSpotifyConnecting}
                              className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                              {isSpotifyConnecting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : null}
                              {spotifyStatus?.hasCredentials ? 'Connect Spotify' : 'Add Credentials'}
                            </button>
                          ) : (
                            <button
                              onClick={async () => {
                                try {
                                  await api.delete('/spotify/auth/disconnect');
                                  setSpotifyStatus(prev => prev ? { ...prev, isConnected: false } : prev);
                                  toast.success('Spotify disconnected');
                                } catch {
                                  toast.error('Failed to disconnect Spotify');
                                }
                              }}
                              className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                              title="Disconnect Spotify"
                            >
                              <Unlink className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Connected info card */}
                      {spotifyStatus?.isConnected && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-3 p-3 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              {spotifyStatus.avatarUrl && (
                                <img
                                  src={spotifyStatus.avatarUrl}
                                  alt=""
                                  className="w-8 h-8 rounded-full border border-green-500/30"
                                />
                              )}
                              <div>
                                <p className="text-sm text-white font-medium">
                                  {spotifyStatus.accountType === 'premium' ? 'Full Playback Ready' : '30s Previews Available'}
                                </p>
                                <p className="text-xs text-green-400/80 mt-0.5">
                                  {spotifyStatus.accountType === 'premium'
                                    ? 'Stream full tracks directly in Balencia'
                                    : 'Upgrade to Spotify Premium for full playback'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* No credentials — prompt to add */}
                      {!spotifyStatus?.isConnected && !spotifyStatus?.hasCredentials && (
                        <div className="mt-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                          <p className="text-xs text-yellow-400 mb-3">
                            Spotify requires a Client ID and Client Secret to connect. Add your credentials below.
                          </p>
                          <button
                            type="button"
                            onClick={() => setShowSpotifyCredentialsModal(true)}
                            className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 transition-colors text-sm font-medium flex items-center gap-2"
                          >
                            <Key className="w-3.5 h-3.5" />
                            Add Spotify Credentials
                          </button>
                        </div>
                      )}

                      {/* Has credentials but not connected — show Redirect URI setup helper.
                          Spotify returns a blocking "redirect_uri: Not matching configuration"
                          error page (never redirects back) if this URI isn't registered, so we
                          surface it prominently here to prevent the foot-gun. */}
                      {!spotifyStatus?.isConnected && spotifyStatus?.hasCredentials && (
                        <div className="mt-3 p-3 rounded-lg bg-slate-800/40 border border-slate-700/50 space-y-2">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-slate-300 font-medium">
                                Before connecting, register this Redirect URI in your Spotify app
                              </p>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Open your app at{' '}
                                <a
                                  href="https://developer.spotify.com/dashboard"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-green-400 underline hover:text-green-300"
                                >
                                  developer.spotify.com/dashboard
                                </a>
                                {' '}→ Edit Settings → Redirect URIs → paste & save.
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 pl-5">
                            <code className="flex-1 text-[10.5px] font-mono bg-slate-900/80 text-green-300 px-2 py-1.5 rounded border border-slate-700 break-all">
                              {typeof window !== 'undefined'
                                ? `${window.location.origin}/api/integrations/oauth/callback/spotify`
                                : '/api/integrations/oauth/callback/spotify'}
                            </code>
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  const uri = `${window.location.origin}/api/integrations/oauth/callback/spotify`;
                                  await navigator.clipboard.writeText(uri);
                                  toast.success('Redirect URI copied');
                                } catch {
                                  toast.error('Copy failed — select and copy manually');
                                }
                              }}
                              className="shrink-0 px-2 py-1.5 text-[10.5px] rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 transition-colors font-medium"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Has credentials but not connected */}
                      {!spotifyStatus?.isConnected && spotifyStatus?.hasCredentials && spotifyStatus?.credentialSource === 'user' && (
                        <div className="mt-3 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowSpotifyCredentialsModal(true)}
                            className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                          >
                            <Key className="w-3 h-3" />
                            Edit Credentials
                          </button>
                          <span className="text-slate-700">|</span>
                          <button
                            type="button"
                            onClick={async () => {
                              const confirmed = await confirm({
                                title: 'Delete Spotify Credentials',
                                description: 'This will remove your Spotify Client ID and Client Secret. You will need to add them again to reconnect.',
                                confirmText: 'Delete',
                                variant: 'destructive',
                              });
                              if (confirmed) {
                                try {
                                  await api.delete('/spotify/credentials');
                                  setSpotifyStatus(prev => prev ? { ...prev, hasCredentials: false, isConfigured: false, clientIdMasked: undefined, credentialSource: undefined } : prev);
                                  toast.success('Spotify credentials deleted');
                                } catch {
                                  toast.error('Failed to delete credentials');
                                }
                              }
                            }}
                            className="text-xs text-red-400/60 hover:text-red-400 transition-colors flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete Credentials
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Google Calendar Integration — Per-User Credentials */}
                    <div className="mt-4">
                      <GoogleCalendarSection />
                    </div>

                    {/* Prayer Times Integration */}
                    <div className="mt-4">
                      <PrayerTimesSection />
                    </div>

                    {/* Spending Tracker Integration */}
                    <div className="mt-4">
                      <SpendingTrackerSection />
                    </div>

                    {/* Other Integrations */}
                    <div className="space-y-3 mt-4">
                      {integrations
                        .filter((i) => i.provider !== "whoop" && i.provider !== "spotify")
                        .map((integration) => (
                          <div
                            key={integration.provider}
                            className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center">
                                <LinkIcon className="w-5 h-5 text-slate-400" />
                              </div>
                              <div>
                                <p className="text-white font-medium">
                                  {integration.displayName}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {integration.description}
                                </p>
                                {integration.lastSync && (
                                  <p className="text-xs text-slate-400 mt-1">
                                    Last synced:{" "}
                                    {new Date(integration.lastSync).toLocaleString()}
                                  </p>
                                )}
                              </div>
                            </div>
                            {integration.isConnected ? (
                              <button
                                onClick={() => { dataSourceService.disconnect(integration.provider as DataSourceType); toast.success('Disconnected!'); }}
                                className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                              >
                                <Unlink className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => { dataSourceService.connect(integration.provider as any, {}); toast.success('Connected!'); }}
                                className="px-3 py-1.5 rounded-lg bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 transition-colors text-sm font-medium"
                              >
                                Connect
                              </button>
                            )}
                          </div>
                        ))}
                    </div>
                  </GlassCard>
                </div>
              )}

              {/* Appearance */}
              {activeSection === "appearance" && (
                <div className="space-y-6">
                  <GlassCard>
                    <SectionHeader
                      icon={<Palette className="w-5 h-5" />}
                      title="Theme"
                      gradient="from-orange-500 to-amber-500"
                    />
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: "light", label: "Light", icon: <Sun className="w-5 h-5" /> },
                        { id: "dark", label: "Dark", icon: <Moon className="w-5 h-5" /> },
                        {
                          id: "system",
                          label: "System",
                          icon: <Settings className="w-5 h-5" />,
                        },
                      ].map((theme) => {
                        const isSelected = preferences.appearance.theme === theme.id;
                        return (
                          <button
                            key={theme.id}
                            onClick={() =>
                              updatePreference("appearance", "theme", theme.id)
                            }
                            className={`p-4 rounded-xl border text-center transition-all ${
                              isSelected
                                ? "bg-white/[0.06] border-sky-500/40 shadow-[0_0_15px_rgba(14,165,233,0.15)]"
                                : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]"
                            }`}
                          >
                            <div className="flex flex-col items-center gap-2">
                              <span
                                className={
                                  isSelected
                                    ? "text-sky-400"
                                    : "text-slate-400"
                                }
                              >
                                {theme.icon}
                              </span>
                              <span
                                className={
                                  isSelected
                                    ? "text-white"
                                    : "text-slate-300"
                                }
                              >
                                {theme.label}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </GlassCard>

                  <GlassCard>
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-white">
                          Compact Mode
                        </h2>
                        <p className="text-sm text-slate-400 mt-1">
                          Use a more condensed layout
                        </p>
                      </div>
                      <ToggleSwitch
                        checked={preferences.appearance.compactMode}
                        onChange={() =>
                          updatePreference(
                            "appearance",
                            "compactMode",
                            !preferences.appearance.compactMode
                          )
                        }
                      />
                    </div>
                  </GlassCard>
                </div>
              )}

              {/* Voice Assistant */}
              {activeSection === "voiceAssistant" && (
                <div className="space-y-6">
                  <GlassCard>
                    <SectionHeader
                      icon={<MessageSquare className="w-5 h-5" />}
                      title="Voice Assistant"
                      gradient="from-indigo-500 to-violet-500"
                    />
                    <p className="text-slate-400 text-sm mb-6">
                      Customize your AI coach name and language for the voice assistant.
                    </p>
                    <div className="space-y-6">
                      <div>
                        <label
                          htmlFor="assistant-name"
                          className="block text-sm font-medium text-white mb-2"
                        >
                          Assistant name
                        </label>
                        <input
                          id="assistant-name"
                          type="text"
                          value={assistantName}
                          onChange={(e) => setAssistantName(e.target.value)}
                          onBlur={async () => {
                            // Save to database when user leaves the input field
                            try {
                              await api.patch("/preferences", {
                                voiceAssistant: {
                                  assistantName: assistantName.trim() || 'Aurea',
                                },
                              });
                              toast.success("Assistant name saved");
                            } catch (err) {
                              console.error("Failed to save assistant name:", err);
                              toast.error("Failed to save assistant name");
                            }
                          }}
                          placeholder="e.g. Balencia Coach"
                          className="w-full max-w-md px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-colors"
                        />
                        <p className="text-slate-500 text-xs mt-1">
                          This name is shown in the voice assistant and the coach will call itself by this name (e.g. &quot;{assistantName} is ready. Tap to start&quot;).
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Language
                        </label>
                        <LanguageSelector
                          selectedLanguage={selectedLanguage}
                          onLanguageChange={setSelectedLanguage}
                          compact={false}
                          showPreview={true}
                        />
                        <p className="text-slate-500 text-xs mt-2">
                          The assistant will speak and listen in the selected language.
                        </p>
                      </div>
                    </div>
                  </GlassCard>
                </div>
              )}

              {/* Goals & Plans */}
              {activeSection === "goals" && (
                <div className="space-y-6">
                  <GlassCard>
                    <SectionHeader
                      icon={<Crosshair className="w-5 h-5" />}
                      title="Goals & Plans"
                      gradient="from-teal-500 to-cyan-500"
                    />
                    <p className="text-sm text-slate-400 mb-6">
                      Manage your health goals, active plans, and track your progress milestones.
                    </p>

                    <div className="space-y-3">
                      {[
                        { label: "My Goals", desc: "View and manage your active goals", href: "/goals", icon: <Crosshair className="w-4 h-4 text-teal-400" />, color: "teal" },
                        { label: "Active Plans", desc: "Your AI-generated workout and nutrition plans", href: "/plans", icon: <Target className="w-4 h-4 text-cyan-400" />, color: "cyan" },
                        { label: "Life Areas", desc: "Balance across fitness, nutrition, sleep, mindfulness", href: "/life-areas", icon: <BarChart2 className="w-4 h-4 text-emerald-400" />, color: "emerald" },
                        { label: "Progress Tracking", desc: "Detailed progress charts and analytics", href: "/progress", icon: <Flame className="w-4 h-4 text-orange-400" />, color: "orange" },
                      ].map((item) => (
                        <a
                          key={item.href}
                          href={item.href}
                          className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center">
                              {item.icon}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{item.label}</p>
                              <p className="text-xs text-slate-500">{item.desc}</p>
                            </div>
                          </div>
                          <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                        </a>
                      ))}
                    </div>
                  </GlassCard>

                  <GlassCard>
                    <h3 className="text-base font-semibold text-white mb-3">Goal Preferences</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <div>
                          <p className="text-white font-medium">Weekly Check-in Reminders</p>
                          <p className="text-xs text-slate-400">Get reminded to review your weekly goal progress</p>
                        </div>
                        <ToggleSwitch
                          checked={preferences.notifications?.weeklyReport ?? true}
                          onChange={() => updatePreference("notifications", "weeklyReport", !preferences.notifications?.weeklyReport)}
                        />
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <div>
                          <p className="text-white font-medium">AI Goal Suggestions</p>
                          <p className="text-xs text-slate-400">Allow AI to suggest new goals based on your progress</p>
                        </div>
                        <ToggleSwitch
                          checked={preferences.notifications?.aiSuggestions ?? true}
                          onChange={() => updatePreference("notifications", "aiSuggestions", !preferences.notifications?.aiSuggestions)}
                        />
                      </div>
                    </div>
                  </GlassCard>
                </div>
              )}

              {/* Social Accountability */}
              {activeSection === "accountability" && (
                <div className="space-y-6">
                  <GlassCard>
                    <SectionHeader
                      icon={<Shield className="w-5 h-5" />}
                      title="Social Accountability"
                      gradient="from-orange-500 to-amber-500"
                    />
                    <p className="text-sm text-slate-400 mb-6">
                      Enable trusted contacts to receive notifications when you fall behind on your goals. Consent-based and fully customizable.
                    </p>
                    <a
                      href="/dashboard?tab=accountability"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
                        bg-gradient-to-r from-orange-500/15 to-amber-500/15 text-orange-400
                        border border-orange-500/20 hover:border-orange-500/40
                        transition-all cursor-pointer"
                    >
                      <Shield className="w-4 h-4" />
                      Open Accountability Dashboard
                    </a>
                  </GlassCard>

                  <GlassCard>
                    <h3 className="text-base font-semibold text-white mb-4">Features</h3>
                    <div className="space-y-3">
                      {[
                        { step: "1", title: "Consent-Based", desc: "You control who can be notified and when — privacy first" },
                        { step: "2", title: "Trigger Rules", desc: "Set conditions like 'If I miss gym for 3 days, tell my friends'" },
                        { step: "3", title: "Contacts & Groups", desc: "Add trusted people — friends, family, spouse, or coach" },
                        { step: "4", title: "SOS Safety Net", desc: "Emergency contacts are notified if you're inactive for extended periods" },
                        { step: "5", title: "AI First", desc: "AI coach tries to re-engage you before involving others" },
                      ].map((item) => (
                        <div key={item.step} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                          <div className="w-8 h-8 rounded-lg bg-orange-500/15 flex items-center justify-center text-orange-400 text-sm font-bold flex-shrink-0">
                            {item.step}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{item.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                </div>
              )}

              {/* Accountability Contracts */}
              {activeSection === "contracts" && (
                <div className="space-y-6">
                  <GlassCard>
                    <SectionHeader
                      icon={<Target className="w-5 h-5" />}
                      title="Accountability Contracts"
                      gradient="from-cyan-500 to-emerald-500"
                    />
                    <p className="text-sm text-slate-400 mb-6">
                      Create self-imposed commitment contracts with real consequences to boost your discipline and habit adherence.
                    </p>
                    <a
                      href="/contracts"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
                        bg-gradient-to-r from-cyan-500/15 to-emerald-500/15 text-emerald-400
                        border border-emerald-500/20 hover:border-emerald-500/40
                        transition-all cursor-pointer"
                    >
                      <Target className="w-4 h-4" />
                      Open Contracts Dashboard
                    </a>
                  </GlassCard>

                  <GlassCard>
                    <h3 className="text-base font-semibold text-white mb-4">How it works</h3>
                    <div className="space-y-3">
                      {[
                        { step: "1", title: "Create a Contract", desc: "Define a condition (e.g. miss gym) and a penalty (e.g. donate 500 PKR)" },
                        { step: "2", title: "Sign & Activate", desc: "Formally commit — the contract becomes active and monitored" },
                        { step: "3", title: "AI Monitors", desc: "The system checks your activity automatically every 2 hours" },
                        { step: "4", title: "Consequences Apply", desc: "Violations trigger your chosen penalty — XP loss, donation pledge, or social alert" },
                      ].map((item) => (
                        <div key={item.step} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400 text-sm font-bold flex-shrink-0">
                            {item.step}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{item.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </GlassCard>

                  <GlassCard>
                    <h3 className="text-base font-semibold text-white mb-1">AI Suggestions</h3>
                    <p className="text-sm text-slate-400 mb-4">
                      The AI analyzes your behavior patterns and suggests personalized contracts — like workout consistency, calorie control, or streak protection.
                    </p>
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-indigo-500/8 border border-indigo-500/15">
                      <Flame className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                      <p className="text-xs text-indigo-300">
                        Suggestions appear on the Contracts dashboard based on your recent activity data.
                      </p>
                    </div>
                  </GlassCard>
                </div>
              )}

              {/* Privacy */}
              {activeSection === "privacy" && (
                <div className="space-y-6">
                  <GlassCard>
                    <SectionHeader
                      icon={<Shield className="w-5 h-5" />}
                      title="Data & Privacy"
                      gradient="from-rose-500 to-emerald-600"
                    />

                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <div>
                          <p className="text-white font-medium">
                            Share Progress with Coach
                          </p>
                          <p className="text-sm text-slate-400">
                            Allow your AI coach to see detailed progress
                          </p>
                        </div>
                        <ToggleSwitch
                          checked={preferences.privacy.shareProgress}
                          onChange={() =>
                            updatePreference(
                              "privacy",
                              "shareProgress",
                              !preferences.privacy.shareProgress
                            )
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <div>
                          <p className="text-white font-medium">
                            Anonymous Analytics
                          </p>
                          <p className="text-sm text-slate-400">
                            Help improve Balencia with anonymous usage data
                          </p>
                        </div>
                        <ToggleSwitch
                          checked={preferences.privacy.anonymousAnalytics}
                          onChange={() =>
                            updatePreference(
                              "privacy",
                              "anonymousAnalytics",
                              !preferences.privacy.anonymousAnalytics
                            )
                          }
                        />
                      </div>
                    </div>
                  </GlassCard>

                  <GlassCard>
                    <SectionHeader
                      icon={<Accessibility className="w-5 h-5" />}
                      title="Accessibility"
                      gradient="from-violet-500 to-indigo-500"
                    />
                    <p className="text-sm text-slate-400 mb-4">
                      Adjust how motion is used across the app. This is stored on this device only.
                    </p>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                      <div>
                        <p className="text-white font-medium">Reduce motion</p>
                        <p className="text-sm text-slate-400">
                          Minimize animations and transitions for a calmer interface
                        </p>
                      </div>
                      <ToggleSwitch
                        checked={reduceMotionPref}
                        onChange={() => setReduceMotion(!reduceMotionPref)}
                      />
                    </div>
                  </GlassCard>

                  <GlassCard>
                    <SectionHeader
                      icon={<Heart className="w-5 h-5" />}
                      title="Health Profile Visibility"
                      gradient="from-emerald-500 to-teal-500"
                    />
                    <p className="text-sm text-slate-400 mb-4">
                      Control who can view your health data when they click your profile in a chat.
                    </p>

                    <div className="space-y-2">
                      {([
                        { id: 'disabled' as const, label: 'Nobody', desc: 'Health profile is hidden from everyone' },
                        { id: 'friends' as const, label: 'Friends Only', desc: 'Only accepted connections can see your health data' },
                        { id: 'all' as const, label: 'Everyone in Chat', desc: 'Anyone who shares a chat with you can view your health data' },
                        { id: 'custom' as const, label: 'Custom List', desc: 'Only specific users you choose' },
                      ]).map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => updatePreference('privacy', 'healthProfileVisibility', opt.id)}
                          className={cn(
                            'w-full flex items-center gap-3 p-4 rounded-xl border transition-colors text-left',
                            preferences.privacy.healthProfileVisibility === opt.id
                              ? 'border-emerald-500/40 bg-emerald-500/10'
                              : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
                          )}
                        >
                          <div className={cn(
                            'w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center',
                            preferences.privacy.healthProfileVisibility === opt.id
                              ? 'border-emerald-400'
                              : 'border-slate-600'
                          )}>
                            {preferences.privacy.healthProfileVisibility === opt.id && (
                              <div className="w-2 h-2 rounded-full bg-emerald-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{opt.label}</p>
                            <p className="text-xs text-slate-400">{opt.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>

                    {preferences.privacy.healthProfileVisibility === 'custom' && (
                      <div className="mt-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                        <p className="text-xs text-slate-400 mb-2">
                          Custom user list is managed from the chat profile — tap a user and grant or revoke access.
                        </p>
                        {preferences.privacy.healthProfileAllowedUsers.length > 0 ? (
                          <p className="text-xs text-emerald-400">
                            {preferences.privacy.healthProfileAllowedUsers.length} user(s) have access
                          </p>
                        ) : (
                          <p className="text-xs text-slate-500">No users added yet</p>
                        )}
                      </div>
                    )}
                  </GlassCard>

                  <GlassCard>
                    <h2 className="text-lg font-semibold text-white mb-4">
                      Your Data
                    </h2>
                    <div className="flex flex-wrap gap-3">
                      <button className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.03] border border-white/[0.06] text-slate-300 rounded-xl hover:bg-white/[0.06] transition-colors">
                        <Download className="w-4 h-4" />
                        Export Data
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors">
                        <Trash2 className="w-4 h-4" />
                        Delete All Data
                      </button>
                    </div>
                  </GlassCard>
                </div>
              )}

              {/* Subscription */}
              {activeSection === "subscription" && (
                <div className="space-y-6">
                  <GlassCard>
                    <SectionHeader
                      icon={<CreditCard className="w-5 h-5" />}
                      title="Subscription & Billing"
                      gradient="from-amber-500 to-yellow-500"
                    />
                    <p className="text-sm text-slate-400 mb-6">
                      Manage your subscription plan, billing information, and payment history.
                    </p>

                    <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20 mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-white">Current Plan</p>
                          <p className="text-xs text-amber-400 mt-0.5">Free Plan — Basic features</p>
                        </div>
                        <a
                          href="/subscription"
                          className="px-4 py-2 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 text-sm font-medium transition-colors border border-amber-500/20"
                        >
                          Upgrade
                        </a>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {[
                        { label: "View Plans & Pricing", href: "/subscription" },
                        { label: "Billing History", href: "/subscription?tab=billing" },
                        { label: "Manage Payment Method", href: "/subscription?tab=payment" },
                      ].map((link) => (
                        <a
                          key={link.href}
                          href={link.href}
                          className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors group"
                        >
                          <span className="text-sm text-slate-300">{link.label}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition-colors" />
                        </a>
                      ))}
                    </div>
                  </GlassCard>
                </div>
              )}

              {/* Security */}
              {activeSection === "security" && (
                <div className="space-y-6">
                  <GlassCard>
                    <SectionHeader
                      icon={<Lock className="w-5 h-5" />}
                      title="Security"
                      gradient="from-red-500 to-rose-500"
                    />
                    <p className="text-sm text-slate-400 mb-6">
                      Protect your account with strong authentication and monitor active sessions.
                    </p>

                    <div className="space-y-3">
                      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white font-medium">Password</p>
                            <p className="text-xs text-slate-400">Last changed: unknown</p>
                          </div>
                          <button className="px-3 py-1.5 rounded-lg bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] text-sm font-medium transition-colors border border-white/[0.06]">
                            Change Password
                          </button>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white font-medium">Two-Factor Authentication</p>
                            <p className="text-xs text-slate-400">Add an extra layer of security to your account</p>
                          </div>
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-slate-500/15 text-slate-400 border border-slate-500/20">
                            Not Enabled
                          </span>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white font-medium">Active Sessions</p>
                            <p className="text-xs text-slate-400">Manage devices currently logged in</p>
                          </div>
                          <span className="text-xs text-emerald-400 font-medium">1 active</span>
                        </div>
                      </div>
                    </div>
                  </GlassCard>

                  <GlassCard>
                    <h3 className="text-base font-semibold text-white mb-3">Login Activity</h3>
                    <p className="text-sm text-slate-400 mb-4">Recent sign-in activity on your account.</p>
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                          <Smartphone className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-sm text-white font-medium">Current Session</p>
                          <p className="text-xs text-slate-500">Active now</p>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </div>
              )}

              {/* Help & Support */}
              {activeSection === "helpSupport" && (
                <div className="space-y-6">
                  <GlassCard>
                    <SectionHeader
                      icon={<HelpCircle className="w-5 h-5" />}
                      title="Help & Support"
                      gradient="from-sky-500 to-blue-500"
                    />
                    <p className="text-sm text-slate-400 mb-6">
                      Get help, browse FAQs, or reach out to our support team.
                    </p>

                    <div className="space-y-3">
                      {[
                        { label: "FAQ", desc: "Frequently asked questions", href: "/faq", icon: <HelpCircle className="w-4 h-4 text-sky-400" /> },
                        { label: "Help Center", desc: "Guides and tutorials", href: "/help", icon: <HelpCircle className="w-4 h-4 text-blue-400" /> },
                        { label: "Contact Support", desc: "Reach out to our team", href: "/contact", icon: <Mail className="w-4 h-4 text-indigo-400" /> },
                        { label: "Terms of Service", desc: "Review terms and conditions", href: "/terms", icon: <Shield className="w-4 h-4 text-slate-400" /> },
                        { label: "Privacy Policy", desc: "How we handle your data", href: "/privacy", icon: <Lock className="w-4 h-4 text-rose-400" /> },
                      ].map((item) => (
                        <a
                          key={item.href}
                          href={item.href}
                          className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center">
                              {item.icon}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{item.label}</p>
                              <p className="text-xs text-slate-500">{item.desc}</p>
                            </div>
                          </div>
                          <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                        </a>
                      ))}
                    </div>
                  </GlassCard>

                  <GlassCard>
                    <h3 className="text-base font-semibold text-white mb-3">App Info</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <span className="text-sm text-slate-400">Version</span>
                        <span className="text-sm text-white font-mono">1.0.0-beta</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <span className="text-sm text-slate-400">Platform</span>
                        <span className="text-sm text-white">Web</span>
                      </div>
                    </div>
                  </GlassCard>
                </div>
              )}

              {/* Account */}
              {activeSection === "account" && (
                <div className="space-y-6">
                  <GlassCard>
                    <SectionHeader
                      icon={<User className="w-5 h-5" />}
                      title="Account Information"
                      gradient="from-slate-400 to-slate-500"
                    />

                    <div className="space-y-3">
                      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <label className="text-sm text-slate-400 mb-1 block">
                          Name
                        </label>
                        <p className="text-white">
                          {user?.firstName
                            ? `${user.firstName} ${user.lastName || ""}`.trim()
                            : "Not set"}
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <label className="text-sm text-slate-400 mb-1 block">
                          Email
                        </label>
                        <p className="text-white">{user?.email || "Not set"}</p>
                      </div>
                    </div>
                  </GlassCard>

                  <GlassCard>
                    <h2 className="text-lg font-semibold text-white mb-4">
                      Session
                    </h2>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </GlassCard>

                  <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-6">
                    <h2 className="text-lg font-semibold text-red-400 mb-2">
                      Danger Zone
                    </h2>
                    <p className="text-sm text-slate-400 mb-4">
                      Permanently delete your account and all associated data.
                      This action cannot be undone.
                    </p>
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                      Delete Account
                    </button>
                  </div>
                </div>
              )}
            </motion.main>
          </div>
        </div>
      </div>

      {/* Token Management Modal */}
      {showTokenModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-slate-900 rounded-xl border border-slate-700 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Key className="w-5 h-5 text-sky-400" />
                  Manage WHOOP Tokens
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  Add, update, or delete your WHOOP access and refresh tokens
                </p>
              </div>
              <button
                onClick={() => {
                  setShowTokenModal(false);
                  setTokenData({ accessToken: '', refreshToken: '', tokenExpiry: '' });
                  setShowTokens({ access: false, refresh: false });
                }}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Token Info - View Section */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4 text-sky-400" />
                View Current Tokens
              </h4>
              {tokenInfo?.hasTokens ? (
                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-white">Token Status</p>
                    <div className="flex items-center gap-2">
                      {tokenInfo.status === 'paused' ? (
                        <span className="text-xs px-2 py-1 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                          Disabled
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400 border border-green-500/30">
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-slate-400">Access Token: </span>
                      <span className="text-white font-mono">{tokenInfo.accessTokenMasked || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Refresh Token: </span>
                      <span className="text-white font-mono">{tokenInfo.refreshTokenMasked || 'N/A'}</span>
                    </div>
                    {tokenInfo.tokenExpiry && (
                      <div>
                        <span className="text-slate-400">Expires: </span>
                        <span className="text-white">
                          {new Date(tokenInfo.tokenExpiry).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <p className="text-sm text-blue-400">
                    No tokens found. Add your WHOOP access and refresh tokens below.
                  </p>
                </div>
              )}
            </div>

            {/* Add/Update Section */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Save className="w-4 h-4 text-sky-400" />
                {tokenInfo?.hasTokens ? 'Update Tokens' : 'Add Tokens'}
              </h4>
            </div>

            {/* Token Form */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  setIsSaving(true);

                  // Convert datetime-local format to ISO string if provided
                  let tokenExpiryISO: string | undefined = undefined;
                  if (tokenData.tokenExpiry) {
                    // datetime-local format is "YYYY-MM-DDTHH:mm", convert to ISO
                    const date = new Date(tokenData.tokenExpiry);
                    if (!isNaN(date.getTime())) {
                      tokenExpiryISO = date.toISOString();
                    }
                  }

                  const response = await api.post("/integrations/whoop/tokens", {
                    accessToken: tokenData.accessToken,
                    refreshToken: tokenData.refreshToken || undefined,
                    tokenExpiry: tokenExpiryISO,
                  });

                  if (response.success) {
                    toast.success("Tokens saved successfully");
                    // Keep modal open and form prefilled (user might want to edit again)
                    await fetchPreferences();
                    // Refresh token info (both masked for display and unmasked for form)
                    const [maskedResponse, unmaskedResponse] = await Promise.all([
                      api.get<{
                        hasTokens: boolean;
                        accessTokenMasked?: string;
                        refreshTokenMasked?: string;
                        tokenExpiry?: string;
                        status?: string;
                      }>("/integrations/whoop/tokens"),
                      api.get<{
                        hasTokens: boolean;
                        accessToken?: string;
                        refreshToken?: string;
                        tokenExpiry?: string;
                        tokenExpiryISO?: string;
                        status?: string;
                      }>("/integrations/whoop/tokens?unmasked=true"),
                    ]);

                    if (maskedResponse.success && maskedResponse.data) {
                      setTokenInfo(maskedResponse.data);
                    }

                    if (unmaskedResponse.success && unmaskedResponse.data?.hasTokens) {
                      // Update form with latest saved values
                      setTokenData({
                        accessToken: unmaskedResponse.data.accessToken || tokenData.accessToken,
                        refreshToken: unmaskedResponse.data.refreshToken || tokenData.refreshToken,
                        tokenExpiry: unmaskedResponse.data.tokenExpiry || tokenData.tokenExpiry,
                      });
                    }
                  }
                } catch (err) {
                  const errorMessage = err instanceof ApiError ? err.message : 'Failed to save tokens';
                  toast.error(errorMessage);
                } finally {
                  setIsSaving(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Access Token <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showTokens.access ? "text" : "password"}
                    value={tokenData.accessToken}
                    onChange={(e) => setTokenData({ ...tokenData, accessToken: e.target.value })}
                    placeholder="Enter access token"
                    required
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTokens({ ...showTokens, access: !showTokens.access })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showTokens.access ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Refresh Token (optional)
                </label>
                <div className="relative">
                  <input
                    type={showTokens.refresh ? "text" : "password"}
                    value={tokenData.refreshToken}
                    onChange={(e) => setTokenData({ ...tokenData, refreshToken: e.target.value })}
                    placeholder="Enter refresh token (optional)"
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTokens({ ...showTokens, refresh: !showTokens.refresh })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showTokens.refresh ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Token Expiry (optional)
                </label>
                <input
                  type="datetime-local"
                  value={tokenData.tokenExpiry}
                  onChange={(e) => setTokenData({ ...tokenData, tokenExpiry: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSaving || !tokenData.accessToken.trim()}
                  className="flex-1 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : tokenInfo?.hasTokens ? (
                    <>
                      <Save className="w-4 h-4" />
                      Update Tokens
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Add Tokens
                    </>
                  )}
                </button>

                {tokenInfo?.hasTokens && (
                  <>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const newStatus = tokenInfo.status === 'paused' ? false : true;
                          const response = await api.patch("/integrations/whoop/tokens/disable", {
                            disabled: !newStatus,
                          });

                          if (response.success) {
                            toast.success(`Tokens ${newStatus ? 'enabled' : 'disabled'} successfully`);
                            const tokenResponse = await api.get<{
                              hasTokens: boolean;
                              accessTokenMasked?: string;
                              refreshTokenMasked?: string;
                              tokenExpiry?: string;
                              status?: string;
                            }>("/integrations/whoop/tokens");
                            if (tokenResponse.success && tokenResponse.data) {
                              setTokenInfo(tokenResponse.data);
                            } else {
                              setTokenInfo({ hasTokens: false });
                            }
                            await fetchPreferences();
                          }
                        } catch (err) {
                          const errorMessage = err instanceof ApiError ? err.message : 'Failed to toggle tokens';
                          toast.error(errorMessage);
                        }
                      }}
                      className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                      title={tokenInfo.status === 'paused' ? 'Enable tokens' : 'Disable tokens'}
                    >
                      {tokenInfo.status === 'paused' ? (
                        <>
                          <Power className="w-4 h-4" />
                          Enable
                        </>
                      ) : (
                        <>
                          <PowerOff className="w-4 h-4" />
                          Disable
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        const confirmed = await confirm({
                          title: "Delete WHOOP Tokens",
                          description: "Are you sure you want to delete your tokens? This will disconnect your WHOOP integration.",
                          confirmText: "Delete",
                          cancelText: "Cancel",
                          variant: "destructive",
                        });

                        if (!confirmed) {
                          return;
                        }
                        try {
                          const response = await api.delete("/integrations/whoop/tokens");
                          if (response.success) {
                            toast.success("Tokens deleted successfully");
                            setShowTokenModal(false);
                            setTokenInfo({ hasTokens: false });
                            setTokenData({ accessToken: '', refreshToken: '', tokenExpiry: '' });
                            await fetchPreferences();
                          }
                        } catch (err) {
                          const errorMessage = err instanceof ApiError ? err.message : 'Failed to delete tokens';
                          toast.error(errorMessage);
                        }
                      }}
                      className="px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg font-medium transition-colors flex items-center gap-2 border border-red-500/30"
                      title="Delete tokens"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </>
                )}
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Credentials Management Modal */}
      {showCredentialsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-slate-900 rounded-xl border border-slate-700 p-6 max-w-lg w-full"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Key className="w-5 h-5 text-sky-400" />
                  WHOOP Credentials
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  Add your WHOOP Client ID and Client Secret
                </p>
              </div>
              <button
                onClick={() => {
                  setShowCredentialsModal(false);
                  setCredentialsData({ clientId: '', clientSecret: '' });
                  setShowCredentials({ clientId: false, clientSecret: false });
                }}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  setIsSavingCredentials(true);
                  const response = await api.post("/integrations/whoop/credentials", {
                    clientId: credentialsData.clientId,
                    clientSecret: credentialsData.clientSecret,
                  });

                  if (response.success) {
                    toast.success("Credentials saved successfully");
                    setShowCredentialsModal(false);
                    setCredentialsData({ clientId: '', clientSecret: '' });
                    setShowCredentials({ clientId: false, clientSecret: false });
                    await fetchPreferences();
                  }
                } catch (err) {
                  const errorMessage = err instanceof ApiError ? err.message : 'Failed to save credentials';
                  toast.error(errorMessage);
                } finally {
                  setIsSavingCredentials(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Client ID <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCredentials.clientId ? "text" : "password"}
                    value={credentialsData.clientId}
                    onChange={(e) => setCredentialsData({ ...credentialsData, clientId: e.target.value })}
                    placeholder="Enter WHOOP Client ID"
                    required
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCredentials({ ...showCredentials, clientId: !showCredentials.clientId })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showCredentials.clientId ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Client Secret <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCredentials.clientSecret ? "text" : "password"}
                    value={credentialsData.clientSecret}
                    onChange={(e) => setCredentialsData({ ...credentialsData, clientSecret: e.target.value })}
                    placeholder="Enter WHOOP Client Secret"
                    required
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCredentials({ ...showCredentials, clientSecret: !showCredentials.clientSecret })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showCredentials.clientSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSavingCredentials}
                  className="flex-1 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingCredentials ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Credentials
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCredentialsModal(false);
                    setCredentialsData({ clientId: '', clientSecret: '' });
                    setShowCredentials({ clientId: false, clientSecret: false });
                  }}
                  className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Spotify Credentials Modal */}
      {showSpotifyCredentialsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                  Spotify Credentials
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  Add your Spotify Developer App credentials
                </p>
              </div>
              <button
                onClick={() => {
                  setShowSpotifyCredentialsModal(false);
                  setSpotifyCredentialsData({ clientId: '', clientSecret: '' });
                  setShowSpotifyCredentials({ clientId: false, clientSecret: false });
                }}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  setIsSavingSpotifyCredentials(true);
                  const response = await api.post<{ id: string; status: string; requiresReauth?: boolean }>("/spotify/credentials", {
                    clientId: spotifyCredentialsData.clientId,
                    clientSecret: spotifyCredentialsData.clientSecret,
                  });

                  if (response.success) {
                    toast.success(response.data?.requiresReauth
                      ? "Credentials updated. Please reconnect Spotify."
                      : "Spotify credentials saved successfully"
                    );
                    setShowSpotifyCredentialsModal(false);
                    setSpotifyCredentialsData({ clientId: '', clientSecret: '' });
                    setShowSpotifyCredentials({ clientId: false, clientSecret: false });
                    await fetchPreferences();
                  }
                } catch (err) {
                  const errorMessage = err instanceof ApiError ? err.message : 'Failed to save credentials';
                  toast.error(errorMessage);
                } finally {
                  setIsSavingSpotifyCredentials(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Client ID <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showSpotifyCredentials.clientId ? "text" : "password"}
                    value={spotifyCredentialsData.clientId}
                    onChange={(e) => setSpotifyCredentialsData({ ...spotifyCredentialsData, clientId: e.target.value })}
                    placeholder="Enter Spotify Client ID"
                    required
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSpotifyCredentials({ ...showSpotifyCredentials, clientId: !showSpotifyCredentials.clientId })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showSpotifyCredentials.clientId ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Client Secret <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showSpotifyCredentials.clientSecret ? "text" : "password"}
                    value={spotifyCredentialsData.clientSecret}
                    onChange={(e) => setSpotifyCredentialsData({ ...spotifyCredentialsData, clientSecret: e.target.value })}
                    placeholder="Enter Spotify Client Secret"
                    required
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSpotifyCredentials({ ...showSpotifyCredentials, clientSecret: !showSpotifyCredentials.clientSecret })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showSpotifyCredentials.clientSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {spotifyStatus?.hasCredentials && spotifyStatus.credentialSource === 'user' && (
                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <p className="text-xs text-slate-400">
                    Current: <span className="font-mono text-slate-300">{spotifyStatus.clientIdMasked}</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Updating credentials will require reconnecting your Spotify account.
                  </p>
                </div>
              )}

              {/* Setup guide — tells users exactly how to get the Client ID/Secret
                  and (critically) which Redirect URI to paste into the Spotify Dev Dashboard. */}
              <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20 space-y-2">
                <p className="text-xs font-medium text-green-400">How to get credentials</p>
                <ol className="text-[11px] text-slate-400 space-y-1 list-decimal list-inside">
                  <li>
                    Open the{' '}
                    <a
                      href="https://developer.spotify.com/dashboard"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-400 underline hover:text-green-300"
                    >
                      Spotify Developer Dashboard
                    </a>
                    {' '}and create (or open) an app.
                  </li>
                  <li>Copy the Client ID and Client Secret into the fields above.</li>
                  <li>
                    In the app&apos;s settings, add this exact Redirect URI:
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <code className="flex-1 text-[10.5px] font-mono bg-slate-900/80 text-green-300 px-2 py-1.5 rounded border border-slate-700 break-all">
                        {typeof window !== 'undefined'
                          ? `${window.location.origin}/api/integrations/oauth/callback/spotify`
                          : '/api/integrations/oauth/callback/spotify'}
                      </code>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const uri = `${window.location.origin}/api/integrations/oauth/callback/spotify`;
                            await navigator.clipboard.writeText(uri);
                            toast.success('Redirect URI copied');
                          } catch {
                            toast.error('Copy failed — select and copy manually');
                          }
                        }}
                        className="shrink-0 px-2 py-1.5 text-[10.5px] rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 transition-colors font-medium"
                      >
                        Copy
                      </button>
                    </div>
                  </li>
                  <li>Save, then click <span className="text-white font-medium">Connect Spotify</span>.</li>
                </ol>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSavingSpotifyCredentials}
                  className="flex-1 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingSpotifyCredentials ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Credentials
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSpotifyCredentialsModal(false);
                    setSpotifyCredentialsData({ clientId: '', clientSecret: '' });
                    setShowSpotifyCredentials({ clientId: false, clientSecret: false });
                  }}
                  className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>

              {spotifyStatus?.hasCredentials && spotifyStatus.credentialSource === 'user' && (
                <button
                  type="button"
                  onClick={async () => {
                    const confirmed = await confirm({
                      title: 'Delete Spotify Credentials',
                      description: 'This will remove your Spotify Client ID and Client Secret and disconnect your account.',
                      confirmText: 'Delete',
                      variant: 'destructive',
                    });
                    if (confirmed) {
                      try {
                        await api.delete('/spotify/credentials');
                        setSpotifyStatus(prev => prev ? { ...prev, hasCredentials: false, isConfigured: false, isConnected: false, clientIdMasked: undefined, credentialSource: undefined } : prev);
                        setShowSpotifyCredentialsModal(false);
                        setSpotifyCredentialsData({ clientId: '', clientSecret: '' });
                        toast.success('Spotify credentials deleted');
                      } catch {
                        toast.error('Failed to delete credentials');
                      }
                    }
                  }}
                  className="w-full px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Credentials & Disconnect
                </button>
              )}
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default function SettingsPageContent() {
  return (
    <Suspense
      fallback={
        <DashboardPageSkeleton activeTab="settings" variant="compact" />
      }
    >
      <SettingsPageInner />
    </Suspense>
  );
}
