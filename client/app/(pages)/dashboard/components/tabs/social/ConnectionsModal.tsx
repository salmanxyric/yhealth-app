"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import {
  Check,
  Clock,
  Loader2,
  MessageSquare,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import type { Follow } from "./types";

type Tab = "received" | "sent" | "followers" | "following" | "mutual";

interface ConnectionsModalProps {
  open: boolean;
  onClose: () => void;
  initialTab?: Tab;
  onAcceptedChat?: (chatId: string | null) => void;
  /** External signal to refetch after user performs an action elsewhere. */
  refreshSignal?: number;
}

const TABS: { id: Tab; label: string; icon: typeof Users }[] = [
  { id: "received", label: "Received", icon: Clock },
  { id: "sent", label: "Sent", icon: UserPlus },
  { id: "followers", label: "Followers", icon: Users },
  { id: "following", label: "Following", icon: UserCheck },
  { id: "mutual", label: "Buddies", icon: UserCheck },
];

export function ConnectionsModal({
  open,
  onClose,
  initialTab = "received",
  onAcceptedChat,
  refreshSignal = 0,
}: ConnectionsModalProps) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [received, setReceived] = useState<Follow[]>([]);
  const [sent, setSent] = useState<Follow[]>([]);
  const [followers, setFollowers] = useState<Follow[]>([]);
  const [following, setFollowing] = useState<Follow[]>([]);
  const [mutual, setMutual] = useState<Follow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Record<string, string>>({});

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, s, f1, f2, m] = await Promise.allSettled([
        api.get<{ requests: Follow[] }>("/follows/pending"),
        api.get<{ requests: Follow[] }>("/follows/pending?direction=sent"),
        api.get<{ followers: Follow[] }>("/follows/followers"),
        api.get<{ following: Follow[] }>("/follows/following"),
        api.get<{ mutual: Follow[] }>("/follows/mutual"),
      ]);
      if (p.status === "fulfilled" && p.value.success) {
        setReceived(p.value.data?.requests || []);
      }
      if (s.status === "fulfilled" && s.value.success) {
        setSent(s.value.data?.requests || []);
      }
      if (f1.status === "fulfilled" && f1.value.success) {
        setFollowers(f1.value.data?.followers || []);
      }
      if (f2.status === "fulfilled" && f2.value.success) {
        setFollowing(f2.value.data?.following || []);
      }
      if (m.status === "fulfilled" && m.value.success) {
        setMutual(m.value.data?.mutual || []);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load connections");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setTab(initialTab);
    fetchAll();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, initialTab, onClose, fetchAll]);

  useEffect(() => {
    if (!open) return;
    if (refreshSignal > 0) fetchAll();
  }, [open, refreshSignal, fetchAll]);

  const markPending = (id: string, key: string) =>
    setPending((prev) => ({ ...prev, [id]: key }));
  const clearPending = (id: string) =>
    setPending((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

  const handleAccept = async (req: Follow) => {
    markPending(req.id, "accept");
    try {
      const res = await api.post<{ follow: Follow }>(`/follows/${req.id}/accept`, {});
      onAcceptedChat?.(res.data?.follow?.chatId ?? null);
      await fetchAll();
    } finally {
      clearPending(req.id);
    }
  };

  const handleReject = async (req: Follow) => {
    markPending(req.id, "reject");
    try {
      await api.post(`/follows/${req.id}/reject`, {});
      await fetchAll();
    } finally {
      clearPending(req.id);
    }
  };

  const handleRemove = async (otherUserId: string) => {
    markPending(otherUserId, "remove");
    try {
      await api.delete(`/follows/${otherUserId}`);
      await fetchAll();
    } finally {
      clearPending(otherUserId);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={onClose}
        className="fixed inset-0 z-[95] backdrop-blur-md"
        style={{ background: "rgba(2,0,15,0.6)" }}
      />
      <motion.div
        key="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Manage connections"
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.96 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-0 z-[96] flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl flex flex-col pointer-events-auto"
          style={{
            maxHeight: "min(90vh, 720px)",
            borderRadius: "24px",
            background:
              "linear-gradient(180deg, rgba(16,19,26,0.96) 0%, rgba(10,12,18,0.96) 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow:
              "0 40px 80px rgba(0,0,0,0.55), 0 0 1px rgba(255,255,255,0.05) inset",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 sm:px-6 py-4"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center rounded-xl"
                style={{
                  width: "38px",
                  height: "38px",
                  background: "rgba(99,102,241,0.12)",
                  border: "1px solid rgba(99,102,241,0.25)",
                }}
              >
                <Users className="w-4.5 h-4.5 text-indigo-300" />
              </div>
              <div>
                <h2
                  className="text-white"
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "17px",
                    fontWeight: 700,
                    letterSpacing: "-0.2px",
                  }}
                >
                  Connections
                </h2>
                <p className="text-xs text-zinc-500">
                  Manage follow requests, buddies, and your social graph
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="flex items-center justify-center rounded-lg transition-colors"
              style={{
                width: "32px",
                height: "32px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
                color: "#94a3b8",
              }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tabs */}
          <div
            className="px-2 sm:px-3 pt-2 pb-1 flex items-center gap-1 overflow-x-auto no-scrollbar"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
          >
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              const count = countFor(t.id, { received, sent, followers, following, mutual });
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className="relative shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors"
                  style={{
                    color: active ? "#ffffff" : "#94a3b8",
                    background: active ? "rgba(255,255,255,0.06)" : "transparent",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t.label}
                  {count > 0 && (
                    <span
                      className="ml-0.5 tabular-nums"
                      style={{
                        background: active ? "rgba(0,208,181,0.2)" : "rgba(255,255,255,0.06)",
                        color: active ? "#34d399" : "#94a3b8",
                        padding: "1px 6px",
                        borderRadius: "6px",
                        fontSize: "10px",
                      }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
              </div>
            )}
            {!loading && error && (
              <div className="py-10 text-center text-sm text-rose-300">{error}</div>
            )}
            {!loading && !error && (
              <>
                {tab === "received" && (
                  <RequestList
                    items={received}
                    emptyLabel="No incoming follow requests."
                    renderActions={(req) => (
                      <>
                        <ActionBtn
                          variant="primary"
                          onClick={() => handleAccept(req)}
                          loading={pending[req.id] === "accept"}
                        >
                          <Check className="w-3.5 h-3.5" />
                          Accept
                        </ActionBtn>
                        <ActionBtn
                          variant="ghost"
                          onClick={() => handleReject(req)}
                          loading={pending[req.id] === "reject"}
                        >
                          <X className="w-3.5 h-3.5" />
                          Decline
                        </ActionBtn>
                      </>
                    )}
                    nameFor={(r) => r.requesterName || "User"}
                    subtitleFor={(r) =>
                      r.requesterMessage || r.matchReason || "Wants to connect"
                    }
                    avatarFor={(r) => r.requesterAvatar || null}
                    initialFor={(r) => r.requesterName?.[0] || "?"}
                  />
                )}
                {tab === "sent" && (
                  <RequestList
                    items={sent}
                    emptyLabel="You haven't sent any follow requests."
                    renderActions={() => (
                      <span
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                        style={{
                          background: "rgba(251,191,36,0.1)",
                          border: "1px solid rgba(251,191,36,0.22)",
                          color: "#fbbf24",
                          fontFamily: "Inter, sans-serif",
                          fontSize: "12px",
                          fontWeight: 600,
                        }}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        Pending
                      </span>
                    )}
                    nameFor={(r) => r.recipientName || "User"}
                    subtitleFor={(r) =>
                      r.matchReason || "Awaiting their response"
                    }
                    avatarFor={(r) => r.recipientAvatar || null}
                    initialFor={(r) => r.recipientName?.[0] || "?"}
                  />
                )}
                {tab === "followers" && (
                  <RequestList
                    items={followers}
                    emptyLabel="No followers yet."
                    renderActions={() => null}
                    nameFor={(r) => r.requesterName || "User"}
                    subtitleFor={(r) => r.matchReason || "Follower"}
                    avatarFor={(r) => r.requesterAvatar || null}
                    initialFor={(r) => r.requesterName?.[0] || "?"}
                  />
                )}
                {tab === "following" && (
                  <RequestList
                    items={following}
                    emptyLabel="You aren't following anyone yet."
                    renderActions={(r) => (
                      <>
                        {r.chatId && (
                          <Link
                            href={`/chat?id=${r.chatId}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                            style={{
                              background: "rgba(0,208,181,0.12)",
                              border: "1px solid rgba(0,208,181,0.28)",
                              color: "#34d399",
                              fontFamily: "Inter, sans-serif",
                              fontSize: "12px",
                              fontWeight: 600,
                              textDecoration: "none",
                            }}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            Chat
                          </Link>
                        )}
                        <ActionBtn
                          variant="ghost"
                          onClick={() => handleRemove(r.recipientId)}
                          loading={pending[r.recipientId] === "remove"}
                        >
                          Unfollow
                        </ActionBtn>
                      </>
                    )}
                    nameFor={(r) => r.recipientName || "User"}
                    subtitleFor={(r) => r.matchReason || "Following"}
                    avatarFor={(r) => r.recipientAvatar || null}
                    initialFor={(r) => r.recipientName?.[0] || "?"}
                  />
                )}
                {tab === "mutual" && (
                  <RequestList
                    items={mutual}
                    emptyLabel="No buddies yet — accept or send a request to start."
                    renderActions={(r) =>
                      r.chatId ? (
                        <Link
                          href={`/chat?id=${r.chatId}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                          style={{
                            background: "rgba(0,208,181,0.12)",
                            border: "1px solid rgba(0,208,181,0.28)",
                            color: "#34d399",
                            fontFamily: "Inter, sans-serif",
                            fontSize: "12px",
                            fontWeight: 600,
                            textDecoration: "none",
                          }}
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Chat
                        </Link>
                      ) : null
                    }
                    nameFor={(r) =>
                      r.recipientName || r.requesterName || "User"
                    }
                    subtitleFor={(r) => r.matchReason || "Buddy"}
                    avatarFor={(r) =>
                      r.recipientAvatar || r.requesterAvatar || null
                    }
                    initialFor={(r) =>
                      (r.recipientName || r.requesterName || "?")[0]
                    }
                  />
                )}
              </>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function countFor(
  tab: Tab,
  data: { received: Follow[]; sent: Follow[]; followers: Follow[]; following: Follow[]; mutual: Follow[] },
): number {
  switch (tab) {
    case "received":
      return data.received.length;
    case "sent":
      return data.sent.length;
    case "followers":
      return data.followers.length;
    case "following":
      return data.following.length;
    case "mutual":
      return data.mutual.length;
  }
}

function RequestList({
  items,
  emptyLabel,
  renderActions,
  nameFor,
  subtitleFor,
  avatarFor,
  initialFor,
}: {
  items: Follow[];
  emptyLabel: string;
  renderActions: (item: Follow) => React.ReactNode;
  nameFor: (item: Follow) => string;
  subtitleFor: (item: Follow) => string;
  avatarFor: (item: Follow) => string | null;
  initialFor: (item: Follow) => string;
}) {
  if (items.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-zinc-500">{emptyLabel}</div>
    );
  }
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-center gap-3 p-3 rounded-xl"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div
            className="flex items-center justify-center overflow-hidden shrink-0"
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              background:
                "linear-gradient(135deg, rgba(99,102,241,0.18), rgba(45,156,219,0.18))",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#ffffff",
              fontFamily: "Inter, sans-serif",
              fontWeight: 700,
              fontSize: "15px",
            }}
          >
            {avatarFor(item) ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={avatarFor(item) || ""}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              initialFor(item).toUpperCase()
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="text-white truncate"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              {nameFor(item)}
            </p>
            <p
              className="truncate"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "11px",
                color: "#64748b",
              }}
            >
              {subtitleFor(item)}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {renderActions(item)}
          </div>
        </li>
      ))}
    </ul>
  );
}

function ActionBtn({
  variant,
  onClick,
  loading,
  children,
}: {
  variant: "primary" | "ghost";
  onClick: () => void;
  loading?: boolean;
  children: React.ReactNode;
}) {
  const styles: Record<typeof variant, React.CSSProperties> = {
    primary: {
      background:
        "linear-gradient(135deg, rgba(16,185,129,0.18) 0%, rgba(45,156,219,0.12) 100%)",
      border: "1px solid rgba(16,185,129,0.3)",
      color: "#34d399",
    },
    ghost: {
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.06)",
      color: "#cbd5e1",
    },
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg disabled:opacity-50"
      style={{
        ...styles[variant],
        fontFamily: "Inter, sans-serif",
        fontSize: "12px",
        fontWeight: 600,
      }}
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : children}
    </button>
  );
}
