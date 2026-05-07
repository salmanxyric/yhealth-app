import { env } from '../../../config/env.config.js';
import { logger } from '../../logger.service.js';
import type { AIProvider } from '../core/ai-provider.js';
import { batchGoalContextMap } from '../core/goal-context.js';
import type {
  GoalCategory,
  SupportedLanguage,
  MCQOption,
  MCQQuestion,
  BatchMCQRequest,
  BatchMCQResponse,
} from '../types/index.js';

export class BatchMCQService {
  constructor(private provider: AIProvider) {}

  async generateBatchMCQQuestions(request: BatchMCQRequest): Promise<BatchMCQResponse> {
    try {
      const { goal, customGoalText, count = 6, language = 'en' } = request;

      const baseGoalContext = batchGoalContextMap[goal] || batchGoalContextMap.custom;
      const customTopics = goal === 'custom' ? this.deriveCustomGoalTopics(customGoalText) : [];
      const goalContext = goal === 'custom' && customTopics.length > 0
        ? { ...baseGoalContext, keyTopics: customTopics }
        : baseGoalContext;
      const goalTitle = goal === 'custom' && customGoalText ? customGoalText : goalContext.name;
      const goalDesc = goal === 'custom' && customGoalText ? customGoalText : goalContext.description;
      const customGoalGuardrail = goal === 'custom'
        ? `
Custom-goal guardrails:
- The custom text is the source of truth. Ask about the stated areas only.
- If the goal mentions sleep, routine, career/work/focus, discipline, or relationships, questions MUST cover those areas.
- Do NOT ask broad chooser questions like "What aspect of your health would you most like to improve?" because the user already described the goal.
- Do NOT ask unrelated nutrition, exercise, hydration, or generic wellness questions unless the custom goal explicitly mentions them.`
        : '';

      const systemPrompt = `You are Balencia's AI life coach. Generate ${count} personalized quick-assessment MCQ questions based strictly on the user's goal.

User's goal: "${goalTitle}"
Goal description: ${goalDesc}
Key assessment topics: ${goalContext.keyTopics.join(', ')}
${customGoalGuardrail}

Rules:
- Every question MUST directly relate to the user's goal — no generic or random questions
- Questions should help understand: current state, blockers, lifestyle, motivation, constraints, and preferred support style
- Use warm, life-coach-style language
- CRITICAL: Do NOT embed or repeat the user's full goal text inside questions. Instead, reference the goal's THEME naturally.
- Each question must have exactly 4 MCQ options
- Options should be meaningful and reveal actionable insights
- Questions should be easy to answer quickly
- Do NOT ask for sensitive medical, legal, or financial data
- ${language === 'ur' ? 'Generate all questions and options in Urdu language' : 'Generate in English'}
- Keep option labels SHORT (under 5 words each)

Return ONLY valid JSON — no comments, no trailing commas, no markdown. Use this exact format:
{"goal_summary":"Short summary","detected_goal_categories":["cat1","cat2"],"questions":[{"id":"q1","question":"Question text","options":[{"label":"Option","value":"option_value"}]}]}`;

      const userPrompt = `Generate exactly ${count} assessment questions for a user whose goal is: "${goalTitle}". Cover these topics: ${goalContext.keyTopics.slice(0, count).join(', ')}.`;

      let content: string | null = null;

      if (this.provider.geminiApiKey) {
        try {
          content = await this.provider.callGeminiText(systemPrompt, [{ role: 'user', content: userPrompt }], 3500, 0.4, true);
        } catch (geminiError: any) {
          logger.warn('[AICoach] Gemini batch MCQ generation failed, trying OpenAI', { error: geminiError?.message });
        }
      }

      if (!content && this.provider.visionClient) {
        const model = env.openai.model || 'gpt-4o-mini';
        const tokenLimit = this.provider.isReasoningModel(model) ? 2500 : 3500;
        const completion = await this.provider.visionClient.chat.completions.create({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          ...this.provider.getTemperatureParameter(model, 0.4),
          ...this.provider.getTokenParameter(model, tokenLimit),
          ...this.provider.getResponseFormatParameter(model),
        });
        content = completion.choices[0]?.message?.content || null;
      }

      if (!content || content.trim().length === 0) {
        logger.warn('[AICoach] Empty response from all providers for batch MCQ, using fallback');
        return this.generateFallbackBatchQuestions(goal, customGoalText, count, language);
      }

      const cleanContent = this.provider.stripMarkdownFences(content);

      logger.info('[AICoach] Batch MCQ raw response', {
        length: cleanContent.length,
        first200: cleanContent.substring(0, 200),
        last200: cleanContent.substring(Math.max(0, cleanContent.length - 200)),
      });

      interface ParsedBatchResponse {
        goal_summary?: string;
        detected_goal_categories?: string[];
        questions?: Array<{
          id?: string;
          question?: string;
          options?: Array<{ label?: string; value?: string; text?: string }>;
        }>;
      }

      let parsed: ParsedBatchResponse;
      try {
        parsed = JSON.parse(cleanContent) as ParsedBatchResponse;
      } catch (firstErr) {
        logger.warn('[AICoach] Batch MCQ JSON parse attempt 1 failed', {
          error: firstErr instanceof Error ? firstErr.message : 'Unknown',
        });
        const repaired = this.provider.repairJSON(cleanContent);
        try {
          parsed = JSON.parse(repaired) as ParsedBatchResponse;
        } catch (secondErr) {
          logger.warn('[AICoach] Batch MCQ JSON parse attempt 2 failed', {
            error: secondErr instanceof Error ? secondErr.message : 'Unknown',
            repairedLast300: repaired.substring(Math.max(0, repaired.length - 300)),
          });
          // Attempt 3: extract the outermost JSON object
          const jsonMatch = repaired.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const extracted = this.provider.repairJSON(jsonMatch[0]);
            try {
              parsed = JSON.parse(extracted) as ParsedBatchResponse;
            } catch (thirdErr) {
              // Attempt 4: extract individual question objects via regex
              logger.warn('[AICoach] Batch MCQ JSON attempt 3 failed, trying question extraction', {
                error: thirdErr instanceof Error ? thirdErr.message : 'Unknown',
              });
              const extractedQuestions = this.extractQuestionsFromBrokenJSON(repaired);
              if (extractedQuestions.length >= 2) {
                parsed = { goal_summary: goalTitle, detected_goal_categories: [goal], questions: extractedQuestions };
              } else {
                logger.error('[AICoach] Batch MCQ JSON all parse attempts failed', {
                  rawLast300: cleanContent.substring(Math.max(0, cleanContent.length - 300)),
                });
                return this.generateFallbackBatchQuestions(goal, customGoalText, count, language);
              }
            }
          } else {
            logger.error('[AICoach] Batch MCQ no JSON object found in response');
            return this.generateFallbackBatchQuestions(goal, customGoalText, count, language);
          }
        }
      }

      const rawQuestions = parsed.questions || [];
      if (rawQuestions.length < 2) {
        logger.warn('[AICoach] Too few questions from AI, using fallback');
        return this.generateFallbackBatchQuestions(goal, customGoalText, count, language);
      }

      if (goal === 'custom' && this.hasIrrelevantCustomQuestions(rawQuestions, customTopics)) {
        logger.warn('[AICoach] Generic custom-goal questions detected, using targeted fallback', {
          customTopics,
        });
        return this.generateFallbackBatchQuestions(goal, customGoalText, count, language);
      }

      const questions: MCQQuestion[] = rawQuestions.slice(0, count).map((q, idx) => {
        const options: MCQOption[] = (q.options || []).slice(0, 5).map((opt, optIdx) => ({
          id: `opt-${optIdx + 1}`,
          text: opt.label || opt.text || `Option ${optIdx + 1}`,
          insightValue: opt.value || (opt.label || '').toLowerCase().replace(/\s+/g, '_') || `option_${optIdx + 1}`,
        }));

        if (options.length < 2) {
          const defaults = ['Yes', 'No', 'Sometimes', 'Not sure'];
          while (options.length < 4) {
            options.push({ id: `opt-${options.length + 1}`, text: defaults[options.length] || `Option ${options.length + 1}`, insightValue: defaults[options.length]?.toLowerCase().replace(/\s+/g, '_') || `opt_${options.length + 1}` });
          }
        }

        return {
          id: q.id || `batch-q${idx + 1}`,
          question: q.question || `Question ${idx + 1}`,
          options,
        };
      });

      return {
        questions,
        goalSummary: parsed.goal_summary || goalTitle,
        detectedCategories: parsed.detected_goal_categories || [goal],
      };
    } catch (error) {
      logger.error('[AICoach] Error generating batch MCQ questions', {
        goal: request.goal,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return this.generateFallbackBatchQuestions(request.goal, request.customGoalText, request.count || 6, request.language || 'en');
    }
  }

  private generateFallbackBatchQuestions(
    goal: GoalCategory,
    customGoalText: string | undefined,
    count: number,
    language: SupportedLanguage,
  ): BatchMCQResponse {
    const goalLabel = customGoalText || goal.replace(/_/g, ' ');
    const customQuestions = goal === 'custom'
      ? this.generateCustomGoalFallbackQuestions(customGoalText, count, language)
      : null;

    if (customQuestions) {
      return {
        questions: customQuestions,
        goalSummary: goalLabel,
        detectedCategories: ['custom', ...this.deriveCustomGoalTopics(customGoalText).slice(0, 4)],
      };
    }

    const universalQuestions = language === 'ur'
      ? [
          { q: `آپ کی "${goalLabel}" کی طرف موجودہ صورتحال کیا ہے؟`, opts: ['ابھی شروع کر رہا ہوں', 'کچھ تجربہ ہے', 'درمیانی سطح', 'اعلی سطح'] },
          { q: `"${goalLabel}" میں آپ کی سب سے بڑی رکاوٹ کیا ہے؟`, opts: ['وقت نہیں', 'حوصلہ نہیں', 'علم نہیں', 'مدد نہیں ملتی'] },
          { q: `آپ اس مقصد کے لیے ہفتے میں کتنا وقت دے سکتے ہیں؟`, opts: ['1-2 گھنٹے', '3-5 گھنٹے', '5-10 گھنٹے', '10+ گھنٹے'] },
          { q: `آپ کس قسم کی مدد ترجیح دیتے ہیں؟`, opts: ['روزانہ یاد دہانی', 'ہفتہ وار منصوبہ', 'ذاتی کوچنگ', 'خود مختار'] },
          { q: `آپ نے پہلے اس مقصد کے لیے کیا کوشش کی ہے؟`, opts: ['کچھ نہیں', 'ایک بار کوشش کی', 'کئی بار', 'ابھی کر رہا ہوں'] },
          { q: `آپ کب سب سے زیادہ متحرک ہوتے ہیں؟`, opts: ['صبح', 'دوپہر', 'شام', 'رات'] },
        ]
      : [
          { q: `Since your goal is to ${goalLabel}, where are you starting from right now?`, opts: ['Complete beginner', 'Some experience', 'Intermediate', 'Advanced'] },
          { q: `What usually gets in the way of making progress toward ${goalLabel}?`, opts: ['Lack of time', 'Low motivation', 'Not sure how', 'No support system'] },
          { q: `How much time per week can you dedicate to ${goalLabel}?`, opts: ['1-2 hours', '3-5 hours', '5-10 hours', '10+ hours'] },
          { q: `What kind of support helps you most when working toward a goal?`, opts: ['Daily reminders', 'Weekly plans', 'Personal coaching', 'Self-directed'] },
          { q: `Have you tried working on ${goalLabel} before?`, opts: ['Never tried', 'Tried once', 'Multiple attempts', 'Currently working on it'] },
          { q: `When are you most energized and focused during the day?`, opts: ['Morning', 'Midday', 'Afternoon', 'Evening'] },
        ];

    const questions: MCQQuestion[] = universalQuestions.slice(0, count).map((fq, idx) => ({
      id: `fallback-q${idx + 1}`,
      question: fq.q,
      options: fq.opts.map((opt, optIdx) => ({
        id: `opt-${optIdx + 1}`,
        text: opt,
        insightValue: opt.toLowerCase().replace(/\s+/g, '_'),
      })),
    }));

    return {
      questions,
      goalSummary: goalLabel,
      detectedCategories: [goal],
    };
  }

  private deriveCustomGoalTopics(customGoalText?: string): string[] {
    const text = customGoalText?.toLowerCase() || '';
    if (!text.trim()) return [];

    const topics: string[] = [];
    const add = (topic: string) => {
      if (!topics.includes(topic)) topics.push(topic);
    };

    if (/\b(sleep|bed|wake|night|morning|routine)\b/.test(text)) {
      add('sleep consistency and wake/sleep routine');
    }
    if (/\b(discipline|consistent|consistency|routine|habit|daily)\b/.test(text)) {
      add('daily discipline and routine breakdowns');
    }
    if (/\b(career|work|job|business|focus|productive|meaningful)\b/.test(text)) {
      add('focused meaningful work and career progress');
    }
    if (/\b(relationship|relationships|family|friend|partner|social)\b/.test(text)) {
      add('intentional relationship actions and social follow-through');
    }
    if (/\b(stress|anxiety|overwhelm|mental|mood)\b/.test(text)) {
      add('stress and mental wellbeing blockers');
    }
    if (/\b(food|nutrition|diet|eating|meal)\b/.test(text)) {
      add('nutrition and eating consistency');
    }
    if (/\b(exercise|fitness|workout|strength|cardio|walk)\b/.test(text)) {
      add('movement and fitness consistency');
    }

    return topics.length > 0
      ? topics
      : ['current routine', 'biggest blockers', 'time availability', 'support needs', 'motivation', 'preferred approach'];
  }

  private hasIrrelevantCustomQuestions(
    questions: Array<{ question?: string }>,
    customTopics: string[],
  ): boolean {
    const bannedGenericPatterns = [
      /what aspect of (your )?health/i,
      /which aspect of (your )?health/i,
      /what changes would you like to make/i,
      /what challenges are you facing/i,
      /how much water do you drink/i,
      /how often do you currently exercise/i,
    ];

    if (questions.some(q => bannedGenericPatterns.some(pattern => pattern.test(q.question || '')))) {
      return true;
    }

    if (customTopics.length === 0) return false;

    const relevantWords = customTopics
      .join(' ')
      .toLowerCase()
      .split(/[^a-z]+/)
      .filter(word => word.length >= 5);
    const firstQuestions = questions.slice(0, 2).map(q => (q.question || '').toLowerCase()).join(' ');

    return relevantWords.length > 0 && !relevantWords.some(word => firstQuestions.includes(word));
  }

  private generateCustomGoalFallbackQuestions(
    customGoalText: string | undefined,
    count: number,
    _language: SupportedLanguage,
  ): MCQQuestion[] | null {
    const topics = this.deriveCustomGoalTopics(customGoalText);
    if (!customGoalText?.trim() || topics.length === 0) return null;

    const questions = [
      {
        q: 'Which part of your daily routine breaks down most often?',
        opts: ['Starting the day', 'Work blocks', 'Evening wind-down', 'All of the above'],
      },
      {
        q: 'What most often disrupts your sleep consistency?',
        opts: ['Late screens', 'Irregular bedtime', 'Stress or overthinking', 'Work or family demands'],
      },
      {
        q: 'What usually blocks meaningful work each day?',
        opts: ['No clear priority', 'Distractions', 'Low energy', 'Avoiding hard tasks'],
      },
      {
        q: 'Which relationship action is hardest to keep consistent?',
        opts: ['Checking in', 'Quality time', 'Difficult conversations', 'Showing appreciation'],
      },
      {
        q: 'What kind of structure would help your discipline most?',
        opts: ['Morning plan', 'Time blocks', 'Evening review', 'Accountability check-ins'],
      },
      {
        q: 'When would a daily reset be easiest to maintain?',
        opts: ['Right after waking', 'Before work starts', 'After work', 'Before bed'],
      },
    ];

    return questions.slice(0, count).map((item, idx) => ({
      id: `custom-fallback-q${idx + 1}`,
      question: item.q,
      options: item.opts.map((opt, optIdx) => ({
        id: `opt-${optIdx + 1}`,
        text: opt,
        insightValue: opt.toLowerCase().replace(/\s+/g, '_'),
      })),
    }));
  }

  private extractQuestionsFromBrokenJSON(
    text: string,
  ): Array<{ id?: string; question?: string; options?: Array<{ label?: string; value?: string }> }> {
    const questions: Array<{ id?: string; question?: string; options?: Array<{ label?: string; value?: string }> }> = [];
    const questionPattern = /"question"\s*:\s*"([^"]+)"/g;
    let match: RegExpExecArray | null;

    while ((match = questionPattern.exec(text)) !== null) {
      const questionText = match[1];
      const afterQuestion = text.substring(match.index, match.index + 600);
      const optionPattern = /"label"\s*:\s*"([^"]+)"\s*,\s*"value"\s*:\s*"([^"]+)"/g;
      const options: Array<{ label: string; value: string }> = [];
      let optMatch: RegExpExecArray | null;

      while ((optMatch = optionPattern.exec(afterQuestion)) !== null) {
        options.push({ label: optMatch[1], value: optMatch[2] });
      }

      if (options.length >= 2) {
        questions.push({
          id: `extracted-q${questions.length + 1}`,
          question: questionText,
          options,
        });
      }
    }

    return questions;
  }
}
