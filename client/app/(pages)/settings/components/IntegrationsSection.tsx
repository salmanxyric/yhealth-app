/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Link as LinkIcon,
  Unlink,
  CheckCircle,
  Radio,
  Wifi,
  Trash2,
  Key,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { DataSourceType, dataSourceService } from "@/src/shared/services/data-source.service";
import { toast } from "sonner";
import { confirm } from "@/components/common/ConfirmDialog";
import type { IntegrationsSectionProps } from "./settings-types";
import { GlassCard, SectionHeader } from "./SettingsSharedUI";
import { GoogleCalendarSection } from "./GoogleCalendarSection";
import { PrayerTimesSection } from "./PrayerTimesSection";
import { SpendingTrackerSection } from "./SpendingTrackerSection";
import { WhoopCredentialsModal } from "./WhoopCredentialsModal";
import { SpotifyCredentialsModal } from "./SpotifyCredentialsModal";

export function IntegrationsSection({
  whoopStatus,
  spotifyStatus,
  integrations,
  isSpotifyConnecting,
  setSpotifyStatus,
  setIsSpotifyConnecting,
  fetchPreferences,
}: IntegrationsSectionProps) {
  // Modal visibility state
  const [showCredentialsModal, setShowCredentialsModal] = useState<false | 'add' | 'edit'>(false);
  const [showSpotifyCredentialsModal, setShowSpotifyCredentialsModal] = useState(false);

  return (
    <div className="space-y-6">
      <GlassCard>
        <SectionHeader icon={<LinkIcon className="w-5 h-5" />} title="Connected Apps" gradient="from-green-500 to-emerald-500" />

        {/* WHOOP Integration */}
        <div className={`mb-6 p-4 rounded-xl border transition-all ${whoopStatus?.isConnected ? "bg-green-500/5 border-green-500/30" : "bg-white/[0.02] border-white/[0.06]"}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                    whoopStatus?.isConnected
                      ? "bg-green-500/20 border-2 border-green-500/50"
                      : whoopStatus?.hasCredentials
                      ? "bg-yellow-500/20 border-2 border-yellow-500/50"
                      : "bg-white/[0.06] border border-white/[0.06]"
                  }`}
                >
                  {whoopStatus?.isConnected ? (
                    <motion.div animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    </motion.div>
                  ) : (
                    <LinkIcon className={`w-6 h-6 ${whoopStatus?.hasCredentials ? "text-yellow-400" : "text-slate-400"}`} />
                  )}
                </div>
                {whoopStatus?.isConnected && (
                  <>
                    <motion.div className="absolute inset-0 rounded-xl border-2 border-green-400/50" animate={{ scale: [1, 1.3, 1.3], opacity: [0.6, 0, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }} />
                    <motion.div className="absolute inset-0 rounded-xl border-2 border-green-400/30" animate={{ scale: [1, 1.5, 1.5], opacity: [0.4, 0, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5, ease: "easeOut" }} />
                    <motion.div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full" animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>
                      <motion.div className="absolute inset-0 bg-green-400 rounded-full" animate={{ scale: [1, 2, 2], opacity: [0.8, 0, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }} />
                    </motion.div>
                  </>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-white font-medium">WHOOP</p>
                  {whoopStatus?.isConnected && (
                    <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400 border border-green-500/30 flex items-center gap-1">
                      <Radio className="w-2.5 h-2.5 fill-green-400 text-green-400" /> Connected
                    </motion.span>
                  )}
                  {whoopStatus?.hasCredentials && !whoopStatus?.isConnected && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">Credentials Set</span>
                  )}
                  {whoopStatus?.webhookRegistered && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center gap-1"><Wifi className="w-2.5 h-2.5" /> Webhook Active</span>
                  )}
                </div>
                <p className="text-xs text-slate-500">Advanced recovery and strain data</p>
                {whoopStatus?.isConnected && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-2 space-y-1">
                    {whoopStatus?.email && <p className="text-xs text-slate-400">Email: <span className="text-white">{whoopStatus.email}</span></p>}
                    {whoopStatus?.lastSyncAt && <p className="text-xs text-green-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Last synced: {new Date(whoopStatus.lastSyncAt).toLocaleString()}</p>}
                    {whoopStatus?.status && <p className="text-xs text-slate-400">Status: <span className="capitalize text-green-400">{whoopStatus.status}</span></p>}
                  </motion.div>
                )}
                {!whoopStatus?.isConnected && whoopStatus?.lastSyncAt && <p className="text-xs text-slate-400 mt-1">Last synced: {new Date(whoopStatus.lastSyncAt).toLocaleString()}</p>}
                {!whoopStatus?.isConnected && whoopStatus?.status && <p className="text-xs text-slate-400 mt-1">Status: <span className="capitalize">{whoopStatus.status}</span></p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!whoopStatus?.isConnected ? (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const response = await api.post<{ authUrl: string; state: string }>("/integrations/oauth/initiate", { provider: "whoop" });
                      if (response.success && response.data?.authUrl) {
                        window.location.href = response.data.authUrl;
                      } else {
                        toast.error("Failed to initiate WHOOP connection. Please ensure credentials are configured.");
                      }
                    } catch (err: unknown) {
                      const errorMessage = err instanceof Error ? err.message : "Unknown error";
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

          {whoopStatus?.isConnected && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-3 p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center"><Wifi className="w-4 h-4 text-green-400" /></motion.div>
                  <motion.div className="absolute -left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-green-400 rounded-full" animate={{ x: [0, 8, 0], opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">Live Connection Active</p>
                  <p className="text-xs text-green-400/80 mt-0.5">Data is syncing in real-time from your WHOOP device</p>
                </div>
              </div>
            </motion.div>
          )}

          {!whoopStatus?.hasCredentials && (
            <div className="mt-4 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <p className="text-xs text-yellow-400 mb-3">WHOOP OAuth credentials are not configured. Please add your WHOOP Client ID and Client Secret to connect.</p>
              <button
                type="button"
                onClick={() => setShowCredentialsModal('add')}
                className="px-3 py-1.5 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border border-yellow-500/30 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <Key className="w-4 h-4" /> Add Credentials
              </button>
            </div>
          )}
          {whoopStatus?.hasPerUserCredentials && (
            <div className="mt-3">
              {whoopStatus.clientIdMasked && (
                <p className="text-xs text-slate-500 mb-2">Client ID: <span className="text-slate-400 font-mono">{whoopStatus.clientIdMasked}</span></p>
              )}
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setShowCredentialsModal('edit')} className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1"><Key className="w-3 h-3" /> Edit Credentials</button>
                <span className="text-slate-700">|</span>
                <button
                  type="button"
                  onClick={async () => {
                    const confirmed = await confirm({ title: "Delete WHOOP Credentials", description: "This will remove your WHOOP Client ID and Client Secret. You will need to add them again to reconnect.", confirmText: "Delete", variant: "destructive" });
                    if (confirmed) {
                      try {
                        await api.delete("/integrations/whoop/credentials");
                        await fetchPreferences();
                        toast.success("WHOOP credentials deleted");
                      } catch {
                        toast.error("Failed to delete credentials");
                      }
                    }
                  }}
                  className="text-xs text-red-400/60 hover:text-red-400 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Delete Credentials
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Spotify Integration */}
        <div className={`mb-6 p-4 rounded-xl border transition-all ${spotifyStatus?.isConnected ? "bg-green-500/5 border-green-500/30" : spotifyStatus?.hasCredentials ? "bg-green-500/[0.02] border-green-500/10" : "bg-white/[0.02] border-white/[0.06]"}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${spotifyStatus?.isConnected ? "bg-green-500/20 border-2 border-green-500/50" : spotifyStatus?.hasCredentials ? "bg-green-500/10 border-2 border-green-500/30" : "bg-white/[0.06] border border-white/[0.06]"}`}>
                  {spotifyStatus?.isConnected ? (
                    <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
                      <svg className="w-6 h-6 text-green-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" /></svg>
                    </motion.div>
                  ) : (
                    <svg className={`w-6 h-6 ${spotifyStatus?.hasCredentials ? "text-green-400/60" : "text-slate-400"}`} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" /></svg>
                  )}
                </div>
                {spotifyStatus?.isConnected && (
                  <>
                    <motion.div className="absolute inset-0 rounded-xl border-2 border-green-400/50" animate={{ scale: [1, 1.3, 1.3], opacity: [0.6, 0, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }} />
                    <motion.div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full" animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} />
                  </>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-white font-medium">Spotify</p>
                  {spotifyStatus?.isConnected && <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400 border border-green-500/30 flex items-center gap-1"><Radio className="w-2.5 h-2.5 fill-green-400 text-green-400" /> Connected</motion.span>}
                  {!spotifyStatus?.isConnected && spotifyStatus?.hasCredentials && <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400 border border-green-500/30">Credentials Set</span>}
                  {spotifyStatus?.accountType === "premium" && <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">Premium</span>}
                </div>
                <p className="text-xs text-slate-500">Music for workouts, meditation & recovery</p>
                {spotifyStatus?.isConnected && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-2 space-y-1">
                    {spotifyStatus.displayName && <p className="text-xs text-slate-400">Account: <span className="text-white">{spotifyStatus.displayName}</span></p>}
                    {spotifyStatus.connectedAt && <p className="text-xs text-green-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Connected: {new Date(spotifyStatus.connectedAt).toLocaleString()}</p>}
                  </motion.div>
                )}
                {!spotifyStatus?.isConnected && spotifyStatus?.hasCredentials && spotifyStatus?.clientIdMasked && (
                  <p className="text-xs text-slate-500 mt-1">Client ID: <span className="text-slate-400 font-mono">{spotifyStatus.clientIdMasked}</span>{spotifyStatus.credentialSource === "env" && <span className="ml-1 text-slate-600">(env)</span>}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setShowSpotifyCredentialsModal(true)} className="p-2 rounded-lg bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors" title="Manage Spotify Credentials"><Key className="w-4 h-4" /></button>
              {!spotifyStatus?.isConnected ? (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      setIsSpotifyConnecting(true);
                      const redirectUri = `${window.location.origin}/api/integrations/oauth/callback/spotify`;
                      const response = await api.post<{ authUrl: string; state: string }>("/spotify/auth/connect", { redirectUri });
                      if (response.success && response.data?.authUrl) {
                        window.location.href = response.data.authUrl;
                      } else {
                        toast.error("Failed to initiate Spotify connection.");
                      }
                    } catch (err) {
                      console.error("Failed to connect Spotify:", err);
                      toast.error("Failed to connect Spotify. Please add your credentials first.");
                    } finally {
                      setIsSpotifyConnecting(false);
                    }
                  }}
                  disabled={!spotifyStatus?.hasCredentials || isSpotifyConnecting}
                  className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSpotifyConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {spotifyStatus?.hasCredentials ? "Connect Spotify" : "Add Credentials"}
                </button>
              ) : (
                <button
                  onClick={async () => {
                    try {
                      await api.delete("/spotify/auth/disconnect");
                      setSpotifyStatus((prev) => prev ? { ...prev, isConnected: false } : prev);
                      toast.success("Spotify disconnected");
                    } catch {
                      toast.error("Failed to disconnect Spotify");
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

          {spotifyStatus?.isConnected && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3 p-3 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {spotifyStatus.avatarUrl && <img src={spotifyStatus.avatarUrl} alt="" className="w-8 h-8 rounded-full border border-green-500/30" />}
                  <div>
                    <p className="text-sm text-white font-medium">{spotifyStatus.accountType === "premium" ? "Full Playback Ready" : "30s Previews Available"}</p>
                    <p className="text-xs text-green-400/80 mt-0.5">{spotifyStatus.accountType === "premium" ? "Stream full tracks directly in Balencia" : "Upgrade to Spotify Premium for full playback"}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {!spotifyStatus?.isConnected && !spotifyStatus?.hasCredentials && (
            <div className="mt-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <p className="text-xs text-yellow-400 mb-3">Spotify requires a Client ID and Client Secret to connect. Add your credentials below.</p>
              <button type="button" onClick={() => setShowSpotifyCredentialsModal(true)} className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 transition-colors text-sm font-medium flex items-center gap-2"><Key className="w-3.5 h-3.5" /> Add Spotify Credentials</button>
            </div>
          )}

          {!spotifyStatus?.isConnected && spotifyStatus?.hasCredentials && (
            <div className="mt-3 p-3 rounded-lg bg-slate-800/40 border border-slate-700/50 space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-300 font-medium">Before connecting, register this Redirect URI in your Spotify app</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Open your app at{" "}<a href="https://developer.spotify.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-green-400 underline hover:text-green-300">developer.spotify.com/dashboard</a>{" "}→ Edit Settings → Redirect URIs → paste & save.</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 pl-5">
                <code className="flex-1 text-[10.5px] font-mono bg-slate-900/80 text-green-300 px-2 py-1.5 rounded border border-slate-700 break-all">{typeof window !== "undefined" ? `${window.location.origin}/api/integrations/oauth/callback/spotify` : "/api/integrations/oauth/callback/spotify"}</code>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const uri = `${window.location.origin}/api/integrations/oauth/callback/spotify`;
                      await navigator.clipboard.writeText(uri);
                      toast.success("Redirect URI copied");
                    } catch {
                      toast.error("Copy failed — select and copy manually");
                    }
                  }}
                  className="shrink-0 px-2 py-1.5 text-[10.5px] rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 transition-colors font-medium"
                >
                  Copy
                </button>
              </div>
            </div>
          )}

          {!spotifyStatus?.isConnected && spotifyStatus?.hasCredentials && spotifyStatus?.credentialSource === "user" && (
            <div className="mt-3 flex items-center gap-2">
              <button type="button" onClick={() => setShowSpotifyCredentialsModal(true)} className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1"><Key className="w-3 h-3" /> Edit Credentials</button>
              <span className="text-slate-700">|</span>
              <button
                type="button"
                onClick={async () => {
                  const confirmed = await confirm({ title: "Delete Spotify Credentials", description: "This will remove your Spotify Client ID and Client Secret. You will need to add them again to reconnect.", confirmText: "Delete", variant: "destructive" });
                  if (confirmed) {
                    try {
                      await api.delete("/spotify/credentials");
                      setSpotifyStatus((prev) => prev ? { ...prev, hasCredentials: false, isConfigured: false, clientIdMasked: undefined, credentialSource: undefined } : prev);
                      toast.success("Spotify credentials deleted");
                    } catch {
                      toast.error("Failed to delete credentials");
                    }
                  }
                }}
                className="text-xs text-red-400/60 hover:text-red-400 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Delete Credentials
              </button>
            </div>
          )}
        </div>

        {/* Google Calendar Integration */}
        <div className="mt-4"><GoogleCalendarSection /></div>
        {/* Prayer Times Integration */}
        <div className="mt-4"><PrayerTimesSection /></div>
        {/* Spending Tracker Integration */}
        <div className="mt-4"><SpendingTrackerSection /></div>

        {/* Other Integrations */}
        <div className="space-y-3 mt-4">
          {integrations.filter((i) => i.provider !== "whoop" && i.provider !== "spotify").map((integration) => (
            <div key={integration.provider} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center"><LinkIcon className="w-5 h-5 text-slate-400" /></div>
                <div>
                  <p className="text-white font-medium">{integration.displayName}</p>
                  <p className="text-xs text-slate-500">{integration.description}</p>
                  {integration.lastSync && <p className="text-xs text-slate-400 mt-1">Last synced: {new Date(integration.lastSync).toLocaleString()}</p>}
                </div>
              </div>
              {integration.isConnected ? (
                <button onClick={() => { dataSourceService.disconnect(integration.provider as DataSourceType); toast.success("Disconnected!"); }} className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"><Unlink className="w-4 h-4" /></button>
              ) : (
                <button onClick={() => { dataSourceService.connect(integration.provider as DataSourceType, {}); toast.success("Connected!"); }} className="px-3 py-1.5 rounded-lg bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 transition-colors text-sm font-medium">Connect</button>
              )}
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Modals */}
      {showCredentialsModal && (
        <WhoopCredentialsModal
          isEdit={showCredentialsModal === 'edit'}
          fetchPreferences={fetchPreferences}
          onClose={() => setShowCredentialsModal(false)}
        />
      )}

      {showSpotifyCredentialsModal && (
        <SpotifyCredentialsModal
          spotifyStatus={spotifyStatus}
          setSpotifyStatus={setSpotifyStatus}
          fetchPreferences={fetchPreferences}
          onClose={() => setShowSpotifyCredentialsModal(false)}
        />
      )}
    </div>
  );
}
