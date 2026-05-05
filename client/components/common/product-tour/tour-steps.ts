import type { TourStepConfig } from "./types";

/** Current tour content version — increment to re-trigger for users who completed an older version */
export const TOUR_VERSION = 3;

/** Main tour steps shown to all users */
export const TOUR_STEPS: TourStepConfig[] = [
  {
    id: "welcome",
    type: "fullscreen",
    title: "Welcome to Balencia, {firstName}!",
    description:
      "Your AI-powered health companion is ready. In the next few minutes we will walk through your Overview, navigation, key health areas, and where to connect devices — you can skip anytime.",
    icon: "Sparkles",
    accentColor: "from-emerald-500 to-cyan-500",
    ctaPrimary: "Start Tour",
    ctaSecondary: "Skip for now",
  },
  {
    id: "overview-metrics",
    type: "spotlight",
    title: "Daily metrics at a glance",
    description:
      "Sleep, consistency, hydration, and nutrition rings summarize your day. They refresh from connected wearables and logs so you always see a single, coherent snapshot on the Dashboard tab.",
    targetSelector: '[data-tour="overview-metrics"]',
    tooltipPosition: "bottom",
    icon: "Activity",
    accentColor: "from-cyan-500 to-blue-500",
    navigateTo: "/dashboard",
  },
  {
    id: "overview-heart-rate",
    type: "spotlight",
    title: "Live vitals & detail cards",
    description:
      "Heart rate, health score, and water cards sit below your rings. Open them for trends, targets, and quick logging — the same premium layout on every visit to Overview.",
    targetSelector: '[data-tour="overview-heart-rate"]',
    tooltipPosition: "top",
    icon: "HeartPulse",
    accentColor: "from-rose-500 to-orange-500",
    navigateTo: "/dashboard",
  },
  {
    id: "dashboard-header",
    type: "spotlight",
    title: "Greeting & quick actions",
    description:
      "Your personalized greeting and date stay pinned up top. Notifications, alarms, and settings are one tap away without leaving your flow.",
    targetSelector: '[data-tour="dashboard-header"]',
    tooltipPosition: "bottom",
    icon: "LayoutDashboard",
    accentColor: "from-sky-500 to-indigo-500",
    navigateTo: "/dashboard",
  },
  {
    id: "sidebar",
    type: "spotlight",
    title: "Your command center",
    description:
      "Everything in Balencia lives here: Overview, AI Coach, workouts, wellbeing, nutrition, voice, and more. Use search (⌘K / Ctrl+K) when you know the name but not the section.",
    targetSelector: '[data-tour="sidebar"]',
    tooltipPosition: "right",
    icon: "PanelLeft",
    accentColor: "from-violet-500 to-purple-500",
    navigateTo: "/dashboard",
  },
  {
    id: "ai-coach",
    type: "spotlight",
    title: "Your AI Coach",
    description:
      "Chat or call your personal coach. It learns your patterns, adjusts plans, and answers questions in context — start any time from the sidebar.",
    targetSelector: '[data-tour="ai-coach"]',
    tooltipPosition: "right",
    icon: "Bot",
    accentColor: "from-emerald-500 to-cyan-500",
    navigateTo: "/dashboard",
  },
  {
    id: "competitions",
    type: "spotlight",
    title: "Competitions & leaderboards",
    description:
      "Challenge friends and the community with fair, level-aware scoring so progress stays motivating, not overwhelming.",
    targetSelector: '[data-tour="competitions"]',
    tooltipPosition: "right",
    icon: "Trophy",
    accentColor: "from-amber-500 to-orange-500",
    navigateTo: "/dashboard",
  },
  {
    id: "gamification",
    type: "spotlight",
    title: "Level up & earn XP",
    description:
      "Workouts, meals, and goals add XP. Keep streaks alive for bonuses and unlock achievements as you build habits.",
    targetSelector: '[data-tour="xp-widget"]',
    tooltipPosition: "left",
    icon: "Flame",
    accentColor: "from-amber-500 to-orange-500",
    navigateTo: "/dashboard",
  },
  {
    id: "integrations",
    type: "spotlight",
    title: "Connect your wearables",
    description:
      "Link Fitbit, Apple Health, Google Fit, WHOOP, Strava, and more so metrics and recovery sync automatically. We open Settings on the Integrations card for you on this step.",
    targetSelector: '[data-tour="integrations"]',
    tooltipPosition: "right",
    icon: "Link",
    accentColor: "from-purple-500 to-pink-500",
    navigateTo: "/dashboard?tab=settings",
  },
  {
    id: "chat",
    type: "spotlight",
    title: "Chat & real-time updates",
    description:
      "Message your coach and peers, see unread badges here, and keep context across voice and text — all wired to the same health profile.",
    targetSelector: '[data-tour="chat"]',
    tooltipPosition: "right",
    icon: "Users",
    accentColor: "from-indigo-500 to-purple-500",
    navigateTo: "/dashboard",
  },
  {
    id: "voice-assistant",
    type: "spotlight",
    title: "Voice Assistant",
    description:
      "Hands-free guidance: open the Voice Assistant for quick commands, coaching cues, and audio-first check-ins while you train or move through your day.",
    targetSelector: '[data-tour="voice-assistant"]',
    tooltipPosition: "right",
    icon: "Mic",
    accentColor: "from-sky-500 to-cyan-500",
    navigateTo: "/dashboard",
  },
  {
    id: "settings-nav",
    type: "spotlight",
    title: "Settings",
    description:
      "Account, privacy, notifications, and app preferences live in Settings. Tune how Balencia talks to you and what data you share.",
    targetSelector: '[data-tour="settings"]',
    tooltipPosition: "right",
    icon: "Settings",
    accentColor: "from-slate-400 to-slate-600",
    navigateTo: "/dashboard",
  },
  {
    id: "nutrition",
    type: "spotlight",
    title: "Nutrition",
    description:
      "Log meals, see macros, and align fuel with your goals. Nutrition connects to your dashboard rings and AI coaching for consistent feedback.",
    targetSelector: '[data-tour="nutrition"]',
    tooltipPosition: "right",
    icon: "Apple",
    accentColor: "from-green-500 to-emerald-600",
    navigateTo: "/dashboard",
  },
  {
    id: "workouts",
    type: "spotlight",
    title: "Workouts",
    description:
      "Plans, sessions, and AI-powered workout guidance in one place. Jump here whenever you are ready to train.",
    targetSelector: '[data-tour="workouts"]',
    tooltipPosition: "right",
    icon: "Dumbbell",
    accentColor: "from-orange-500 to-red-500",
    navigateTo: "/dashboard",
  },
  {
    id: "wellbeing",
    type: "spotlight",
    title: "Wellbeing",
    description:
      "Journal, mood, schedule, and restorative practices — the wellbeing hub supports the mental and emotional side of your health next to fitness data.",
    targetSelector: '[data-tour="wellbeing"]',
    tooltipPosition: "right",
    icon: "Leaf",
    accentColor: "from-teal-500 to-emerald-600",
    navigateTo: "/dashboard",
  },
  {
    id: "completion",
    type: "fullscreen",
    title: "You're all set, {firstName}!",
    description:
      "You have seen Overview, navigation, coach, competitions, XP, integrations, chat, voice assistant, settings, nutrition, workouts, and wellbeing. Pick any item in the sidebar to go deeper.",
    icon: "PartyPopper",
    accentColor: "from-emerald-500 via-cyan-500 to-blue-500",
    ctaPrimary: "Go to Dashboard",
  },
];

/** Reserved for future role-specific steps; empty so admins get the same tour as everyone. */
export const ADMIN_EXTRA_STEPS: TourStepConfig[] = [];
