// Activity Status Types

export type ActivityStatus = 'working' | 'sick' | 'injury' | 'rest' | 'vacation' | 'travel' | 'stress' | 'excellent' | 'good' | 'fair' | 'poor';

export interface ActivityStatusHistory {
  id: string;
  user_id: string;
  status_date: Date;
  activity_status: ActivityStatus;
  mood?: number;
  notes?: string;
  source: string;
  created_at: Date;
  updated_at: Date;
}

export interface ActivityStatusConfig {
  status: ActivityStatus;
  color: string;
  icon: string;
  mood: number; // Default mood for this status
  description: string;
}

export interface CurrentStatusResponse {
  status: ActivityStatus;
  updatedAt?: Date;
}

export interface SetStatusRequest {
  date: string; // ISO date string
  status: ActivityStatus;
  mood?: number;
  notes?: string;
}

export interface CalendarDayStatus {
  date: string; // ISO date string
  status?: ActivityStatus;
  mood?: number;
  notes?: string;
}

export interface CalendarMonthResponse {
  year: number;
  month: number;
  days: CalendarDayStatus[];
}

export interface StatusHistoryResponse {
  statuses: ActivityStatusHistory[];
  total: number;
}

export interface StatusStats {
  totalDays: number;
  statusDistribution: Record<ActivityStatus, number>;
  averageMood?: number;
  mostCommonStatus: ActivityStatus;
  streakDays: number;
}

