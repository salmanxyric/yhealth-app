"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Users,
  UserPlus,
  X,
  Search,
  
  
  Loader2,
  
  
  Trash2,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { accountabilityService } from "@/src/shared/services/accountability.service";
import type { AccountabilityContact } from "@/src/shared/services/accountability.service";

interface ContactManagerProps {
  contacts: AccountabilityContact[];
  onRefresh: () => void;
}

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  friend: { label: "Friend", color: "#34d399" },
  spouse: { label: "Spouse", color: "#f472b6" },
  family: { label: "Family", color: "#a78bfa" },
  coach: { label: "Coach", color: "#38bdf8" },
  mentor: { label: "Mentor", color: "#fbbf24" },
};

interface UserResult {
  id: string;
  name: string;
  avatar?: string;
}

export function ContactManager({ contacts, onRefresh }: ContactManagerProps) {
  const prefersReducedMotion = useReducedMotion();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedRole, setSelectedRole] = useState("friend");
  const [adding, setAdding] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  const searchUsers = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await api.get<{ users: UserResult[] }>("/follows/search", {
        params: { query: q, limit: 10 },
      });
      if (res.success && res.data) {
        const existingIds = new Set(contacts.map((c) => c.contactUserId));
        setSearchResults(
          (res.data.users || []).filter((u: UserResult) => !existingIds.has(u.id))
        );
      }
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [contacts]);

  useEffect(() => {
    const timer = setTimeout(() => searchUsers(search), 300);
    return () => clearTimeout(timer);
  }, [search, searchUsers]);

  const handleAdd = async (userId: string) => {
    setAdding(userId);
    try {
      await accountabilityService.addContact(userId, undefined, selectedRole);
      setSearch("");
      setSearchResults([]);
      onRefresh();
    } catch {
      // handled silently
    } finally {
      setAdding(null);
    }
  };

  const handleRemove = async (contactId: string) => {
    setRemoving(contactId);
    try {
      await accountabilityService.removeContact(contactId);
      onRefresh();
    } catch {
      // handled silently
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">
            Accountability Contacts ({contacts.length})
          </h3>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium
            bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/15
            transition-all cursor-pointer"
        >
          {showAdd ? <X className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
          {showAdd ? "Cancel" : "Add Contact"}
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search users by name..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08]
                    text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-emerald-500/40 transition-colors"
                />
                {searching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 animate-spin" />
                )}
              </div>

              <div className="flex gap-1.5 flex-wrap">
                {Object.entries(ROLE_CONFIG).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedRole(key)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                      selectedRole === key
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                        : "bg-white/[0.03] text-zinc-500 border border-white/[0.05] hover:text-zinc-300"
                    }`}
                  >
                    {cfg.label}
                  </button>
                ))}
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-xs font-bold">
                          {user.name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <span className="text-sm text-white">{user.name}</span>
                      </div>
                      <button
                        onClick={() => handleAdd(user.id)}
                        disabled={adding === user.id}
                        className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20
                          disabled:opacity-50 transition-all cursor-pointer"
                      >
                        {adding === user.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <UserPlus className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {search.length >= 2 && !searching && searchResults.length === 0 && (
                <p className="text-xs text-zinc-600 text-center py-3">No users found</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {contacts.length === 0 ? (
        <div className="text-center py-10">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6 text-zinc-700" />
          </div>
          <p className="text-sm text-zinc-500">No contacts yet</p>
          <p className="text-xs text-zinc-600 mt-1">Add trusted people to your accountability circle</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {contacts.map((contact, i) => {
            const roleConfig = ROLE_CONFIG[contact.role] || ROLE_CONFIG.friend;
            const displayName =
              contact.contactName?.trim() ||
              contact.nickname?.trim() ||
              (contact as unknown as { contactEmail?: string }).contactEmail?.split("@")[0] ||
              "User";
            const initial = displayName[0]?.toUpperCase() || "?";
            return (
              <motion.div
                key={contact.id}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="group relative overflow-hidden rounded-2xl border border-white/[0.06]
                  bg-gradient-to-br from-white/[0.035] to-white/[0.01] hover:border-emerald-500/25
                  hover:from-emerald-500/[0.06] hover:to-white/[0.015]
                  transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/5"
              >
                {/* Accent glow on hover */}
                <div
                  className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-0
                    group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: `${roleConfig.color}33` }}
                />

                <div className="relative p-4 flex items-center gap-3">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    {contact.contactAvatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={contact.contactAvatar}
                        alt={displayName}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-white/10
                          group-hover:ring-emerald-400/40 transition-all"
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white text-base font-bold
                          ring-2 ring-white/10 group-hover:ring-emerald-400/40 transition-all"
                        style={{
                          background: `linear-gradient(135deg, ${roleConfig.color}55, ${roleConfig.color}20)`,
                        }}
                      >
                        {initial}
                      </div>
                    )}
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#0a0d14]"
                      style={{ background: contact.isActive ? "#34d399" : "#52525b" }}
                      aria-label={contact.isActive ? "Active" : "Inactive"}
                    />
                  </div>

                  {/* Name + role */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded-md border"
                        style={{
                          background: `${roleConfig.color}15`,
                          color: roleConfig.color,
                          borderColor: `${roleConfig.color}30`,
                        }}
                      >
                        {roleConfig.label}
                      </span>
                    </div>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => handleRemove(contact.id)}
                    disabled={removing === contact.id}
                    aria-label={`Remove ${displayName}`}
                    className="shrink-0 p-2 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10
                      transition-all cursor-pointer disabled:opacity-50
                      md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100"
                  >
                    {removing === contact.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
