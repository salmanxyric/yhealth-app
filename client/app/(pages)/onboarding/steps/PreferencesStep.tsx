"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import {
  MessageCircle,
  Bell,
  Clock,
  Sparkles,
  Zap,
  Target,
  BarChart2,
  Flame,
  Moon,
  Sun,
} from "lucide-react";
import { useOnboarding } from "@/src/features/onboarding/context/OnboardingContext";
import type { Preferences } from "@/src/types";
import { StepNavigation } from "../components/StepNavigation";

interface StyleOption {
  id: Preferences["coachingStyle"];
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

interface IntensityOption {
  id: Preferences["coachingIntensity"];
  title: string;
  description: string;
  checkIns: string;
}

const coachingStyles: StyleOption[] = [
  {
    id: "supportive",
    icon: <Sparkles className="w-6 h-6" />,
    title: "Supportive",
    description: "Empathetic, encouraging, celebrates your wins",
    color: "text-pink-400",
  },
  {
    id: "direct",
    icon: <Target className="w-6 h-6" />,
    title: "Direct",
    description: "Clear feedback, firm expectations, keeps you accountable",
    color: "text-blue-400",
  },
  {
    id: "analytical",
    icon: <BarChart2 className="w-6 h-6" />,
    title: "Analytical",
    description: "Data-driven, focuses on metrics and evidence",
    color: "text-cyan-400",
  },
  {
    id: "motivational",
    icon: <Flame className="w-6 h-6" />,
    title: "Motivational",
    description: "Energetic, inspiring, pushes you to go further",
    color: "text-orange-400",
  },
];

const intensityLevels: IntensityOption[] = [
  {
    id: "light",
    title: "Light Touch",
    description: "Weekly check-ins with occasional reminders",
    checkIns: "2-3x/week",
  },
  {
    id: "moderate",
    title: "Balanced",
    description: "Daily nudges with flexibility",
    checkIns: "5-7x/week",
  },
  {
    id: "intensive",
    title: "High Engagement",
    description: "Frequent check-ins and detailed tracking",
    checkIns: "10-14x/week",
  },
];

const channelOptions = [
  { id: "push", label: "Push Notifications", icon: <Bell className="w-5 h-5" /> },
  { id: "email", label: "Email", icon: <MessageCircle className="w-5 h-5" /> },
  { id: "whatsapp", label: "WhatsApp", icon: <MessageCircle className="w-5 h-5" /> },
  { id: "sms", label: "SMS", icon: <MessageCircle className="w-5 h-5" /> },
];

export function PreferencesStep() {
  const { preferences, updatePreferences, nextStep, prevStep } = useOnboarding();

  const [quietHoursEnabled, setQuietHoursEnabled] = useState(
    preferences.quietHours.enabled
  );

  const handleStyleSelect = (style: Preferences["coachingStyle"]) => {
    updatePreferences({ coachingStyle: style });
  };

  const handleIntensitySelect = (intensity: Preferences["coachingIntensity"]) => {
    updatePreferences({ coachingIntensity: intensity });
  };

  const handleChannelSelect = (channel: Preferences["preferredChannel"]) => {
    updatePreferences({ preferredChannel: channel });
  };

  const handleQuietHoursToggle = () => {
    const newValue = !quietHoursEnabled;
    setQuietHoursEnabled(newValue);
    updatePreferences({
      quietHours: { ...preferences.quietHours, enabled: newValue },
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        className="text-center mb-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <motion.div
          className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
        >
          <MessageCircle className="w-8 h-8 text-purple-400" />
        </motion.div>

        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Personalize Your{" "}
          <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Experience
          </span>
        </h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto">
          Customize how your AI coach communicates with you for the best
          experience.
        </p>
      </motion.div>

      {/* Coaching Style */}
      <motion.section
        className="mb-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          Coaching Style
        </h2>

        <div className="grid grid-cols-2 gap-3">
          {coachingStyles.map((style) => {
            const isSelected = preferences.coachingStyle === style.id;

            return (
              <motion.button
                key={style.id}
                onClick={() => handleStyleSelect(style.id)}
                className={`
                  p-4 rounded-xl text-left transition-all duration-300 border
                  ${
                    isSelected
                      ? "bg-purple-500/15 border-purple-500/40"
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  }
                `}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className={`mb-2 ${style.color}`}>{style.icon}</div>
                <h3
                  className={`font-semibold mb-1 ${isSelected ? "text-white" : "text-slate-300"}`}
                >
                  {style.title}
                </h3>
                <p className="text-xs text-slate-400">{style.description}</p>
              </motion.button>
            );
          })}
        </div>
      </motion.section>

      {/* Coaching Intensity */}
      <motion.section
        className="mb-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          Engagement Level
        </h2>

        <div className="space-y-3">
          {intensityLevels.map((level) => {
            const isSelected = preferences.coachingIntensity === level.id;

            return (
              <motion.button
                key={level.id}
                onClick={() => handleIntensitySelect(level.id)}
                className={`
                  w-full p-4 rounded-xl text-left transition-all duration-300 border
                  flex items-center justify-between
                  ${
                    isSelected
                      ? "bg-yellow-500/15 border-yellow-500/40"
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  }
                `}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <div>
                  <h3
                    className={`font-semibold mb-1 ${isSelected ? "text-white" : "text-slate-300"}`}
                  >
                    {level.title}
                  </h3>
                  <p className="text-sm text-slate-400">{level.description}</p>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    isSelected
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-white/10 text-slate-400"
                  }`}
                >
                  {level.checkIns}
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.section>

      {/* Preferred Channel */}
      <motion.section
        className="mb-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-blue-400" />
          Preferred Channel
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {channelOptions.map((channel) => {
            const isSelected = preferences.preferredChannel === channel.id;

            return (
              <motion.button
                key={channel.id}
                onClick={() =>
                  handleChannelSelect(channel.id as Preferences["preferredChannel"])
                }
                className={`
                  p-4 rounded-xl flex flex-col items-center gap-2 transition-all duration-300 border
                  ${
                    isSelected
                      ? "bg-blue-500/15 border-blue-500/40"
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  }
                `}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className={isSelected ? "text-blue-400" : "text-slate-400"}>
                  {channel.icon}
                </div>
                <span
                  className={`text-sm font-medium ${isSelected ? "text-white" : "text-slate-400"}`}
                >
                  {channel.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </motion.section>

      {/* Quiet Hours */}
      <motion.section
        className="mb-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Moon className="w-5 h-5 text-indigo-400" />
            Quiet Hours
          </h2>
          <button
            onClick={handleQuietHoursToggle}
            className={`
              relative w-12 h-6 rounded-full transition-colors duration-300
              ${quietHoursEnabled ? "bg-indigo-500" : "bg-slate-700"}
            `}
          >
            <motion.div
              className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-lg"
              animate={{ left: quietHoursEnabled ? "calc(100% - 20px)" : "4px" }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            />
          </button>
        </div>

        {quietHoursEnabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="p-4 rounded-xl bg-white/5 border border-white/10"
          >
            <p className="text-sm text-slate-400 mb-4">
              No notifications during these hours
            </p>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-xs text-slate-500 mb-1 block">From</label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                  <Moon className="w-4 h-4 text-indigo-400" />
                  <input
                    type="time"
                    value={preferences.quietHours.start}
                    onChange={(e) =>
                      updatePreferences({
                        quietHours: {
                          ...preferences.quietHours,
                          start: e.target.value,
                        },
                      })
                    }
                    className="bg-transparent text-white border-none outline-none"
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="text-xs text-slate-500 mb-1 block">To</label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                  <Sun className="w-4 h-4 text-yellow-400" />
                  <input
                    type="time"
                    value={preferences.quietHours.end}
                    onChange={(e) =>
                      updatePreferences({
                        quietHours: {
                          ...preferences.quietHours,
                          end: e.target.value,
                        },
                      })
                    }
                    className="bg-transparent text-white border-none outline-none"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.section>

      {/* Check-in Time */}
      <motion.section
        className="mb-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-emerald-400" />
          Preferred Check-in Time
        </h2>

        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-4">
            <input
              type="time"
              value={preferences.preferredCheckInTime}
              onChange={(e) =>
                updatePreferences({ preferredCheckInTime: e.target.value })
              }
              className="flex-1 px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white text-lg"
            />
            <span className="text-slate-400 text-sm">
              {Intl.DateTimeFormat().resolvedOptions().timeZone}
            </span>
          </div>
        </div>
      </motion.section>

      {/* Navigation */}
      <StepNavigation
        onBack={prevStep}
        onNext={nextStep}
        nextLabel="Generate My Plan"
      />
    </div>
  );
}
