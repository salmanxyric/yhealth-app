import { logger } from './logger.service.js';
import { memoryEngineService } from './memory-engine.service.js';
import { conversationInsightExtractorService } from './conversation-insight-extractor.service.js';
import {
  NEUTRAL_EMOTIONAL_CONTEXT,
  type EmotionalContext,
  type EIAnalysisInput,
  type BehavioralPattern,
} from '@shared/types/domain/emotional-intelligence.js';

const MIN_MESSAGE_LENGTH = 8;
const EI_TIMEOUT_MS = 4000;

class EmotionalIntelligenceService {
  async analyze(input: EIAnalysisInput): Promise<EmotionalContext> {
    const { userId, message, conversationHistory } = input;

    if (message.length < MIN_MESSAGE_LENGTH) {
      return { ...NEUTRAL_EMOTIONAL_CONTEXT };
    }

    try {
      const [extractionResult, existingPatterns] = await Promise.all([
        this.extractWithTimeout(message, conversationHistory),
        this.fetchExistingPatterns(userId, input.existingPatterns),
      ]);

      if (!extractionResult?.emotional_context) {
        return { ...NEUTRAL_EMOTIONAL_CONTEXT };
      }

      const eiContext = extractionResult.emotional_context;

      const mergedPatterns = this.mergePatterns(
        eiContext.behavioralPatterns || [],
        existingPatterns,
      );

      const enriched: EmotionalContext = {
        ...eiContext,
        behavioralPatterns: mergedPatterns,
        isSelfSabotaging: eiContext.isSelfSabotaging ||
          mergedPatterns.some(p => p.type === 'self_sabotage_loop' && p.frequency >= 3),
        sleepQuality: input.sleepQuality ?? eiContext.sleepQuality,
        recentStressLevel: input.recentStressLevel ?? eiContext.recentStressLevel,
      };

      if (input.recentMoodLogs && input.recentMoodLogs.length >= 2) {
        enriched.moodTrajectory = this.computeMoodTrajectory(input.recentMoodLogs);
      }

      if (conversationHistory.length >= 4) {
        enriched.responseComplexity = this.detectResponseComplexity(
          message,
          conversationHistory,
        );
        if (enriched.responseComplexity === 'shrinking' && enriched.engagementLevel !== 'withdrawing') {
          enriched.engagementLevel = 'low';
        }
      }

      return enriched;
    } catch (error) {
      logger.warn('[EI] Analysis failed, returning neutral context', {
        error: error instanceof Error ? error.message : 'Unknown',
        userId,
      });
      return { ...NEUTRAL_EMOTIONAL_CONTEXT };
    }
  }

  private async extractWithTimeout(
    message: string,
    conversationHistory: Array<{ role: string; content: string }>,
  ) {
    const lastCoachMessage = conversationHistory
      .filter(m => m.role === 'assistant')
      .pop()?.content || '';

    const result = await Promise.race([
      conversationInsightExtractorService.extractInsightsOnly(
        message,
        lastCoachMessage,
        '',
      ),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), EI_TIMEOUT_MS)),
    ]);

    return result;
  }

  private async fetchExistingPatterns(
    userId: string,
    provided?: BehavioralPattern[],
  ): Promise<BehavioralPattern[]> {
    if (provided && provided.length > 0) return provided;

    try {
      const memories = await memoryEngineService.getActiveMemories(userId, {
        category: 'behavioral',
        minConfidence: 0.4,
      });

      return memories
        .filter((m: any) => m.structuredData?.type)
        .map((m: any) => ({
          type: m.structuredData.type,
          frequency: m.structuredData.frequency || m.evidenceCount || 1,
          lastOccurrence: m.updatedAt || m.createdAt || new Date().toISOString(),
          confidence: m.confidence,
        }));
    } catch {
      return [];
    }
  }

  private mergePatterns(
    fromExtraction: BehavioralPattern[],
    fromMemory: BehavioralPattern[],
  ): BehavioralPattern[] {
    const merged = new Map<string, BehavioralPattern>();

    for (const p of fromMemory) {
      merged.set(p.type, p);
    }
    for (const p of fromExtraction) {
      const existing = merged.get(p.type);
      if (existing) {
        merged.set(p.type, {
          ...p,
          frequency: Math.max(p.frequency, existing.frequency),
          confidence: Math.max(p.confidence, existing.confidence),
        });
      } else {
        merged.set(p.type, p);
      }
    }

    return Array.from(merged.values());
  }

  private computeMoodTrajectory(
    logs: Array<{ state: string; intensity: number; created_at: string }>,
  ): EmotionalContext['moodTrajectory'] {
    if (logs.length < 2) return 'stable';

    const negativeStates = new Set([
      'sad', 'sadness', 'angry', 'anger', 'anxious', 'anxiety',
      'stressed', 'distressed', 'frustrated', 'overwhelmed',
    ]);

    const scores = logs.map(l => negativeStates.has(l.state.toLowerCase()) ? -l.intensity : l.intensity);
    const recent = scores.slice(0, Math.ceil(scores.length / 2));
    const older = scores.slice(Math.ceil(scores.length / 2));

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - recentAvg, 2), 0) / scores.length;

    if (variance > 20) return 'volatile';
    if (recentAvg - olderAvg > 1.5) return 'improving';
    if (olderAvg - recentAvg > 1.5) return 'declining';
    return 'stable';
  }

  private detectResponseComplexity(
    currentMessage: string,
    history: Array<{ role: string; content: string }>,
  ): EmotionalContext['responseComplexity'] {
    const userMessages = history.filter(m => m.role === 'user').map(m => m.content);
    if (userMessages.length < 2) return 'stable';

    const prevLengths = userMessages.slice(-3).map(m => m.length);
    const avgPrevLength = prevLengths.reduce((a, b) => a + b, 0) / prevLengths.length;

    if (currentMessage.length < avgPrevLength * 0.4) return 'shrinking';
    if (currentMessage.length > avgPrevLength * 1.8) return 'expanding';
    return 'stable';
  }
}

export const emotionalIntelligenceService = new EmotionalIntelligenceService();
