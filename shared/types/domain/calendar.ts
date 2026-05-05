/**
 * @file Calendar domain types — shared between server and client
 */

export interface CalendarConnection {
  id: string;
  userId: string;
  provider: string;
  tokenExpiresAt: string;
  calendarIds: string[];
  syncEnabled: boolean;
  lastSyncAt: string | null;
  syncStatus: string;
  syncError: string | null;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  userId: string;
  connectionId: string;
  externalId: string;
  calendarId: string | null;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  allDay: boolean;
  location: string | null;
  status: string;
  busyStatus: string;
}

export interface GoogleCalendarInfo {
  id: string;
  summary: string;
  primary: boolean;
}

export type StressLevel = 'low' | 'medium' | 'high' | 'critical';

export interface FreeWindow {
  startTime: string;
  endTime: string;
  durationMinutes: number;
}

export interface TimeBlock {
  startTime: string;
  endTime: string;
  durationMinutes: number;
  title: string;
  category?: string;
  source: 'manual' | 'workout' | 'google_calendar';
}

export interface Holiday {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  type: 'religious' | 'national' | 'cultural' | 'personal';
  region: string;
  affectsFitness: boolean;
  affectsNutrition: boolean;
}

export interface HolidayContext {
  activeHolidays: Holiday[];
  upcomingHolidays: Holiday[];
  isFastingPeriod: boolean;
  fastingName: string | null;
  suggestedAdjustments: string[];
}

export interface DayContext {
  date: string;
  totalItems: number;
  timeBlocks: TimeBlock[];
  freeWindows: FreeWindow[];
  busyHours: number;
  freeHours: number;
  stressLevel: StressLevel;
  hasEarlyMorning: boolean;
  hasLateNight: boolean;
  longestFreeWindow: FreeWindow | null;
  longestBusyStreak: number;
  backToBackCount: number;
  categories: Record<string, number>;
  holidayContext?: HolidayContext;
}

export interface UserHolidayPrefs {
  region: string;
  religiousCalendar: string | null;
  customHolidays: Array<{ name: string; date: string }>;
}
