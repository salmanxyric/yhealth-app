'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Clock, Loader2, Search, Sparkles, Target, Trophy, UserPlus, Users, X, Zap, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { api, ApiError } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Follow {
  id: string;
  requesterId: string;
  recipientId: string;
  status: string;
  chatId: string | null;
  matchReason: string | null;
  matchScore: number | null;
  requesterMessage: string | null;
  requesterName?: string;
  requesterAvatar?: string;
  recipientName?: string;
  recipientAvatar?: string;
}

interface BuddySuggestion {
  userId: string;
  firstName: string;
  lastName: string | null;
  avatar: string | null;
  matchScore: number;
  matchReason: string;
  primaryGoal: string | null;
  primaryPillar: string | null;
  activityLevel: string;
  currentStreak: number;
  suggestedChallenge?: {
    name: string;
    description: string;
    metric: string;
    durationDays: number;
  } | null;
}

interface SocialStats {
  pendingCount: number;
}

interface UserSearchResult {
  id: string;
  name: string;
  avatar?: string;
}

interface GeneratedChallenge {
  name: string;
  description: string;
  metric: string;
  durationDays: number;
  target?: number | null;
  reasoning?: string;
  scoringWeights?: Record<string, number>;
}

type Tab = 'requests' | 'suggestions' | 'search';

interface ChatSocialModalProps {
  open: boolean;
  onClose: () => void;
  onChatCreated?: (chatId: string) => void;
  onPendingCountChange?: (count: number) => void;
}

