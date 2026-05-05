export type GoalCategory = string;
export type ConversationPhase = string;
export type SupportedLanguage = 'en' | 'ur';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ConversationContext {
  messages?: ChatMessage[];
  phase?: ConversationPhase;
  userId?: string;
  goal?: GoalCategory;
  messageCount?: number;
  extractedInsights?: ExtractedInsight[];
  userProfile?: { name: string };
  language?: SupportedLanguage;
  isOnboarding?: boolean;
}

export interface ExtractedInsight {
  category: string;
  text: string;
  confidence: number;
}

export interface AICoachResponse {
  message: string;
  phase: ConversationPhase;
  insights: ExtractedInsight[];
  isComplete: boolean;
  suggestedActions?: string[];
}

export interface AICoachSession {
  id: string;
  userId: string;
  goalCategory: GoalCategory;
  sessionType: string;
  messages: ChatMessage[];
  extractedInsights: ExtractedInsight[];
  conversationPhase: ConversationPhase;
  messageCount: number;
  userMessageCount: number;
  isComplete: boolean;
  sessionSummary?: string;
  keyTakeaways?: string[];
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}
