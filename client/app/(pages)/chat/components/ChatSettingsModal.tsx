'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import api, { ApiError } from '@/lib/api-client';
import { Loader2, Shield, Palette, ExternalLink, Heart, Image as ImageIcon, Music, Play, Square, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { CHAT_WALLPAPERS } from '../constants/wallpapers';
import { useChatWallpaper } from '../hooks/useChatWallpaper';
import { useRingtone } from '@/hooks/use-ringtone';

type TabId = 'general' | 'privacy';

type HealthVisibility = 'disabled' | 'friends' | 'all' | 'custom';

interface ApiPrivacy {
  shareProgressWithCoach: boolean;
  allowAnonymousDataForResearch: boolean;
  showInLeaderboards?: boolean;
  profileVisibility?: string;
  healthProfileVisibility?: HealthVisibility;
  healthProfileAllowedUsers?: string[];
}

interface ApiDisplay {
  theme: string;
}

interface ChatSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: TabId;
}

export function ChatSettingsModal({ open, onOpenChange, initialTab = 'general' }: ChatSettingsModalProps) {
  const { toast } = useToast();
  /** useToast() returns a new `toast` fn every render — never put it in useCallback deps or fetch loops. */
  const toastRef = useRef(toast);
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);
  const router = useRouter();
  const [tab, setTab] = useState<TabId>(initialTab);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const { id: wallpaperId, setWallpaper } = useChatWallpaper();
  const ringtone = useRingtone();
  const [previewingRingtone, setPreviewingRingtone] = useState<string | null>(null);
  const ringtoneTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('dark');
  const [shareProgress, setShareProgress] = useState(true);
  const [anonymousAnalytics, setAnonymousAnalytics] = useState(false);
  const [healthVisibility, setHealthVisibility] = useState<HealthVisibility>('friends');
  const [healthAllowedUsers, setHealthAllowedUsers] = useState<string[]>([]);

  useEffect(() => {
    if (open) setTab(initialTab);
    if (!open) {
      ringtone.stop();
      setPreviewingRingtone(null);
      if (ringtoneTimeoutRef.current) clearTimeout(ringtoneTimeoutRef.current);
    }
  }, [open, initialTab, ringtone]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ preferences: { privacy: ApiPrivacy; display: ApiDisplay } }>('/preferences');
      if (!res.success || !res.data?.preferences) throw new Error('Failed to load preferences');
      const { privacy, display } = res.data.preferences;
      setShareProgress(privacy.shareProgressWithCoach ?? true);
      setAnonymousAnalytics(privacy.allowAnonymousDataForResearch ?? false);
      setHealthVisibility(privacy.healthProfileVisibility || 'friends');
      setHealthAllowedUsers(privacy.healthProfileAllowedUsers || []);
      const t = display?.theme as 'light' | 'dark' | 'system';
      setTheme(['light', 'dark', 'system'].includes(t) ? t : 'dark');
    } catch (e) {
      toastRef.current({
        title: 'Could not load settings',
        description: e instanceof ApiError ? e.message : 'Try again later',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    void load();
  }, [open, load]);

  const patchPrivacy = async (body: Record<string, unknown>) => {
    setSaving(true);
    try {
      const res = await api.patch('/preferences/privacy', body);
      if (!res.success) throw new Error(res.error?.message || 'Save failed');
      toast({ title: 'Saved', variant: 'default' });
    } catch (e) {
      toast({
        title: 'Save failed',
        description: e instanceof ApiError ? e.message : 'Unknown error',
        variant: 'destructive',
      });
      await load();
    } finally {
      setSaving(false);
    }
  };

  const patchDisplay = async (nextTheme: 'light' | 'dark' | 'system') => {
    setSaving(true);
    try {
      const res = await api.patch('/preferences/display', { theme: nextTheme });
      if (!res.success) throw new Error(res.error?.message || 'Save failed');
      setTheme(nextTheme);
      toast({ title: 'Theme updated', variant: 'default' });
      try {
        if (nextTheme === 'dark') document.documentElement.classList.add('dark');
        else if (nextTheme === 'light') document.documentElement.classList.remove('dark');
        else {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          document.documentElement.classList.toggle('dark', prefersDark);
        }
      } catch {
        /* ignore */
      }
    } catch (e) {
      toast({
        title: 'Save failed',
        description: e instanceof ApiError ? e.message : 'Unknown error',
        variant: 'destructive',
      });
      await load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col gap-0 p-0 bg-[#0c0e18] border-white/10 text-white sm:rounded-2xl">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-white/[0.06] shrink-0">
          <DialogTitle className="text-lg font-semibold tracking-tight">Settings and privacy</DialogTitle>
          <p className="text-xs text-slate-400 font-normal mt-1">
            Changes save automatically. Open the full settings page for more options.
          </p>
        </DialogHeader>

        <div className="flex border-b border-white/[0.06] shrink-0 px-2 gap-1">
          {(
            [
              { id: 'general' as const, label: 'General', icon: Palette },
              { id: 'privacy' as const, label: 'Privacy', icon: Shield },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium rounded-t-lg transition-colors',
                tab === id
                  ? 'text-emerald-400 bg-white/[0.04] border-b-2 border-emerald-500'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.02]'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500/70" />
            </div>
          ) : tab === 'general' ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-white mb-2">Appearance</p>
                <p className="text-xs text-slate-500 mb-3">Theme applies across the app.</p>
                <div className="grid grid-cols-3 gap-2">
                  {(['light', 'dark', 'system'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      disabled={saving}
                      onClick={() => patchDisplay(t)}
                      className={cn(
                        'py-2.5 px-2 rounded-xl text-xs font-medium border transition-colors capitalize',
                        theme === t
                          ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                          : 'border-white/[0.08] bg-white/[0.02] text-slate-300 hover:bg-white/[0.05]'
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ImageIcon className="h-4 w-4 text-emerald-400" />
                  <p className="text-sm font-medium text-white">Chat wallpaper</p>
                </div>
                <p className="text-xs text-slate-500 mb-3">Applies to the chat background on this device.</p>
                <div className="grid grid-cols-3 gap-2">
                  {CHAT_WALLPAPERS.map((w) => {
                    const selected = wallpaperId === w.id;
                    return (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => setWallpaper(w.id)}
                        aria-pressed={selected}
                        className={cn(
                          'group relative aspect-[3/4] rounded-xl overflow-hidden border transition-all',
                          selected
                            ? 'border-emerald-400 ring-2 ring-emerald-500/40'
                            : 'border-white/10 hover:border-white/25'
                        )}
                      >
                        {w.preview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={w.preview} alt={w.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                            <span className="text-[10px] text-slate-400 uppercase tracking-wide">Doodle</span>
                          </div>
                        )}
                        <span className="absolute bottom-1 left-1 right-1 text-[10px] text-white/90 bg-black/50 rounded px-1 py-0.5 text-center truncate">
                          {w.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Music className="h-4 w-4 text-fuchsia-400" />
                  <p className="text-sm font-medium text-white">Call ringtone</p>
                </div>
                <p className="text-xs text-slate-500 mb-3">Plays when receiving or placing a call.</p>
                <div className="space-y-1.5">
                  {ringtone.ringtones.map((tone) => {
                    const isSelected = ringtone.selectedRingtone === tone.id;
                    const isPlaying = previewingRingtone === tone.id;
                    return (
                      <button
                        key={tone.id}
                        type="button"
                        onClick={() => {
                          ringtone.select(tone.id);
                          toast({ title: 'Ringtone updated', variant: 'default' });
                        }}
                        className={cn(
                          'w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all',
                          isSelected
                            ? 'border-fuchsia-500/40 bg-fuchsia-500/10'
                            : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
                        )}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (ringtoneTimeoutRef.current) clearTimeout(ringtoneTimeoutRef.current);
                            if (isPlaying) {
                              ringtone.stop();
                              setPreviewingRingtone(null);
                              return;
                            }
                            ringtone.preview(tone.id);
                            setPreviewingRingtone(tone.id);
                            ringtoneTimeoutRef.current = setTimeout(() => setPreviewingRingtone(null), 4000);
                          }}
                          className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                            isPlaying
                              ? 'bg-fuchsia-500/20 border border-fuchsia-500/40'
                              : 'bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.1]'
                          )}
                          aria-label={isPlaying ? `Stop ${tone.label}` : `Preview ${tone.label}`}
                        >
                          {isPlaying ? (
                            <Square className="w-3 h-3 text-fuchsia-300 fill-current" />
                          ) : (
                            <Play className="w-3 h-3 text-slate-300 ml-0.5" />
                          )}
                        </button>
                        <span className="flex-1 text-sm font-medium text-white">{tone.label}</span>
                        <div
                          className={cn(
                            'w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors',
                            isSelected ? 'border-fuchsia-400 bg-fuchsia-400' : 'border-slate-600'
                          )}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 text-black" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full border-white/10 text-slate-300 hover:text-white hover:bg-white/5"
                onClick={() => {
                  onOpenChange(false);
                  router.push('/settings');
                }}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open full settings
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">Share progress with coach</p>
                  <p className="text-xs text-slate-500 mt-0.5">Allow your AI coach to see detailed progress</p>
                </div>
                <Switch
                  checked={shareProgress}
                  disabled={saving}
                  onCheckedChange={(checked) => {
                    setShareProgress(checked);
                    void patchPrivacy({ shareProgressWithCoach: checked });
                  }}
                />
              </div>

              <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">Anonymous analytics</p>
                  <p className="text-xs text-slate-500 mt-0.5">Help improve the product with anonymous usage data</p>
                </div>
                <Switch
                  checked={anonymousAnalytics}
                  disabled={saving}
                  onCheckedChange={(checked) => {
                    setAnonymousAnalytics(checked);
                    void patchPrivacy({ allowAnonymousDataForResearch: checked });
                  }}
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="h-4 w-4 text-emerald-400" />
                  <p className="text-sm font-medium text-white">Health profile visibility</p>
                </div>
                <p className="text-xs text-slate-500 mb-3">
                  Who can view your health data from your profile in chat.
                </p>
                <div className="space-y-2">
                  {(
                    [
                      { id: 'disabled' as const, label: 'Nobody', desc: 'Hidden from everyone' },
                      { id: 'friends' as const, label: 'Friends only', desc: 'Accepted connections only' },
                      { id: 'all' as const, label: 'Everyone in chat', desc: 'Anyone you share a chat with' },
                      { id: 'custom' as const, label: 'Custom list', desc: 'Only users you allow' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={saving}
                      onClick={() => {
                        setHealthVisibility(opt.id);
                        void patchPrivacy({ healthProfileVisibility: opt.id, healthProfileAllowedUsers: healthAllowedUsers });
                      }}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors',
                        healthVisibility === opt.id
                          ? 'border-emerald-500/40 bg-emerald-500/10'
                          : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
                      )}
                    >
                      <div
                        className={cn(
                          'w-3.5 h-3.5 rounded-full border-2 shrink-0 flex items-center justify-center',
                          healthVisibility === opt.id ? 'border-emerald-400' : 'border-slate-600'
                        )}
                      >
                        {healthVisibility === opt.id && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{opt.label}</p>
                        <p className="text-xs text-slate-500">{opt.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
                {healthVisibility === 'custom' && (
                  <p className="text-xs text-slate-500 mt-2 p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                    Manage the allowed list from the full settings page under Privacy.
                  </p>
                )}
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full border-white/10 text-slate-300 hover:text-white hover:bg-white/5"
                onClick={() => {
                  onOpenChange(false);
                  router.push('/settings?section=privacy');
                }}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                More privacy options
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
