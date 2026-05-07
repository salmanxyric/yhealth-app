"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, X, Save, Loader2, Trash2 } from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { toast } from "sonner";
import { confirm } from "@/components/common/ConfirmDialog";
import type { SpotifyStatus } from "./settings-types";

interface SpotifyCredentialsModalProps {
  spotifyStatus: SpotifyStatus | null;
  setSpotifyStatus: React.Dispatch<React.SetStateAction<SpotifyStatus | null>>;
  fetchPreferences: () => Promise<void>;
  onClose: () => void;
}

export function SpotifyCredentialsModal({
  spotifyStatus,
  setSpotifyStatus,
  fetchPreferences,
  onClose,
}: SpotifyCredentialsModalProps) {
  const [credentialsData, setCredentialsData] = useState({ clientId: "", clientSecret: "" });
  const [showCredentials, setShowCredentials] = useState({ clientId: false, clientSecret: false });
  const [isSaving, setIsSaving] = useState(false);

  const handleClose = () => {
    onClose();
    setCredentialsData({ clientId: "", clientSecret: "" });
    setShowCredentials({ clientId: false, clientSecret: false });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" /></svg>
              Spotify Credentials
            </h3>
            <p className="text-sm text-slate-400 mt-1">Add your Spotify Developer App credentials</p>
          </div>
          <button onClick={handleClose} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              setIsSaving(true);
              const response = await api.post<{ id: string; status: string; requiresReauth?: boolean }>("/spotify/credentials", {
                clientId: credentialsData.clientId,
                clientSecret: credentialsData.clientSecret,
              });
              if (response.success) {
                toast.success(response.data?.requiresReauth ? "Credentials updated. Please reconnect Spotify." : "Spotify credentials saved successfully");
                handleClose();
                await fetchPreferences();
              }
            } catch (err) {
              const errorMessage = err instanceof ApiError ? err.message : "Failed to save credentials";
              toast.error(errorMessage);
            } finally {
              setIsSaving(false);
            }
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Client ID <span className="text-red-400">*</span></label>
            <div className="relative">
              <input
                type={showCredentials.clientId ? "text" : "password"}
                value={credentialsData.clientId}
                onChange={(e) => setCredentialsData({ ...credentialsData, clientId: e.target.value })}
                placeholder="Enter Spotify Client ID"
                required
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
              />
              <button type="button" onClick={() => setShowCredentials({ ...showCredentials, clientId: !showCredentials.clientId })} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                {showCredentials.clientId ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Client Secret <span className="text-red-400">*</span></label>
            <div className="relative">
              <input
                type={showCredentials.clientSecret ? "text" : "password"}
                value={credentialsData.clientSecret}
                onChange={(e) => setCredentialsData({ ...credentialsData, clientSecret: e.target.value })}
                placeholder="Enter Spotify Client Secret"
                required
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
              />
              <button type="button" onClick={() => setShowCredentials({ ...showCredentials, clientSecret: !showCredentials.clientSecret })} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                {showCredentials.clientSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {spotifyStatus?.hasCredentials && spotifyStatus.credentialSource === "user" && (
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <p className="text-xs text-slate-400">Current: <span className="font-mono text-slate-300">{spotifyStatus.clientIdMasked}</span></p>
              <p className="text-xs text-slate-500 mt-1">Updating credentials will require reconnecting your Spotify account.</p>
            </div>
          )}
          <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20 space-y-2">
            <p className="text-xs font-medium text-green-400">How to get credentials</p>
            <ol className="text-[11px] text-slate-400 space-y-1 list-decimal list-inside">
              <li>Open the{" "}<a href="https://developer.spotify.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-green-400 underline hover:text-green-300">Spotify Developer Dashboard</a>{" "}and create (or open) an app.</li>
              <li>Copy the Client ID and Client Secret into the fields above.</li>
              <li>In the app&apos;s settings, add this exact Redirect URI:
                <div className="mt-1.5 flex items-center gap-1.5">
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
              </li>
              <li>Save, then click <span className="text-white font-medium">Connect Spotify</span>.</li>
            </ol>
          </div>
          <div className="flex items-center gap-3 pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Credentials</>}
            </button>
            <button type="button" onClick={handleClose} className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors">Cancel</button>
          </div>
          {spotifyStatus?.hasCredentials && spotifyStatus.credentialSource === "user" && (
            <button
              type="button"
              onClick={async () => {
                const confirmed = await confirm({ title: "Delete Spotify Credentials", description: "This will remove your Spotify Client ID and Client Secret and disconnect your account.", confirmText: "Delete", variant: "destructive" });
                if (confirmed) {
                  try {
                    await api.delete("/spotify/credentials");
                    setSpotifyStatus((prev) => prev ? { ...prev, hasCredentials: false, isConfigured: false, isConnected: false, clientIdMasked: undefined, credentialSource: undefined } : prev);
                    handleClose();
                    toast.success("Spotify credentials deleted");
                  } catch {
                    toast.error("Failed to delete credentials");
                  }
                }
              }}
              className="w-full px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors text-sm flex items-center justify-center gap-2"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Credentials & Disconnect
            </button>
          )}
        </form>
      </motion.div>
    </div>
  );
}
