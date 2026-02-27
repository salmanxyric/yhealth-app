"use client";

import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Target,
  Settings,
  Sliders,
  Activity,
  Trophy,
  User,
  Bell,
  ClipboardList,
  MessageSquare,
  TrendingUp,
  Heart,
} from "lucide-react";

export type TabId = "overview" | "goals" | "plans" | "progress" | "activity" | "achievements" | "notifications" | "chat-history" | "preferences" | "settings" | "profile" | "wellbeing";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const tabs: Tab[] = [
  {
    id: "overview",
    label: "Overview",
    icon: <LayoutDashboard className="w-4 h-4" />,
    color: "from-blue-500 to-purple-500",
  },
  {
    id: "goals",
    label: "Goals",
    icon: <Target className="w-4 h-4" />,
    color: "from-cyan-500 to-blue-500",
  },
  {
    id: "plans",
    label: "Plans",
    icon: <ClipboardList className="w-4 h-4" />,
    color: "from-violet-500 to-purple-500",
  },
  {
    id: "progress",
    label: "Progress",
    icon: <TrendingUp className="w-4 h-4" />,
    color: "from-emerald-500 to-teal-500",
  },
  {
    id: "activity",
    label: "Activity",
    icon: <Activity className="w-4 h-4" />,
    color: "from-green-500 to-emerald-500",
  },
  {
    id: "achievements",
    label: "Achievements",
    icon: <Trophy className="w-4 h-4" />,
    color: "from-amber-500 to-orange-500",
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: <Bell className="w-4 h-4" />,
    color: "from-indigo-500 to-purple-500",
  },
  {
    id: "chat-history",
    label: "Chat History",
    icon: <MessageSquare className="w-4 h-4" />,
    color: "from-violet-500 to-fuchsia-500",
  },
  {
    id: "profile",
    label: "Profile",
    icon: <User className="w-4 h-4" />,
    color: "from-purple-500 to-pink-500",
  },
  {
    id: "preferences",
    label: "Preferences",
    icon: <Sliders className="w-4 h-4" />,
    color: "from-pink-500 to-rose-500",
  },
  {
    id: "settings",
    label: "Settings",
    icon: <Settings className="w-4 h-4" />,
    color: "from-slate-500 to-slate-600",
  },
  {
    id: "wellbeing",
    label: "Wellbeing",
    icon: <Heart className="w-4 h-4" />,
    color: "from-pink-500 to-rose-500",
  },
];

interface DashboardTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function DashboardTabs({ activeTab, onTabChange }: DashboardTabsProps) {
  return (
    <div className="mb-8">
      {/* Desktop Tabs */}
      <div className="hidden md:flex items-center gap-1 p-1.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              data-tab={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm
                transition-all duration-200 whitespace-nowrap cursor-pointer
                ${isActive
                  ? "text-white"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
                }
              `}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className={`absolute inset-0 rounded-xl bg-gradient-to-r ${tab.color}`}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">{tab.icon}</span>
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Mobile Tabs - Scrollable */}
      <div className="md:hidden">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm
                  transition-all duration-200 whitespace-nowrap flex-shrink-0
                  ${isActive
                    ? `bg-gradient-to-r ${tab.color} text-white`
                    : "bg-white/5 text-slate-400 border border-white/10"
                  }
                `}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
