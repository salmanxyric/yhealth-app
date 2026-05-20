// server/shared/types/domain/turn-insights.ts
import type {
  IntelligenceCategory,
  MemoryType,
  IntelligenceMemory,
  CoreSection,
} from './intelligence-files.js';
import type { EmotionalContext } from './emotional-intelligence.js';

export interface ExtractedMood {
  state: string;
  intensity: number;
  triggers?: string[];
}

export interface ExtractedEntities {
  goals?: string[];
  habits?: string[];
  preferences?: string[];
  issues?: string[];
}

export interface BehavioralSignals {
  pattern?: string;
  sentiment_trend?: 'improving' | 'stable' | 'declining';
  commitment_level?: 'high' | 'medium' | 'low';
}

export interface MemoryCandidate {
  title: string;
  description: string;
  category: IntelligenceCategory;
  memoryType: MemoryType;
  confidence: number;
  dedup_action?: 'reinforce' | 'supersede';
  existing_memory_id?: string;
}

export interface CoreProfileUpdate {
  section: CoreSection;
  key: string;
  value: unknown;
  unit?: string;
  source: string;
}

export interface TurnInsights {
  mood: ExtractedMood | null;
  intent: string;
  entities: ExtractedEntities;
  behavioral_signals: BehavioralSignals | null;
  memory_candidates: MemoryCandidate[];
  core_profile_updates: CoreProfileUpdate[];
  emotional_context?: EmotionalContext;
}

export interface SemanticInsight {
  content: string;
  similarity: number;
  createdAt: string;
  sourceType: string;
}

export interface IntelligenceContext {
  structuredMemories: IntelligenceMemory[];
  semanticInsights: SemanticInsight[];
}

export interface ExtractAndPersistParams {
  userId: string;
  userMessage: string;
  coachResponse: string;
  conversationId: string;
  toolCalls?: Array<{ tool: string; result: string }>;
}
