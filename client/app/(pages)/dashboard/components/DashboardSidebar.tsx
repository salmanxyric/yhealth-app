"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Target,
  Settings,
  Sliders,
  Activity,
  Trophy,
  User,
  Bell,
  MessageSquare,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Heart,
  Dumbbell,
  Utensils,
  Bot,
  Mic,
  Calendar,
  Phone,
  Sparkles,
  Flower2,
  Award,
  Users,
  ShieldCheck,
  Library,
} from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { cn } from "@/lib/utils";
import { useUnreadCount } from "@/hooks/use-unread-count";

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  color: string;
  badge?: string;
  unreadCount?: number;
  isExternal?: boolean;
}

const mainNavItems: NavItem[] = [
  {
    id: "overview",
    label: "Overview",
    icon: <LayoutDashboard className="w-5 h-5" />,
    href: "/dashboard",
    color: "from-blue-500 to-purple-500",
  },
  {
    id: "goals",
    label: "Goals",
    icon: <Target className="w-5 h-5" />,
    href: "/goals",
    color: "from-cyan-500 to-blue-500",
  },
];

const fitnessNavItems: NavItem[] = [
  {
    id: "workouts",
    label: "Workouts",
    icon: <Dumbbell className="w-5 h-5" />,
    href: "/workouts",
    color: "from-orange-500 to-red-500",
    badge: "AI",
  },
  {
    id: "exercises",
    label: "Exercises",
    icon: <Library className="w-5 h-5" />,
    href: "/exercises",
    color: "from-emerald-500 to-emerald-600",
    badge: "1.5K",
  },
  {
    id: "nutrition",
    label: "Nutrition",
    icon: <Utensils className="w-5 h-5" />,
    href: "/nutrition",
    color: "from-green-500 to-emerald-500",
    badge: "AI",
  },
  {
    id: "progress",
    label: "Progress",
    icon: <TrendingUp className="w-5 h-5" />,
    href: "/progress",
    color: "from-emerald-500 to-teal-500",
  },
  {
    id: "activity",
    label: "Activity",
    icon: <Activity className="w-5 h-5" />,
    href: "/activity",
    color: "from-cyan-500 to-blue-500",
  },
  {
    id: "activity-status",
    label: "Activity Status",
    icon: <Calendar className="w-5 h-5" />,
    href: "/activity-status",
    color: "from-emerald-500 to-teal-500",
  },
  {
    id: "whoop",
    label: "Whoop",
    icon: <Heart className="w-5 h-5" />,
    href: "/whoop",
    color: "from-purple-500 to-pink-500",
  },
  {
    id: "achievements",
    label: "Achievements",
    icon: <Trophy className="w-5 h-5" />,
    href: "/achievements",
    color: "from-amber-500 to-orange-500",
  },
  {
    id: "leaderboard",
    label: "Leaderboard",
    icon: <Award className="w-5 h-5" />,
    href: "/leaderboard",
    color: "from-yellow-500 to-amber-500",
  },
  {
    id: "competitions",
    label: "Competitions",
    icon: <Users className="w-5 h-5" />,
    href: "/competitions",
    color: "from-indigo-500 to-purple-500",
  },
];

const wellnessNavItems: NavItem[] = [
  {
    id: "wellbeing",
    label: "Wellbeing",
    icon: <Flower2 className="w-5 h-5" />,
    href: "/wellbeing",
    color: "from-pink-500 to-rose-500",
  },
];

const communicationNavItems: NavItem[] = [
  {
    id: "ai-coach",
    label: "AI Coach",
    icon: <Bot className="w-5 h-5" />,
    href: "/ai-coach",
    color: "from-emerald-500 to-cyan-500",
    badge: "AI",
  },
  {
    id: "chat",
    label: "Chat",
    icon: <MessageSquare className="w-5 h-5" />,
    href: "/chat",
    color: "from-indigo-500 to-purple-500",
    badge: "AI",
  },
  {
    id: "chat-history",
    label: "Chat History",
    icon: <Sparkles className="w-5 h-5" />,
    href: "/chat-history",
    color: "from-violet-500 to-fuchsia-500",
  },
  {
    id: "voice-assistant",
    label: "Voice Assistant",
    icon: <Mic className="w-5 h-5" />,
    href: "/voice-assistant",
    color: "from-rose-500 to-pink-500",
    badge: "NEW",
  },
  {
    id: "voice-call",
    label: "Call Coach",
    icon: <Phone className="w-5 h-5" />,
    href: "/voice-call",
    color: "from-blue-500 to-indigo-500",
    badge: "NEW",
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: <Bell className="w-5 h-5" />,
    href: "/notifications",
    color: "from-indigo-500 to-purple-500",
  },
];

