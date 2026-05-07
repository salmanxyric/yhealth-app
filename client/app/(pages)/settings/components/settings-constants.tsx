import {
  MessageCircle,
  Brain,
  Zap,
} from "lucide-react";
import type { PrayerName, PrayerTimesConfig } from '@/src/shared/services/data-source.service';

// ============================================
// Prayer Times Constants
// ============================================

export const PRAYER_FIELDS: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'tahajjud'];

export const PRAYER_LABELS: Record<PrayerName, string> = {
  fajr: 'Fajr',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
  tahajjud: 'Tahajjud',
};

export const PRAYER_METHODS = [
  { id: 1, label: 'Karachi' },
  { id: 2, label: 'ISNA' },
  { id: 3, label: 'Muslim World League' },
  { id: 4, label: 'Umm Al-Qura' },
  { id: 5, label: 'Egyptian Authority' },
  { id: 8, label: 'Gulf Region' },
  { id: 15, label: 'Moonsighting' },
];

export const DEFAULT_PRAYER_CONFIG: PrayerTimesConfig = {
  city: 'Lahore',
  country: 'Pakistan',
  method: 1,
  school: 0,
  latitudeAdjustmentMethod: 3,
  midnightMode: 0,
  adjustment: 0,
  timezone: 'Asia/Karachi',
  includeTahajjud: true,
  reminderLeadMinutes: 10,
  offsets: {},
  manualTimes: {},
};

// ============================================
// AI Coach Constants
// ============================================

export const intensityLevels = [
  { id: "light", label: "Light" },
  { id: "moderate", label: "Balanced" },
  { id: "intensive", label: "Intensive" },
];

export const formalityOptions = [
  { id: "casual", label: "Casual", preview: "Hey! Great job today" },
  { id: "balanced", label: "Balanced", preview: "Good progress on your workout today." },
  { id: "formal", label: "Formal", preview: "Your training session results have been recorded." },
];

export const encouragementOptions = [
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" },
];

export const messageStyleOptions = [
  {
    id: "friendly",
    label: "Friendly",
    icon: <MessageCircle className="w-5 h-5" />,
    gradient: "from-green-500 to-emerald-500",
    description: "Warm and approachable tone",
  },
  {
    id: "professional",
    label: "Professional",
    icon: <Brain className="w-5 h-5" />,
    gradient: "from-blue-500 to-indigo-500",
    description: "Clear, concise communication",
  },
  {
    id: "motivational",
    label: "Motivational",
    icon: <Zap className="w-5 h-5" />,
    gradient: "from-sky-500 to-emerald-600",
    description: "High-energy and inspiring",
  },
];

export const availableFocusAreas = [
  "Weight Loss",
  "Muscle Building",
  "Endurance",
  "Flexibility",
  "Nutrition",
  "Sleep Quality",
  "Stress Management",
  "Mental Health",
  "Recovery",
  "General Wellness",
];

// ============================================
// Other Constants
// ============================================

export const REDUCE_MOTION_STORAGE_KEY = "yhealth-reduce-motion";
