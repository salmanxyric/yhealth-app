"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Key, Eye, EyeOff, X, Save, Loader2 } from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { toast } from "sonner";

interface WhoopCredentialsModalProps {
  isEdit?: boolean;
  fetchPreferences: () => Promise<void>;
  onClose: () => void;
}

export function WhoopCredentialsModal({
  isEdit = false,
  fetchPreferences,
  onClose,
}: WhoopCredentialsModalProps) {
  const [credentialsData, setCredentialsData] = useState({ clientId: "", clientSecret: "" });
  const [showCredentials, setShowCredentials] = useState({ clientId: false, clientSecret: false });
  const [isSavingCredentials, setIsSavingCredentials] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    setIsLoading(true);
    api.get<{ hasCredentials: boolean; clientId?: string; clientSecret?: string }>("/integrations/whoop/credentials")
      .then((res) => {
        if (!cancelled && res.success && res.data?.hasCredentials) {
          setCredentialsData({
            clientId: res.data.clientId || "",
            clientSecret: res.data.clientSecret || "",
          });
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [isEdit]);

  const handleClose = () => {
    onClose();
    setCredentialsData({ clientId: "", clientSecret: "" });
    setShowCredentials({ clientId: false, clientSecret: false });
  };

  return (
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
              <Key className="w-5 h-5 text-sky-400" /> {isEdit ? "Edit WHOOP Credentials" : "WHOOP Credentials"}
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              {isEdit ? "Update your WHOOP Client ID and Client Secret" : "Add your WHOOP Client ID and Client Secret"}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-sky-400 animate-spin" />
            <span className="ml-2 text-sm text-slate-400">Loading credentials...</span>
          </div>
        ) : (
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
                  toast.success(isEdit ? "Credentials updated successfully" : "Credentials saved successfully");
                  handleClose();
                  await fetchPreferences();
                }
              } catch (err) {
                const errorMessage = err instanceof ApiError ? err.message : "Failed to save credentials";
                toast.error(errorMessage);
              } finally {
                setIsSavingCredentials(false);
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
                  placeholder="Enter WHOOP Client ID"
                  required
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500"
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
                  placeholder="Enter WHOOP Client Secret"
                  required
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500"
                />
                <button type="button" onClick={() => setShowCredentials({ ...showCredentials, clientSecret: !showCredentials.clientSecret })} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
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
                {isSavingCredentials ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> {isEdit ? "Update Credentials" : "Save Credentials"}</>}
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
