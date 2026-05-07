"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Key,
  Eye,
  EyeOff,
  X,
  Save,
  Loader2,
  Power,
  PowerOff,
  Trash2,
} from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { toast } from "sonner";
import { confirm } from "@/components/common/ConfirmDialog";
import type { TokenInfo } from "./settings-types";

interface WhoopTokenModalProps {
  tokenInfo: TokenInfo | null;
  tokenData: { accessToken: string; refreshToken: string; tokenExpiry: string };
  setTokenData: React.Dispatch<React.SetStateAction<{ accessToken: string; refreshToken: string; tokenExpiry: string }>>;
  setTokenInfo: React.Dispatch<React.SetStateAction<TokenInfo | null>>;
  fetchPreferences: () => Promise<void>;
  onClose: () => void;
}

export function WhoopTokenModal({
  tokenInfo,
  tokenData,
  setTokenData,
  setTokenInfo,
  fetchPreferences,
  onClose,
}: WhoopTokenModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [showTokens, setShowTokens] = useState({ access: false, refresh: false });

  return (
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
              <Key className="w-5 h-5 text-sky-400" /> Manage WHOOP Tokens
            </h3>
            <p className="text-sm text-slate-400 mt-1">Add, update, or delete your WHOOP access and refresh tokens</p>
          </div>
          <button
            onClick={() => {
              onClose();
              setShowTokens({ access: false, refresh: false });
            }}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Current Tokens */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Eye className="w-4 h-4 text-sky-400" /> View Current Tokens
          </h4>
          {tokenInfo?.hasTokens ? (
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-white">Token Status</p>
                <div className="flex items-center gap-2">
                  {tokenInfo.status === "paused" ? (
                    <span className="text-xs px-2 py-1 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">Disabled</span>
                  ) : (
                    <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400 border border-green-500/30">Active</span>
                  )}
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div><span className="text-slate-400">Access Token: </span><span className="text-white font-mono">{tokenInfo.accessTokenMasked || "N/A"}</span></div>
                <div><span className="text-slate-400">Refresh Token: </span><span className="text-white font-mono">{tokenInfo.refreshTokenMasked || "N/A"}</span></div>
                {tokenInfo.tokenExpiry && <div><span className="text-slate-400">Expires: </span><span className="text-white">{new Date(tokenInfo.tokenExpiry).toLocaleString()}</span></div>}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <p className="text-sm text-blue-400">No tokens found. Add your WHOOP access and refresh tokens below.</p>
            </div>
          )}
        </div>

        <div className="mb-6">
          <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Save className="w-4 h-4 text-sky-400" /> {tokenInfo?.hasTokens ? "Update Tokens" : "Add Tokens"}
          </h4>
        </div>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              setIsSaving(true);
              let tokenExpiryISO: string | undefined = undefined;
              if (tokenData.tokenExpiry) {
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
                await fetchPreferences();
                const refreshResponse = await api.get<{
                  hasTokens: boolean;
                  hasAccessToken?: boolean;
                  hasRefreshToken?: boolean;
                  accessTokenMasked?: string;
                  refreshTokenMasked?: string;
                  tokenExpiry?: string;
                  tokenExpiryISO?: string;
                  status?: string;
                  connectedAt?: string;
                }>("/integrations/whoop/tokens");
                if (refreshResponse.success && refreshResponse.data) {
                  setTokenInfo(refreshResponse.data);
                }
              }
            } catch (err) {
              const errorMessage = err instanceof ApiError ? err.message : "Failed to save tokens";
              toast.error(errorMessage);
            } finally {
              setIsSaving(false);
            }
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Access Token <span className="text-red-400">*</span></label>
            <div className="relative">
              <input
                type={showTokens.access ? "text" : "password"}
                value={tokenData.accessToken}
                onChange={(e) => setTokenData({ ...tokenData, accessToken: e.target.value })}
                placeholder="Enter access token"
                required
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500"
              />
              <button type="button" onClick={() => setShowTokens({ ...showTokens, access: !showTokens.access })} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                {showTokens.access ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Refresh Token (optional)</label>
            <div className="relative">
              <input
                type={showTokens.refresh ? "text" : "password"}
                value={tokenData.refreshToken}
                onChange={(e) => setTokenData({ ...tokenData, refreshToken: e.target.value })}
                placeholder="Enter refresh token (optional)"
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500"
              />
              <button type="button" onClick={() => setShowTokens({ ...showTokens, refresh: !showTokens.refresh })} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                {showTokens.refresh ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Token Expiry (optional)</label>
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
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              ) : tokenInfo?.hasTokens ? (
                <><Save className="w-4 h-4" /> Update Tokens</>
              ) : (
                <><Save className="w-4 h-4" /> Add Tokens</>
              )}
            </button>
            {tokenInfo?.hasTokens && (
              <>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const newStatus = tokenInfo.status === "paused" ? false : true;
                      const response = await api.patch("/integrations/whoop/tokens/disable", { disabled: !newStatus });
                      if (response.success) {
                        toast.success(`Tokens ${newStatus ? "enabled" : "disabled"} successfully`);
                        const tokenResponse = await api.get<{ hasTokens: boolean; accessTokenMasked?: string; refreshTokenMasked?: string; tokenExpiry?: string; status?: string }>("/integrations/whoop/tokens");
                        if (tokenResponse.success && tokenResponse.data) {
                          setTokenInfo(tokenResponse.data);
                        } else {
                          setTokenInfo({ hasTokens: false });
                        }
                        await fetchPreferences();
                      }
                    } catch (err) {
                      const errorMessage = err instanceof ApiError ? err.message : "Failed to toggle tokens";
                      toast.error(errorMessage);
                    }
                  }}
                  className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                  title={tokenInfo.status === "paused" ? "Enable tokens" : "Disable tokens"}
                >
                  {tokenInfo.status === "paused" ? <><Power className="w-4 h-4" /> Enable</> : <><PowerOff className="w-4 h-4" /> Disable</>}
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
                    if (!confirmed) return;
                    try {
                      const response = await api.delete("/integrations/whoop/tokens");
                      if (response.success) {
                        toast.success("Tokens deleted successfully");
                        onClose();
                        setTokenInfo({ hasTokens: false });
                        setTokenData({ accessToken: "", refreshToken: "", tokenExpiry: "" });
                        await fetchPreferences();
                      }
                    } catch (err) {
                      const errorMessage = err instanceof ApiError ? err.message : "Failed to delete tokens";
                      toast.error(errorMessage);
                    }
                  }}
                  className="px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg font-medium transition-colors flex items-center gap-2 border border-red-500/30"
                  title="Delete tokens"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
}
