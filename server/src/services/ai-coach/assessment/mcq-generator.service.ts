import crypto from 'crypto';
import { env } from '../../../config/env.config.js';
import { logger } from '../../logger.service.js';
import { ApiError } from '../../../utils/ApiError.js';
import type { AIProvider } from '../core/ai-provider.js';
import { goalContextMap } from '../core/goal-context.js';
import { getFallbackQuestions } from '../data/fallback-questions.data.js';
import type {
  GoalCategory,
  SupportedLanguage,
  ConversationPhase,
  ExtractedInsight,
  MCQOption,
  MCQGenerationRequest,
  MCQGenerationResponse,
} from '../types/index.js';

export class MCQGeneratorService {
  private openaiQuotaExhaustedUntil = 0;

  constructor(private provider: AIProvider) {}

  async generateMCQQuestion(request: MCQGenerationRequest): Promise<MCQGenerationResponse> {
    try {
      const { goal, customGoalText, selectedGoalLabel, phase = 'opening', previousAnswers = [], language = 'en' } = request;

      const questionId = crypto.randomUUID();

      const goalContext = { ...(goalContextMap[goal] || goalContextMap.custom) };

      const displayGoalName = selectedGoalLabel?.trim() || (customGoalText?.trim() ? customGoalText.trim() : goalContext.name);

      if (customGoalText && customGoalText.trim()) {
        goalContext.name = customGoalText.trim();
        goalContext.description = `User's personal goal: ${customGoalText.trim()}`;
      }

      let previousQAContext = '';
      if (previousAnswers.length > 0) {
        const qaList = previousAnswers.map((a, i) =>
          `Q${i + 1}: "${a.questionText || a.questionId}" → Answer: ${a.selectedOptions.join(', ')}`
        ).join('\n');
        previousQAContext = `\nPreviously asked questions (DO NOT repeat or rephrase ANY of these):\n${qaList}`;
      }

      let insightsContext = '';
      if (request.extractedInsights && request.extractedInsights.length > 0) {
        const insightsList = request.extractedInsights
          .slice(-5)
          .map(i => `- ${i.category}: ${i.text} (confidence: ${i.confidence})`)
          .join('\n');
        insightsContext = `\nInsights gathered so far:\n${insightsList}`;
      }

      const coveredTopics = previousAnswers.map(a => a.questionText?.toLowerCase() || '').join(' ');
      const remainingTopics = goalContext.keyTopics.filter(
        topic => !coveredTopics.includes(topic.split(' ')[0])
      );
      const suggestedTopic = remainingTopics.length > 0 ? remainingTopics[0] : goalContext.keyTopics[previousAnswers.length % goalContext.keyTopics.length];

      const phaseTopics: Record<string, string> = {
        opening: 'motivation, current habits, lifestyle basics',
        exploration: 'specific challenges, preferences, schedule, experience level',
        deep_dive: 'detailed preferences, constraints, medical considerations, past attempts',
      };
      const topicHint = phaseTopics[phase] || phaseTopics.opening;

      const mcqSystemPrompt = `You are an expert health assessment coach specializing in ${goalContext.name}.
The user's goal: ${goalContext.description}.

CRITICAL: The user has ALREADY selected "${displayGoalName}" as their primary health goal in the app UI.
Do NOT ask "What is your primary health goal?" or any variation of that question.
Do NOT ask generic opening questions like "What do you want to achieve?" or "What brings you here?"
The primary goal is already known — start with a specific follow-up question about their ${displayGoalName} journey (e.g., experience level, current habits, specific motivations, schedule, challenges).

Your task: Generate ONE highly relevant MCQ question for their ${displayGoalName} assessment.

Phase: ${phase} (focus areas: ${topicHint}).
Suggested next topic: ${suggestedTopic}.
${previousQAContext}
${insightsContext}

Return ONLY valid JSON: {"question": "text", "options": [{"text": "opt1", "insightValue": "val1"}, {"text": "opt2", "insightValue": "val2"}, {"text": "opt3", "insightValue": "val3"}, {"text": "opt4", "insightValue": "val4"}]}

Rules:
- NEVER ask about the user's primary goal — it is already "${displayGoalName}"
- Question MUST be specifically about ${displayGoalName} — not generic health
- Question must be unique — never repeat or rephrase previous questions
- Exactly 4 meaningful options that reveal actionable insights about the user
- insightValue: snake_case key summarizing the option (e.g., "high_stress", "no_exercise")
- ${language === 'ur' ? 'Generate question and options in Urdu language' : 'Generate in English'}`;

      const userPrompt = `Generate assessment question ${previousAnswers.length + 1} of 7 for a user who selected "${displayGoalName}" as their goal. Their goal is already known — ask about: ${suggestedTopic}.`;

      try {
        let content: string | null = null;
        let contentSource: 'gemini' | 'openai' | null = null;

        if (this.provider.geminiApiKey) {
          try {
            content = await this.provider.callGeminiText(mcqSystemPrompt, [{ role: 'user', content: userPrompt }], 900, 0.3, true);
            contentSource = content ? 'gemini' : null;
          } catch (geminiError: any) {
            logger.warn('[AICoach] Gemini MCQ generation failed, trying OpenAI', { error: geminiError?.message });
          }
        }

        if (!content && this.provider.visionClient && Date.now() > this.openaiQuotaExhaustedUntil) {
          try {
            logger.info('[AICoach] Gemini unavailable, attempting OpenAI fallback for MCQ');
            content = await this.generateMCQWithOpenAI(mcqSystemPrompt, userPrompt);
            if (content) {
              contentSource = 'openai';
              logger.info('[AICoach] OpenAI fallback succeeded for MCQ generation');
            }
          } catch (openaiError: any) {
            const msg = openaiError?.message || '';
            if (msg.includes('429') || msg.includes('quota')) {
              this.openaiQuotaExhaustedUntil = Date.now() + 5 * 60 * 1000;
              logger.warn('[AICoach] OpenAI quota exhausted, skipping for 5 min');
            } else {
              logger.warn('[AICoach] OpenAI fallback also failed for MCQ', { error: msg });
            }
            throw openaiError;
          }
        }

        if (!content || content.trim().length === 0) {
          logger.warn('[AICoach] Empty response from all providers, using fallback');
          return this.generateFallbackMCQQuestion(
            goal,
            phase,
            language,
            questionId,
            previousAnswers,
            customGoalText,
            'The AI question generator returned an empty response, so we loaded a safe fallback question.'
          );
        }

        interface ParsedResponse {
          question?: string;
          options?: Array<{ text: string; insightValue?: string }>;
        }

        let parsed: ParsedResponse;
        try {
          parsed = this.parseMCQContent(content) as ParsedResponse;
        } catch (parseError) {
          if (contentSource === 'gemini' && this.provider.visionClient) {
            logger.warn('[AICoach] Gemini returned malformed MCQ JSON, retrying with OpenAI', {
              contentPreview: content.substring(0, 300),
              error: parseError instanceof Error ? parseError.message : 'Unknown parse error',
            });

            const openAIContent = await this.generateMCQWithOpenAI(mcqSystemPrompt, userPrompt);
            if (openAIContent) {
              content = openAIContent;
              contentSource = 'openai';
              parsed = this.parseMCQContent(content) as ParsedResponse;
            } else {
              throw parseError;
            }
          } else {
            logger.warn('[AICoach] Failed to parse MCQ JSON from provider response', {
              provider: contentSource,
              contentPreview: content.substring(0, 300),
              error: parseError instanceof Error ? parseError.message : 'Unknown parse error',
            });
            throw parseError;
          }
        }
        const questionText = parsed.question || 'How can I help you achieve your goals?';
        const rawOptions = parsed.options || [];

        if (rawOptions.length < 2) {
          const fallbackOptions = language === 'ur'
            ? ['ہاں', 'نہیں', 'شاید', 'یقین نہیں']
            : ['Yes', 'No', 'Maybe', 'Not sure'];
          rawOptions.push(...fallbackOptions.slice(0, 4 - rawOptions.length).map(opt => ({ text: opt })));
        }

        const options: MCQOption[] = rawOptions.slice(0, 4).map((opt: { text: string; insightValue?: string }, idx: number) => ({
          id: `opt-${idx + 1}`,
          text: opt.text || `Option ${idx + 1}`,
          insightValue: opt.insightValue || opt.text?.toLowerCase().replace(/\s+/g, '_') || `option_${idx + 1}`,
        }));

        let nextPhase: ConversationPhase = phase;
        const answerCount = previousAnswers.length;
        if (answerCount < 2) {
          nextPhase = 'opening';
        } else if (answerCount < 5) {
          nextPhase = 'exploration';
        } else {
          nextPhase = 'deep_dive';
        }

        const targetQuestions = 7;
        const questionsAnswered = answerCount;
        const currentQuestionNumber = questionsAnswered + 1;
        const progress = Math.min(100, Math.round((currentQuestionNumber / targetQuestions) * 100));

        const isComplete = answerCount >= 6;

        return {
          question: {
            id: questionId,
            question: questionText,
            options,
          },
          phase: nextPhase,
          progress,
          isComplete: isComplete || false,
          insights: [],
        };
      } catch (aiError) {
        logger.warn('[AICoach] AI question generation failed, using fallback', {
          goal,
          phase,
          error: aiError instanceof Error ? aiError.message : 'Unknown error',
        });

        return this.generateFallbackMCQQuestion(
          goal,
          phase,
          language,
          questionId,
          previousAnswers,
          customGoalText,
          'The AI question generator returned an invalid response, so we loaded a safe fallback question.'
        );
      }
    } catch (error) {
      logger.error('[AICoach] Error generating MCQ question', {
        goal: request.goal,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw ApiError.internal('Failed to generate MCQ question');
    }
  }

  private generateFallbackMCQQuestion(
    goal: GoalCategory,
    phase: ConversationPhase,
    language: SupportedLanguage,
    questionId: string,
    previousAnswers: { questionId: string; questionText?: string; selectedOptions: string[] }[] = [],
    customGoalText?: string,
    warning?: string
  ): MCQGenerationResponse {
    const questionPool = goal === 'custom' && this.isRoutineCustomGoal(customGoalText)
      ? this.getCustomRoutineFallbackQuestions()
      : getFallbackQuestions(goal, language);

    const askedQuestions = new Set(
      previousAnswers.map(a => a.questionText?.toLowerCase().trim()).filter(Boolean)
    );

    const unusedQuestion = questionPool.find(
      q => !askedQuestions.has(q.question.toLowerCase().trim())
    );

    const selectedQuestion = unusedQuestion || questionPool[questionPool.length - 1];

    const options: MCQOption[] = selectedQuestion.options.map((opt, idx) => ({
      id: `opt-${idx + 1}`,
      text: opt,
      insightValue: opt.toLowerCase().replace(/\s+/g, '_'),
    }));

    const targetQuestions = 7;
    const questionsAnswered = previousAnswers.length;
    const currentQuestionNumber = questionsAnswered + 1;
    const progress = Math.min(100, Math.round((currentQuestionNumber / targetQuestions) * 100));
    const isComplete = questionsAnswered >= 6;

    return {
      question: {
        id: questionId,
        question: selectedQuestion.question,
        options,
      },
      phase,
      progress,
      isComplete,
      insights: [],
      usedFallback: true,
      warning: warning || 'AI question generation was unavailable, so we loaded a safe fallback question.',
    };
  }

  private async generateMCQWithOpenAI(systemPrompt: string, userPrompt: string): Promise<string | null> {
    if (!this.provider.visionClient) return null;

    const model = env.openai.model || 'gpt-4o-mini';
    const tokenLimit = this.provider.isReasoningModel(model) ? 700 : 1000;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const completion = await this.provider.visionClient.chat.completions.create(
        {
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          ...this.provider.getTemperatureParameter(model, 0.3),
          ...this.provider.getTokenParameter(model, tokenLimit),
          ...this.provider.getResponseFormatParameter(model),
        },
        { signal: controller.signal as any },
      );
      return completion.choices[0]?.message?.content || null;
    } catch (err: any) {
      if (err.name === 'AbortError' || err.name === 'APIConnectionTimeoutError') {
        throw new Error(`OpenAI MCQ request timed out (15s)`);
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  private parseMCQContent(content: string): { question?: string; options?: Array<{ text: string; insightValue?: string }> } {
    const cleanContent = this.provider.stripMarkdownFences(content).trim();
    type MCQResult = { question?: string; options?: Array<{ text: string; insightValue?: string }> };

    try {
      return JSON.parse(cleanContent) as MCQResult;
    } catch {
      const repaired = this.provider.repairJSON(cleanContent);
      try {
        return JSON.parse(repaired) as MCQResult;
      } catch {
        const start = repaired.indexOf('{');
        const end = repaired.lastIndexOf('}');
        if (start === -1 || end === -1 || end <= start) {
          throw new Error('AI returned incomplete JSON that could not be repaired.');
        }
        return JSON.parse(repaired.slice(start, end + 1)) as MCQResult;
      }
    }
  }

  private isRoutineCustomGoal(customGoalText?: string): boolean {
    if (!customGoalText) return false;
    return /\b(discipline|career|work|focus|meaningful|relationship|relationships|sleep|routine|consistent|consistency|daily)\b/i.test(customGoalText);
  }

  private getCustomRoutineFallbackQuestions(): { question: string; options: string[] }[] {
    return [
      {
        question: 'Which part of your daily routine breaks down most often?',
        options: ['Starting the day', 'Focused work blocks', 'Evening wind-down', 'All of these'],
      },
      {
        question: 'What most often disrupts your sleep consistency?',
        options: ['Late screens', 'Irregular bedtime', 'Stress or overthinking', 'Work or family demands'],
      },
      {
        question: 'What usually blocks meaningful work each day?',
        options: ['No clear priority', 'Distractions', 'Low energy', 'Avoiding hard tasks'],
      },
      {
        question: 'Which relationship action is hardest to keep consistent?',
        options: ['Checking in', 'Quality time', 'Difficult conversations', 'Showing appreciation'],
      },
      {
        question: 'What kind of structure would help your discipline most?',
        options: ['Morning plan', 'Time blocks', 'Evening review', 'Accountability check-ins'],
      },
      {
        question: 'When would a daily reset be easiest to maintain?',
        options: ['Right after waking', 'Before work starts', 'After work', 'Before bed'],
      },
      {
        question: 'What usually makes you lose momentum after a good day?',
        options: ['Poor sleep', 'No next-day plan', 'Social distractions', 'Low confidence'],
      },
    ];
  }

  async processMCQAnswer(
    questionId: string,
    selectedOptions: MCQOption[],
    goal: GoalCategory
  ): Promise<ExtractedInsight[]> {
    try {
      const insights: ExtractedInsight[] = [];

      for (const option of selectedOptions) {
        const insight: ExtractedInsight = {
          category: goal,
          text: option.text || option.insightValue || 'User selected an option',
          confidence: 0.8,
        };
        insights.push(insight);
      }

      if (selectedOptions.length > 0) {
        const primaryOption = selectedOptions[0];
        insights.push({
          category: 'motivation',
          text: `User's primary focus: ${primaryOption.text || primaryOption.insightValue || 'Not specified'}`,
          confidence: 0.9,
        });
      }

      return insights;
    } catch (error) {
      logger.error('[AICoach] Error processing MCQ answer', {
        questionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw ApiError.internal('Failed to process MCQ answer');
    }
  }
}