export function ChatSocialModal({
  open,
  onClose,
  onChatCreated,
  onPendingCountChange,
}: ChatSocialModalProps) {
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('requests');
  const [requests, setRequests] = useState<Follow[]>([]);
  const [suggestions, setSuggestions] = useState<BuddySuggestion[]>([]);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedSuggestionIds, setSelectedSuggestionIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const fetchSocialData = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    setError(null);
    try {
      const [statsResult, requestsResult, suggestionsResult] = await Promise.allSettled([
        api.get<{ stats: SocialStats }>('/follows/stats'),
        api.get<{ requests: Follow[] }>('/follows/pending'),
        api.get<{ suggestions: BuddySuggestion[] }>('/follows/suggestions', { params: { limit: 8 } }),
      ]);

      if (statsResult.status === 'fulfilled' && statsResult.value.success) {
        onPendingCountChange?.(statsResult.value.data?.stats.pendingCount ?? 0);
      }
      if (requestsResult.status === 'fulfilled' && requestsResult.value.success) {
        const nextRequests = requestsResult.value.data?.requests ?? [];
        setRequests(nextRequests);
        onPendingCountChange?.(nextRequests.length);
      }
      if (suggestionsResult.status === 'fulfilled' && suggestionsResult.value.success) {
        const nextSuggestions = suggestionsResult.value.data?.suggestions ?? [];
        setSuggestions(nextSuggestions);
        setSelectedSuggestionIds((prev) => {
          const allowed = new Set(nextSuggestions.map((item) => item.userId));
          return new Set([...prev].filter((id) => allowed.has(id)));
        });
      }

      if (
        requestsResult.status === 'rejected' &&
        suggestionsResult.status === 'rejected' &&
        statsResult.status === 'rejected'
      ) {
        throw requestsResult.reason;
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load buddy matching');
    } finally {
      setLoading(false);
    }
  }, [onPendingCountChange, open]);

  useEffect(() => {
    if (!open) return;
    setTab('requests');
    fetchSocialData();
  }, [fetchSocialData, open]);

  useEffect(() => {
    if (!open || tab !== 'search') return;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setSearching(true);
      try {
        const result = await api.get<{ users: UserSearchResult[] }>('/follows/search', {
          params: { q: trimmed, limit: 10 },
          signal: controller.signal,
        });
        setSearchResults(result.data?.users ?? []);
      } catch (err) {
        if (!(err instanceof ApiError && err.code === 'CANCELED')) setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [open, query, tab]);

  const acceptRequest = async (request: Follow) => {
    setPendingAction(`accept:${request.id}`);
    try {
      const result = await api.post<{ follow: Follow }>(`/follows/${request.id}/accept`, {});
      const chatId = result.data?.follow?.chatId;
      toast({ title: 'Friend request accepted', description: 'A private chat is ready.' });
      await fetchSocialData();
      if (chatId) {
        onChatCreated?.(chatId);
        onClose();
      }
    } catch (err) {
      toast({
        title: 'Could not accept request',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setPendingAction(null);
    }
  };

  const rejectRequest = async (request: Follow) => {
    setPendingAction(`reject:${request.id}`);
    try {
      await api.post(`/follows/${request.id}/reject`, {});
      toast({ title: 'Friend request rejected' });
      await fetchSocialData();
    } catch (err) {
      toast({
        title: 'Could not reject request',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setPendingAction(null);
    }
  };

  const sendFollowRequest = async (userId: string, source: 'suggestion' | 'search') => {
    setPendingAction(`follow:${userId}`);
    try {
      await api.post(`/follows/${userId}`, {});
      if (source === 'suggestion') {
        setSuggestions((prev) => prev.filter((item) => item.userId !== userId));
      }
      toast({ title: 'Friend request sent', description: 'You can chat once they accept.' });
    } catch (err) {
      toast({
        title: 'Could not send request',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setPendingAction(null);
    }
  };

  const toggleSuggestionSelection = (userId: string) => {
    setSelectedSuggestionIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const createSharedChallenge = async () => {
    const inviteeIds = [...selectedSuggestionIds];
    if (inviteeIds.length < 2) {
      toast({
        title: 'Select at least two buddies',
        description: 'A group challenge needs you plus two or more matched users.',
        variant: 'destructive',
      });
      return;
    }

    setPendingAction('challenge:create');
    try {
      const generated = await api.post<{ challenge: GeneratedChallenge }>('/competitions/shared-challenge/generate', {
        userIds: inviteeIds,
      });
      const challenge = generated.data?.challenge;
      if (!challenge) throw new Error('Challenge generation returned no result');

      await api.post('/competitions/shared-challenge/create', {
        challenge,
        inviteeIds,
        message: challenge.reasoning || 'AI matched our goals into a shared accountability challenge.',
      });

      toast({
        title: 'Challenge invitations sent',
        description: `"${challenge.name}" was created for ${inviteeIds.length + 1} people.`,
      });
      setSelectedSuggestionIds(new Set());
    } catch (err) {
      toast({
        title: 'Could not create challenge',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setPendingAction(null);
    }
  };

  const dismissSuggestion = async (userId: string) => {
    setPendingAction(`dismiss:${userId}`);
    try {
      await api.post(`/follows/suggestions/${userId}/dismiss`, {});
      setSuggestions((prev) => prev.filter((item) => item.userId !== userId));
    } catch (err) {
      toast({
        title: 'Could not dismiss suggestion',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setPendingAction(null);
    }
  };

  const title = useMemo(() => {
    if (tab === 'requests') return 'Friend Requests';
    if (tab === 'suggestions') return 'Buddy Matching';
    return 'Find People';
  }, [tab]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 px-4 backdrop-blur-md">
      <div className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0b1020]/95 shadow-2xl shadow-black/60">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10">
              <Users className="h-5 w-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">{title}</h2>
              <p className="text-xs text-slate-400">Connect with goal-aligned accountability buddies</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full text-slate-400 hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex gap-1 border-b border-white/5 px-3 py-2">
          <TabButton active={tab === 'requests'} count={requests.length} onClick={() => setTab('requests')}>Requests</TabButton>
          <TabButton active={tab === 'suggestions'} count={suggestions.length} onClick={() => setTab('suggestions')}>Suggestions</TabButton>
          <TabButton active={tab === 'search'} onClick={() => setTab('search')}>Search</TabButton>
        </div>

        <div className="min-h-90 flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <LoadingSkeleton tab={tab} />
          ) : error ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>
          ) : (
            <>
              {tab === 'requests' && (
                <div className="space-y-3">
                  {requests.length === 0 ? (
                    <EmptyState icon={Clock} title="No pending requests" description="New friend requests will show here instantly." />
                  ) : requests.map((request) => (
                    <PersonRow
                      key={request.id}
                      name={request.requesterName || 'User'}
                      avatar={request.requesterAvatar}
                      subtitle={request.requesterMessage || request.matchReason || 'Wants to connect with you'}
                      badge="Received"
                      actions={(
                        <>
                          <Button size="sm" onClick={() => acceptRequest(request)} disabled={!!pendingAction} className="bg-emerald-500 text-white hover:bg-emerald-400">
                            {pendingAction === `accept:${request.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                            Accept
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => rejectRequest(request)} disabled={!!pendingAction} className="text-slate-300 hover:bg-red-500/10 hover:text-red-300">
                            {pendingAction === `reject:${request.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                            Reject
                          </Button>
                        </>
                      )}
                    />
                  ))}
                </div>
              )}

              {tab === 'suggestions' && (
                <div className="space-y-3">
                  {suggestions.length === 0 ? (
                    <EmptyState icon={Sparkles} title="No suggestions yet" description="Enable buddy discovery and active goals to improve matches." />
                  ) : (
                    <>
                      <div className="rounded-2xl border border-amber-400/15 bg-amber-400/6 p-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-amber-100">Create AI group challenge</p>
                            <p className="mt-0.5 text-xs text-amber-100/60">
                              Select 2+ buddies. AI will find a common health benefit across different goals.
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={createSharedChallenge}
                            disabled={selectedSuggestionIds.size < 2 || !!pendingAction}
                            className="bg-amber-400 text-slate-950 hover:bg-amber-300"
                          >
                            {pendingAction === 'challenge:create' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                            Create for {selectedSuggestionIds.size + 1}
                          </Button>
                        </div>
                      </div>
                      {suggestions.map((suggestion) => (
                        <PersonRow
                          key={suggestion.userId}
                          name={`${suggestion.firstName} ${suggestion.lastName || ''}`.trim()}
                          avatar={suggestion.avatar || undefined}
                          subtitle={suggestion.matchReason}
                          badge={`${Math.round(suggestion.matchScore * 100)}% match`}
                          selected={selectedSuggestionIds.has(suggestion.userId)}
                          onSelect={() => toggleSuggestionSelection(suggestion.userId)}
                          extra={(
                            <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-400">
                              {suggestion.primaryGoal && <span className="inline-flex items-center gap-1"><Target className="h-3 w-3 text-cyan-300" />{suggestion.primaryGoal}</span>}
                              {suggestion.suggestedChallenge && <span className="inline-flex items-center gap-1"><Trophy className="h-3 w-3 text-amber-300" />{suggestion.suggestedChallenge.name}</span>}
                            </div>
                          )}
                          actions={(
                            <>
                              <Button size="sm" onClick={() => sendFollowRequest(suggestion.userId, 'suggestion')} disabled={!!pendingAction} className="bg-emerald-500 text-white hover:bg-emerald-400">
                                {pendingAction === `follow:${suggestion.userId}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                                Follow
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => dismissSuggestion(suggestion.userId)} disabled={!!pendingAction} className="text-slate-400 hover:bg-white/10 hover:text-white">
                                Dismiss
                              </Button>
                            </>
                          )}
                        />
                      ))}
                    </>
                  )}
                </div>
              )}

              {tab === 'search' && (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <Input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search by name or email..."
                      className="h-11 rounded-2xl border-white/10 bg-white/4 pl-10 text-white placeholder:text-slate-500"
                    />
                  </div>
                  {searching ? (
                    <LoadingSkeleton tab="search" />
                  ) : query.trim().length < 2 ? (
                    <EmptyState icon={Search} title="Search users" description="Type at least two characters to find people." />
                  ) : searchResults.length === 0 ? (
                    <EmptyState icon={Search} title="No users found" description="Try a different name or email." />
                  ) : searchResults.map((person) => (
                    <PersonRow
                      key={person.id}
                      name={person.name}
                      avatar={person.avatar}
                      subtitle="Send a friend request to start accountability chat"
                      actions={(
                        <Button size="sm" onClick={() => sendFollowRequest(person.id, 'search')} disabled={!!pendingAction} className="bg-emerald-500 text-white hover:bg-emerald-400">
                          {pendingAction === `follow:${person.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                          Follow
                        </Button>
                      )}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function TabButton({
  active,
  count,
  onClick,
  children,
}: {
  active: boolean;
  count?: number;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-colors',
        active ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/6 hover:text-white',
      )}
    >
      {children}
      {!!count && <span className="rounded-full bg-emerald-400/15 px-1.5 py-0.5 text-[10px] text-emerald-300">{count}</span>}
    </button>
  );
}

function PersonRow({
  name,
  avatar,
  subtitle,
  badge,
  selected = false,
  onSelect,
  extra,
  actions,
}: {
  name: string;
  avatar?: string | null;
  subtitle: string;
  badge?: string;
  selected?: boolean;
  onSelect?: () => void;
  extra?: React.ReactNode;
  actions: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/6 bg-white/3 p-3.5">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onSelect}
          disabled={!onSelect}
          aria-label={onSelect ? `Select ${name}` : undefined}
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-linear-to-br from-emerald-500/20 to-cyan-500/10 text-sm font-bold text-white',
            selected ? 'border-emerald-300 ring-2 ring-emerald-400/30' : 'border-white/10',
            !onSelect && 'cursor-default',
          )}
        >
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="" className="h-full w-full object-cover" />
          ) : selected ? <Check className="h-5 w-5 text-emerald-200" /> : name.charAt(0).toUpperCase()}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-white">{name}</p>
            {badge && <span className="shrink-0 rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">{badge}</span>}
          </div>
          <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-400">{subtitle}</p>
          {extra}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-2 border-t border-white/5 pt-3">{actions}</div>
    </div>
  );
}

function CardSkeleton({ showBadge = false, showExtra = false }: { showBadge?: boolean; showExtra?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/6 bg-white/3 p-3.5">
      <div className="flex items-start gap-3">
        <Skeleton className="h-11 w-11 shrink-0 rounded-2xl bg-white/6" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-24 rounded bg-white/8" />
            {showBadge && <Skeleton className="h-4 w-16 rounded-full bg-emerald-400/10" />}
          </div>
          <Skeleton className="h-3 w-full rounded bg-white/4" />
          <Skeleton className="h-3 w-3/4 rounded bg-white/4" />
          {showExtra && (
            <div className="flex gap-2 pt-1">
              <Skeleton className="h-3 w-20 rounded bg-white/4" />
              <Skeleton className="h-3 w-24 rounded bg-white/4" />
            </div>
          )}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-2 border-t border-white/5 pt-3">
        <Skeleton className="h-8 w-20 rounded-md bg-white/6" />
        <Skeleton className="h-8 w-16 rounded-md bg-white/4" />
      </div>
    </div>
  );
}

function LoadingSkeleton({ tab }: { tab: Tab }) {
  if (tab === 'search') {
    return (
      <div className="space-y-4">
        <Skeleton className="h-11 w-full rounded-2xl bg-white/4" />
        {Array.from({ length: 3 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (tab === 'suggestions') {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full rounded-2xl bg-amber-400/6" />
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} showBadge showExtra />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <CardSkeleton key={i} showBadge />
      ))}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/6 bg-white/3">
        <Icon className="h-6 w-6 text-slate-500" />
      </div>
      <p className="text-sm font-semibold text-slate-300">{title}</p>
      <p className="mt-1 max-w-xs text-xs text-slate-500">{description}</p>
    </div>
  );
}