const accountNavItems: NavItem[] = [
  {
    id: "profile",
    label: "Profile",
    icon: <User className="w-5 h-5" />,
    href: "/profile",
    color: "from-purple-500 to-pink-500",
  },
  {
    id: "preferences",
    label: "Preferences",
    icon: <Sliders className="w-5 h-5" />,
    href: "/dashboard?tab=preferences",
    color: "from-pink-500 to-rose-500",
  },
  {
    id: "settings",
    label: "Settings",
    icon: <Settings className="w-5 h-5" />,
    href: "/settings",
    color: "from-slate-500 to-slate-600",
  },
];

interface DashboardSidebarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onCollapsedChange?: (collapsed: boolean) => void;
  disabled?: boolean;
}

export function DashboardSidebar({
  activeTab,
  onTabChange,
  onCollapsedChange,
  disabled: _disabled,
}: DashboardSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { unreadCount: chatUnreadCount } = useUnreadCount();

  // Get active route based on pathname
  const getActiveId = () => {
    if (pathname === "/dashboard") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab") || "overview";
      return tab;
    }
    if (pathname.startsWith("/goals")) return "goals";
    if (pathname.startsWith("/workouts")) return "workouts";
    if (pathname.startsWith("/exercises")) return "exercises";
    if (pathname.startsWith("/nutrition")) return "nutrition";
    if (pathname.startsWith("/progress")) return "progress";
    if (pathname.startsWith("/ai-coach")) return "ai-coach";
    if (pathname.startsWith("/chat") && !pathname.startsWith("/chat-history")) return "chat";
    if (pathname.startsWith("/chat-history")) return "chat-history";
    if (pathname.startsWith("/voice-assistant")) return "voice-assistant";
    if (pathname.startsWith("/voice-call")) return "voice-call";
    // Check activity-status before activity to avoid false matches
    if (pathname.startsWith("/activity-status")) return "activity-status";
    if (pathname.startsWith("/activity")) return "activity";
    if (pathname.startsWith("/whoop")) return "whoop";
    if (pathname.startsWith("/achievements")) return "achievements";
    if (pathname.startsWith("/wellbeing")) return "wellbeing";
    if (pathname.startsWith("/notifications")) return "notifications";
    if (pathname.startsWith("/profile")) return "profile";
    if (pathname.startsWith("/settings")) return "settings";
    if (pathname.startsWith("/competitions")) return "competitions";
    if (pathname.startsWith("/leaderboard")) return "leaderboard";
    if (pathname === "/dashboard") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "wellbeing") return "wellbeing";
    }
    return null;
  };

  const activeId = activeTab || getActiveId();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleNavClick = (item: NavItem, e: React.MouseEvent) => {
    if (onTabChange && item.href.includes("?tab=")) {
      e.preventDefault();
      const tab = item.href.split("?tab=")[1];
      router.push(`/dashboard?tab=${tab}`);
      onTabChange(tab);
    }
  };

  const renderNavItem = (item: NavItem) => {
    const isActive = activeId === item.id;
    const isHovered = hoveredItem === item.id;

    return (
      <Link
        key={item.id}
        href={item.href}
        onClick={(e) => handleNavClick(item, e)}
        onMouseEnter={() => setHoveredItem(item.id)}
        onMouseLeave={() => setHoveredItem(null)}
        data-tour={item.id}
        className={cn(
          "relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm",
          "transition-all duration-200 cursor-pointer group overflow-hidden",
          isActive
            ? "text-white"
            : "text-slate-400 hover:text-white hover:bg-white/5"
        )}
      >
        {/* Active background with glow effect */}
        {isActive && (
          <motion.div
            layoutId="activeSidebarTab"
            className={cn(
              "absolute inset-0 rounded-xl bg-gradient-to-r",
              item.color,
              "shadow-lg shadow-current/20"
            )}
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}

        {/* Hover glow effect */}
        {isHovered && !isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              "absolute inset-0 rounded-xl bg-gradient-to-r opacity-20",
              item.color
            )}
          />
        )}

        {/* Icon with animation */}
        <motion.span
          className="relative z-10 flex-shrink-0"
          animate={{
            scale: isActive ? 1.1 : isHovered ? 1.05 : 1,
          }}
          transition={{ duration: 0.2 }}
        >
          {item.icon}
        </motion.span>

        {/* Label */}
        {!isCollapsed && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative z-10 truncate flex-1 text-left"
          >
            {item.label}
          </motion.span>
        )}

        {/* Badge */}
        {!isCollapsed && item.badge && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "relative z-10 px-1.5 py-0.5 text-[10px] font-bold rounded",
              item.badge === "AI"
                ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white"
                : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white",
              "shadow-sm"
            )}
          >
            {item.badge}
          </motion.span>
        )}

        {/* Unread Count Badge */}
        {item.unreadCount !== undefined && item.unreadCount > 0 && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "relative z-10 min-w-[20px] h-5 px-1.5 flex items-center justify-center text-[11px] font-bold rounded-full",
              "bg-gradient-to-r from-red-500 to-rose-500 text-white",
              "shadow-sm shadow-red-500/30",
              isCollapsed && "absolute -top-1 -right-1"
            )}
          >
            {item.unreadCount > 99 ? "99+" : item.unreadCount}
          </motion.span>
        )}

        {/* Tooltip for collapsed state */}
        {isCollapsed && (
          <div className="absolute left-full ml-2 px-3 py-2 bg-slate-900/95 backdrop-blur-xl border border-white/10 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl flex items-center gap-2">
            {item.label}
            {item.badge && (
              <span
                className={cn(
                  "px-1.5 py-0.5 text-[10px] font-bold rounded",
                  item.badge === "AI"
                    ? "bg-gradient-to-r from-violet-500 to-purple-500"
                    : "bg-gradient-to-r from-emerald-500 to-teal-500"
                )}
              >
                {item.badge}
              </span>
            )}
            {item.unreadCount !== undefined && item.unreadCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-gradient-to-r from-red-500 to-rose-500">
                {item.unreadCount > 99 ? "99+" : item.unreadCount}
              </span>
            )}
          </div>
        )}
      </Link>
    );
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed left-0 top-0 h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950/95 backdrop-blur-xl border-r border-white/10 flex flex-col z-40 shadow-2xl"
    >
      {/* Logo / Brand Section */}
      <div className={cn(
        "flex items-center border-b border-white/10 bg-gradient-to-r from-slate-900/50 to-transparent",
        isCollapsed ? "flex-col gap-2 p-3" : "justify-between p-4"
      )}>
        <Link
          href="/dashboard?tab=overview"
          className="flex items-center gap-3 group"
        >
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-cyan-500 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/30"
          >
            <Heart className="w-5 h-5 text-white" />
          </motion.div>
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  yHealth
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            const newState = !isCollapsed;
            setIsCollapsed(newState);
            onCollapsedChange?.(newState);
          }}
          className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors backdrop-blur-sm"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </motion.button>
      </div>

      {/* User Info Section */}
      <AnimatePresence>
        {!isCollapsed && user && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-3 border-b border-white/10 bg-gradient-to-r from-slate-800/50 to-transparent"
          >
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30"
              >
                <span className="text-white font-semibold text-sm">
                  {user.firstName?.[0]}
                  {user.lastName?.[0]}
                </span>
              </motion.div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-slate-400 truncate">{user.email}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {/* Main Navigation */}
        <div className="space-y-1">
          <AnimatePresence>
            {!isCollapsed && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2"
              >
                Dashboard
              </motion.p>
            )}
          </AnimatePresence>
          {mainNavItems.map(renderNavItem)}
        </div>

        {/* Fitness & Health Navigation */}
        <div className="space-y-1">
          <AnimatePresence>
            {!isCollapsed && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2"
              >
                Fitness & Health
              </motion.p>
            )}
          </AnimatePresence>
          {fitnessNavItems.map(renderNavItem)}
        </div>

        {/* Wellness Navigation */}
        <div className="space-y-1">
          <AnimatePresence>
            {!isCollapsed && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2"
              >
                Wellness
              </motion.p>
            )}
          </AnimatePresence>
          {wellnessNavItems.map(renderNavItem)}
        </div>

        {/* Communication Navigation */}
        <div className="space-y-1" data-tour="community">
          <AnimatePresence>
            {!isCollapsed && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2"
              >
                Communication
              </motion.p>
            )}
          </AnimatePresence>
          {communicationNavItems.map((item) =>
            renderNavItem(
              item.id === "chat"
                ? { ...item, unreadCount: chatUnreadCount }
                : item
            )
          )}
        </div>

        {/* Account Navigation */}
        <div className="space-y-1">
          <AnimatePresence>
            {!isCollapsed && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2"
              >
                Account
              </motion.p>
            )}
          </AnimatePresence>
          {accountNavItems.map(renderNavItem)}
        </div>

        {/* Admin Navigation (visible only to admins) */}
        {user?.role?.toLowerCase() === "admin" && (
          <div className="space-y-1">
            <AnimatePresence>
              {!isCollapsed && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2"
                >
                  Admin
                </motion.p>
              )}
            </AnimatePresence>
            {renderNavItem({
              id: "admin-panel",
              label: "Admin Panel",
              icon: <ShieldCheck className="w-5 h-5" />,
              href: "/admin",
              color: "from-red-500 to-pink-500",
            })}
          </div>
        )}
      </nav>

      {/* Sign Out Button */}
      <div className="p-3 border-t border-white/10 bg-gradient-to-r from-slate-900/50 to-transparent">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer group relative overflow-hidden"
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-red-500/0 to-red-500/0 group-hover:from-red-500/10 group-hover:to-red-500/5 rounded-xl transition-all"
          />
          <LogOut className="w-5 h-5 flex-shrink-0 relative z-10" />
          {!isCollapsed && <span className="relative z-10">Sign Out</span>}
        </motion.button>
      </div>
    </motion.aside>
  );
}

