import { env } from '../../../config/env.config.js';
import { logger } from '../../logger.service.js';
import type { AIProvider } from '../core/ai-provider.js';
import type {
  SupportedLanguage,
  LifeCoachQuestionItem,
  LifeCoachQuestionsRequest,
  LifeCoachQuestionsResponse,
} from '../types/index.js';

interface ParsedLifeCoachResponse {
  questions?: Array<{
    id?: string;
    question?: string;
    type?: string;
    goal_area?: string;
    purpose?: string;
    optional?: boolean;
    placeholder?: string;
    options?: Array<{ label?: string; value?: string }>;
  }>;
}

export class LifeCoachService {
  constructor(private provider: AIProvider) {}

  async generateLifeCoachQuestions(request: LifeCoachQuestionsRequest): Promise<LifeCoachQuestionsResponse> {
    try {
      const { goal, customGoalText, selectedGoalLabel, assessmentResponses = [], language = 'en' } = request;
      const goalContext = this.getGoalContext(goal, customGoalText, selectedGoalLabel);

      if (goalContext.isCustomRoutineGoal) {
        return this.generateRoutineLifeCoachQuestions(language);
      }

      let assessmentContext = '';
      if (assessmentResponses.length > 0) {
        const qaList = assessmentResponses
          .map((r, i) => `Q${i + 1}: "${r.questionText}" -> "${r.value}"`)
          .join('\n');
        assessmentContext = `\nUser's quick-assessment answers:\n${qaList}`;
      }

      const systemPrompt = `You are Balencia's premium AI life coach. The user has already selected a primary goal in the app. Generate 4 deeper personalized questions to understand their needs better.

User-facing goal summary: "${goalContext.displayGoal}"
Original goal details for context only: "${goalContext.promptGoal}"
${assessmentContext}

CRITICAL:
- The user's primary goal is already known. Do not ask what they want to improve or what their goal is.
- Do not quote the original goal details back to the user.
- Use the short goal summary in natural language only when needed.

Ask specific questions about their journey:
- What outcome would create the most meaningful change first
- Current habits, constraints, and blockers
- What support style would make follow-through easier
- Any additional life goals they want to add

These questions should:
- Be deeply personalized to the selected goal, not generic life improvement
- Reveal motivation, emotional blockers, lifestyle constraints, and long-term vision
- Make the user feel understood and supported
- Use warm, premium, coach-led language
- ${language === 'ur' ? 'Generate in Urdu language' : 'Generate in English'}

IMPORTANT: The second question MUST be about motivation level with type "cards" and these exact 3 options:
  [{"label": "Low - I want to change but struggle to start", "value": "low"},
   {"label": "Medium - I want to improve but need guidance", "value": "medium"},
   {"label": "High - I'm ready to go all in", "value": "high"}]

The other questions should be type "text" with a relevant placeholder.

Return ONLY valid JSON:
{
  "questions": [
    {
      "id": "lc1",
      "question": "Deep reflective question text",
      "type": "text",
      "goal_area": "relevant_area",
      "purpose": "What this question helps understand",
      "optional": false,
      "placeholder": "e.g., placeholder text..."
    }
  ]
}`;

      const userPrompt = `Generate 4 life-coach questions for a user whose goal summary is "${goalContext.displayGoal}". Their goal is already known, so do not ask them to restate the goal. Do not quote the original goal details. Return only valid JSON.`;

      let content: string | null = null;
      let parsed: ParsedLifeCoachResponse | null = null;

      if (this.provider.geminiApiKey) {
        try {
          content = await this.provider.callGeminiText(systemPrompt, [{ role: 'user', content: userPrompt }], 2200, 0.25, true);
          parsed = this.parseLifeCoachContent(content);
          if (!parsed) throw new Error('Malformed JSON response');
        } catch (geminiError) {
          logger.warn('[AICoach] Gemini life-coach questions unavailable or malformed, trying OpenAI', {
            goal,
            error: geminiError instanceof Error ? geminiError.message : 'Malformed JSON response',
          });
          content = null;
          parsed = null;
        }
      }

      if (!parsed && this.provider.visionClient) {
        const model = env.openai.model || 'gpt-4o-mini';
        const tokenLimit = this.provider.isReasoningModel(model) ? 1600 : 2200;
        const completion = await this.provider.visionClient.chat.completions.create({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          ...this.provider.getTemperatureParameter(model, 0.25),
          ...this.provider.getTokenParameter(model, tokenLimit),
          ...this.provider.getResponseFormatParameter(model),
        });
        content = completion.choices[0]?.message?.content || null;
        parsed = this.parseLifeCoachContent(content);
      }

      if (!parsed) {
        logger.warn('[AICoach] Life-coach question generation returned malformed JSON, using fallback', {
          goal,
          goalSummary: goalContext.displayGoal,
        });
        return this.generateFallbackLifeCoachQuestions(goalContext.displayGoal, language);
      }

      const rawQuestions = parsed.questions || [];
      if (rawQuestions.length < 2) {
        return this.generateFallbackLifeCoachQuestions(goalContext.displayGoal, language);
      }

      const questions: LifeCoachQuestionItem[] = rawQuestions.slice(0, 5).map((q, idx) => {
        const item: LifeCoachQuestionItem = {
          id: q.id || `lc${idx + 1}`,
          question: q.question || `Question ${idx + 1}`,
          type: (q.type as 'text' | 'cards' | 'mcq') || 'text',
          goal_area: q.goal_area || goal,
          purpose: q.purpose || '',
          optional: q.optional ?? idx >= 2,
          placeholder: q.placeholder,
        };

        if (q.options && q.options.length > 0) {
          item.options = q.options.map(o => ({
            label: o.label || '',
            value: o.value || '',
          }));
        }

        return item;
      });

      return { questions };
    } catch (error) {
      logger.warn('[AICoach] Life-coach questions failed, using fallback', {
        goal: request.goal,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      const goalContext = this.getGoalContext(request.goal, request.customGoalText, request.selectedGoalLabel);
      return goalContext.isCustomRoutineGoal
        ? this.generateRoutineLifeCoachQuestions(request.language || 'en')
        : this.generateFallbackLifeCoachQuestions(goalContext.displayGoal, request.language || 'en');
    }
  }

  private parseLifeCoachContent(content: string | null): ParsedLifeCoachResponse | null {
    if (!content || content.trim().length === 0) return null;

    const cleanContent = this.provider.stripMarkdownFences(content);
    const repaired = this.provider.repairJSON(cleanContent);
    const candidates = [cleanContent, repaired, repaired.match(/\{[\s\S]*\}/)?.[0]].filter(Boolean) as string[];

    for (const candidate of candidates) {
      try {
        const parsed = JSON.parse(candidate) as ParsedLifeCoachResponse;
        if (Array.isArray(parsed.questions)) return parsed;
      } catch {
        // Try the next candidate.
      }
    }

    return null;
  }

  private getGoalContext(
    goal: string,
    customGoalText?: string,
    selectedGoalLabel?: string
  ): { displayGoal: string; promptGoal: string; isCustomRoutineGoal: boolean } {
    const customText = customGoalText?.trim() || '';
    const selectedLabel = selectedGoalLabel?.trim() || '';
    const isCustomRoutineGoal = goal === 'custom' && this.isRoutineCustomGoal(customText || selectedLabel);

    if (isCustomRoutineGoal) {
      return {
        displayGoal: 'fix routine, improve sleep, focus on meaningful work, and strengthen relationships',
        promptGoal: customText || selectedLabel,
        isCustomRoutineGoal,
      };
    }

    const displayGoal = selectedLabel || (goal === 'custom' && customText ? this.summarizeCustomGoal(customText) : goal.replace(/_/g, ' '));
    return {
      displayGoal,
      promptGoal: customText || selectedLabel || goal.replace(/_/g, ' '),
      isCustomRoutineGoal,
    };
  }

  private isRoutineCustomGoal(text: string): boolean {
    const normalized = text.toLowerCase();
    const matches = ['routine', 'sleep', 'career', 'work', 'focus', 'relationship', 'discipline']
      .filter(keyword => normalized.includes(keyword));
    return matches.length >= 2;
  }

  private summarizeCustomGoal(text: string): string {
    const normalized = text.toLowerCase();
    const parts: string[] = [];

    if (normalized.includes('routine') || normalized.includes('discipline')) parts.push('build a steadier routine');
    if (normalized.includes('sleep')) parts.push('improve sleep consistency');
    if (normalized.includes('career') || normalized.includes('work') || normalized.includes('focus')) parts.push('protect meaningful work focus');
    if (normalized.includes('relationship')) parts.push('strengthen relationships');

    if (parts.length > 0) return parts.join(', ');
    return text.length > 90 ? `${text.slice(0, 87).trim()}...` : text;
  }

  private generateRoutineLifeCoachQuestions(_language: SupportedLanguage): LifeCoachQuestionsResponse {
    return {
      questions: [
        {
          id: 'routine_priority',
          question: 'Which area would create the most meaningful change first?',
          type: 'text',
          goal_area: 'priority',
          purpose: 'Identify whether routine, sleep, work focus, or relationships should lead the plan',
          optional: true,
          placeholder: 'e.g., sleep consistency, focused work blocks, or intentional relationship time',
        },
        {
          id: 'motivation',
          question: 'How motivated are you to make these changes right now?',
          type: 'cards',
          goal_area: 'motivation',
          purpose: 'Gauge motivation level',
          optional: false,
          options: [
            { label: 'Low - I want to change but struggle to start', value: 'low' },
            { label: 'Medium - I want to improve but need guidance', value: 'medium' },
            { label: "High - I'm ready to go all in", value: 'high' },
          ],
        },
        {
          id: 'routine_blocker',
          question: 'What usually breaks your routine or sleep consistency?',
          type: 'text',
          goal_area: 'blockers',
          purpose: 'Understand practical blockers that affect daily consistency',
          optional: true,
          placeholder: 'e.g., late phone use, unpredictable work, low energy, or no evening structure',
        },
        {
          id: 'relationship_action',
          question: 'What relationship action would you like to practice more consistently?',
          type: 'text',
          goal_area: 'relationships',
          purpose: 'Find a small repeatable action for strengthening relationships',
          optional: true,
          placeholder: 'e.g., one thoughtful message daily, weekly calls, or focused time with family',
        },
      ],
    };
  }

  private generateFallbackLifeCoachQuestions(goalLabel: string, _language: SupportedLanguage): LifeCoachQuestionsResponse {
    return {
      questions: [
        {
          id: 'lc1',
          question: `What would make the biggest difference for ${goalLabel} right now?`,
          type: 'text',
          goal_area: 'motivation',
          purpose: 'Understand the most valuable first outcome',
          optional: true,
          placeholder: 'e.g., the main result you want to feel or see first...',
        },
        {
          id: 'lc2',
          question: 'How motivated are you to make changes right now?',
          type: 'cards',
          goal_area: 'motivation',
          purpose: 'Gauge motivation level',
          options: [
            { label: 'Low - I want to change but struggle to start', value: 'low' },
            { label: 'Medium - I want to improve but need guidance', value: 'medium' },
            { label: "High - I'm ready to go all in", value: 'high' },
          ],
        },
        {
          id: 'lc3',
          question: 'What has made follow-through difficult in the past?',
          type: 'text',
          goal_area: 'past_attempts',
          purpose: 'Learn from past experiences',
          optional: true,
          placeholder: 'e.g., schedule, energy, accountability, stress, or unclear next steps...',
        },
        {
          id: 'lc4',
          question: "Any other life goals you'd like to work on alongside this?",
          type: 'text',
          goal_area: 'other_goals',
          purpose: 'Discover additional goals',
          optional: true,
          placeholder: 'e.g., Save money, pray more, read books, reduce screen time...',
        },
      ],
    };
  }
}
