export interface Milestone {
  id: string;
  title: string;
  targetValue: number;
  completed: boolean;
  completedAt?: string;
  weekNumber: number;
}

export interface Goal {
  id: string;
  category: string;
  pillar: string;
  title: string;
  description: string;
  targetValue: number;
  targetUnit: string;
  currentValue: number;
  startDate: string;
  targetDate: string;
  durationWeeks: number;
  status: string;
  isPrimary: boolean;
  progress: number;
  motivation?: string;
  confidenceLevel?: number;
  milestones?: Milestone[];
}

export interface Plan {
  id: string;
  name: string;
  goalId: string;
  status: string;
  overallProgress: number;
  currentWeek: number;
  durationWeeks: number;
}

export interface NewGoalData {
  category: string;
  pillar: string;
  title: string;
  description: string;
  targetValue: number;
  targetUnit: string;
  currentValue: number;
  durationWeeks: number;
  motivation: string;
  isPrimary: boolean;
}
