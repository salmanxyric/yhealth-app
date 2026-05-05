import { env } from '../../../config/env.config.js';
import { logger } from '../../logger.service.js';
import type { AIProvider } from '../core/ai-provider.js';
import type {
  SupportedLanguage,
  LifeCoachQuestionItem,
  LifeCoachQuestionsRequest,
  LifeCoachQuestionsResponse,
} from '../types/index.js';

export class LifeCoachService {
  constructor(private provider: AIProvider) {}

  async generateLifeCoachQuestions(request: LifeCoachQuestionsRequest): Promise<LifeCoachQuestionsResponse> {
    try {
      const { goal, customGoalText, selectedGoalLabel, assessmentResponses = [], language = 'en' } = request;

      const goalLabel = selectedGoalLabel?.trim() || (goal === 'custom' && customGoalText ? customGoalText : goal.replace(/_/g, ' '));

      let assessmentContext = '';
      if (assessmentResponses.length > 0) {
        const qaList = assessmentResponses
          .map((r, i) => `Q${i + 1}: "${r.questionText}" → "${r.value}"`)
          .join('\n');
        assessmentContext = `\nUser's quick-assessment answers:\n${qaList}`;
      }

      const systemPrompt = `You are Balencia's premium AI life coach. The user has ALREADY selected "${goalLabel}" as their primary goal in the app. Generate 4 deeper personalized questions to understand their needs better.

User's selected goal: "${goalLabel}"
${assessmentContext}

CRITICAL: The user's primary goal is already known — "${goalLabel}". Do NOT ask what they want to improve or what their goal is.
Instead, ask specific questions about their "${goalLabel}" journey:
- Their specific motivation for choosing "${goalLabel}"
- Current experience level and habits related to "${goalLabel}"
- Challenges and blockers they face with "${goalLabel}"
- What success looks like for them with "${goalLabel}"

These questions should:
- Be deeply personalized to "${goalLabel}" — not generic life improvement
- Reveal motivation, emotional blockers, lifestyle constraints, and long-term vision
- Make the user feel understood and supported
- Use warm, premium, coach-led language
- ${language === 'ur' ? 'Generate in Urdu language' : 'Generate in English'}

IMPORTANT: The second question MUST be about motivation level with type "cards" and these exact 3 options:
  [{"label": "🌱 Low — I want to change but struggle to start", "value": "low"},
   {"label": "⚡ Medium — I want to improve but need guidance", "value": "medium"},
   {"label": "🔥 High — I'm ready to go all in", "value": "high"}]

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

      const userPrompt = `Generate 4 life-coach questions for a user who selected "${goalLabel}" as their goal. Their goal is already known — do NOT ask what they want to improve. The first question should explore their specific motivation for "${goalLabel}". The second must be about motivation level (type: cards). The third about past attempts with "${goalLabel}" (optional). The fourth about additional life goals (optional).`;

      let content: string | null = null;

      if (this.provider.geminiApiKey) {
        try {
          content = await this.provider.callGeminiText(systemPrompt, [{ role: 'user', content: userPrompt }], 1500, 0.5, true);
        } catch (geminiError: any) {
          logger.warn('[AICoach] Gemini life-coach questions failed, trying OpenAI', { error: geminiError?.message });
        }
      }

      if (!content && this.provider.visionClient) {
        const model = env.openai.model || 'gpt-4o-mini';
        const tokenLimit = this.provider.isReasoningModel(model) ? 1000 : 1500;
        const completion = await this.provider.visionClient.chat.completions.create({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          ...this.provider.getTemperatureParameter(model, 0.5),
          ...this.provider.getTokenParameter(model, tokenLimit),
          ...this.provider.getResponseFormatParameter(model),
        });
        content = completion.choices[0]?.message?.content || null;
      }

      if (!content || content.trim().length === 0) {
        logger.warn('[AICoach] Empty response for life-coach questions, using fallback');
        return this.generateFallbackLifeCoachQuestions(goalLabel, language);
      }

      const cleanContent = this.provider.stripMarkdownFences(content);

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

      let parsed: ParsedLifeCoachResponse;
      try {
        parsed = JSON.parse(cleanContent) as ParsedLifeCoachResponse;
      } catch {
        const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]) as ParsedLifeCoachResponse;
        } else {
          logger.warn('[AICoach] Failed to parse life-coach JSON, using fallback');
          return this.generateFallbackLifeCoachQuestions(goalLabel, language);
        }
      }

      const rawQuestions = parsed.questions || [];
      if (rawQuestions.length < 2) {
        return this.generateFallbackLifeCoachQuestions(goalLabel, language);
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
      logger.error('[AICoach] Error generating life-coach questions', {
        goal: request.goal,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      const goalLabel = request.customGoalText || request.goal.replace(/_/g, ' ');
      return this.generateFallbackLifeCoachQuestions(goalLabel, request.language || 'en');
    }
  }

  private generateFallbackLifeCoachQuestions(goalLabel: string, language: SupportedLanguage): LifeCoachQuestionsResponse {
    const questions: LifeCoachQuestionItem[] = language === 'ur'
      ? [
          { id: 'lc1', question: `آپ نے "${goalLabel}" کو اپنا مقصد کیوں چنا؟ آپ کی خاص وجہ کیا ہے؟`, type: 'text', goal_area: 'motivation', purpose: 'Understand specific motivation for chosen goal', placeholder: `مثال: ${goalLabel} سے متعلق...` },
          { id: 'lc2', question: 'ابھی تبدیلی کے لیے آپ کتنے پرعزم ہیں؟', type: 'cards', goal_area: 'motivation', purpose: 'Gauge motivation level', options: [{ label: '🌱 کم — میں بدلنا چاہتا ہوں لیکن شروع کرنا مشکل ہے', value: 'low' }, { label: '⚡ درمیانی — مجھے رہنمائی چاہیے', value: 'medium' }, { label: '🔥 زیادہ — میں تیار ہوں', value: 'high' }] },
          { id: 'lc3', question: `"${goalLabel}" کے لیے پہلے کیا کوشش کی جو کام نہیں آئی؟`, type: 'text', goal_area: 'past_attempts', purpose: 'Learn from past experiences', optional: true, placeholder: 'مثال: جم، ڈائیٹ...' },
          { id: 'lc4', question: 'کوئی اور زندگی کے اہداف؟', type: 'text', goal_area: 'other_goals', purpose: 'Discover additional goals', optional: true, placeholder: 'کچھ بھی جو آپ بہتر کرنا چاہتے ہیں...' },
        ]
      : [
          { id: 'lc1', question: `What specifically motivated you to choose "${goalLabel}" as your goal?`, type: 'text', goal_area: 'motivation', purpose: 'Understand specific motivation for chosen goal', placeholder: `e.g., What draws you to ${goalLabel}...` },
          { id: 'lc2', question: 'How motivated are you to make changes right now?', type: 'cards', goal_area: 'motivation', purpose: 'Gauge motivation level', options: [{ label: '🌱 Low — I want to change but struggle to start', value: 'low' }, { label: '⚡ Medium — I want to improve but need guidance', value: 'medium' }, { label: '🔥 High — I\'m ready to go all in', value: 'high' }] },
          { id: 'lc3', question: `What have you tried before for "${goalLabel}" that didn't work?`, type: 'text', goal_area: 'past_attempts', purpose: 'Learn from past experiences', optional: true, placeholder: `e.g., Apps, programs, routines related to ${goalLabel}...` },
          { id: 'lc4', question: 'Any other life goals you\'d like to work on alongside this?', type: 'text', goal_area: 'other_goals', purpose: 'Discover additional goals', optional: true, placeholder: 'e.g., Save money, pray more, read books, reduce screen time...' },
        ];

    return { questions };
  }
}