// Mobile Bottom Navigation
const mobileNavItems: NavItem[] = [
  {
    id: "overview",
    label: "Home",
    icon: <LayoutDashboard className="w-5 h-5" />,
    href: "/dashboard",
    color: "from-blue-500 to-purple-500",
  },
  {
    id: "workouts",
    label: "Workouts",
    icon: <Dumbbell className="w-5 h-5" />,
    href: "/workouts",
    color: "from-orange-500 to-red-500",
  },
  {
    id: "nutrition",
    label: "Nutrition",
    icon: <Utensils className="w-5 h-5" />,
    href: "/nutrition",
    color: "from-green-500 to-emerald-500",
  },
  {
    id: "progress",
    label: "Progress",
    icon: <TrendingUp className="w-5 h-5" />,
    href: "/progress",
    color: "from-emerald-500 to-teal-500",
  },
  {
    id: "profile",
    label: "Profile",
    icon: <User className="w-5 h-5" />,
    href: "/profile",
    color: "from-purple-500 to-pink-500",
  },
];

export function MobileBottomNav({
  activeTab,
  onTabChange,
  disabled: _disabled,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const getActiveId = () => {
    if (pathname === "/dashboard") {
      const params = new URLSearchParams(window.location.search);
      return params.get("tab") || "overview";
    }
    if (pathname.startsWith("/goals")) return "goals";
    if (pathname.startsWith("/workouts")) return "workouts";
    if (pathname.startsWith("/exercises")) return "exercises";
    if (pathname.startsWith("/nutrition")) return "nutrition";
    if (pathname.startsWith("/progress")) return "progress";
    if (pathname.startsWith("/activity")) return "activity";
    if (pathname.startsWith("/achievements")) return "achievements";
    if (pathname.startsWith("/leaderboard")) return "leaderboard";
    if (pathname.startsWith("/profile")) return "profile";
    return null;
  };

  const activeId = activeTab || getActiveId();

  const handleNavClick = (item: NavItem, e: React.MouseEvent) => {
    if (onTabChange && item.href.includes("?tab=")) {
      e.preventDefault();
      const tab = item.href.split("?tab=")[1];
      router.push(`/dashboard?tab=${tab}`);
      onTabChange(tab);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-white/10 z-40 md:hidden pb-safe shadow-2xl">
      <div className="flex items-center justify-around py-2 px-1">
        {mobileNavItems.map((item) => {
          const isActive = activeId === item.id;
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={(e) => handleNavClick(item, e)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 min-w-15 py-2 px-2 rounded-xl transition-all relative",
                isActive
                  ? `bg-gradient-to-r ${item.color} text-white shadow-lg`
                  : "text-slate-400 hover:text-slate-300"
              )}
            >
              <motion.span
                className="w-5 h-5"
                animate={{ scale: isActive ? 1.1 : 1 }}
                transition={{ duration: 0.2 }}
              >
                {item.icon}
              </motion.span>
              <span className="text-[10px] font-medium leading-tight whitespace-nowrap">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
