export interface Follow {
  id: string;
  requesterId: string;
  recipientId: string;
  status: string;
  chatId: string | null;
  matchReason: string | null;
  matchScore: number | null;
  requesterMessage: string | null;
  acceptedAt: string | null;
  createdAt: string;
  requesterName?: string;
  requesterAvatar?: string;
  recipientName?: string;
  recipientAvatar?: string;
}

export interface SuggestedChallenge {
  name: string;
  description: string;
  metric: string;
  durationDays: number;
}

export interface BuddySuggestion {
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
  goalOverlap: Record<string, unknown>;
  suggestedChallenge?: SuggestedChallenge | null;
}

export interface CompetitionInvitation {
  id: string;
  competitionId: string;
  inviterId: string;
  inviteeId: string;
  status: string;
  message: string | null;
  createdAt: string;
  respondedAt: string | null;
  competitionName?: string;
  inviterName?: string;
}

export interface SocialStats {
  followersCount: number;
  followingCount: number;
  mutualCount: number;
  pendingCount: number;
}
