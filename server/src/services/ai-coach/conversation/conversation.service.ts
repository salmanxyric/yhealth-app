import { env } from '../../../config/env.config.js';
import { logger } from '../../logger.service.js';
import { ApiError } from '../../../utils/ApiError.js';
import { query } from '../../../config/database.config.js';
import { langGraphChatbotService } from '../../langgraph-chatbot.service.js';
import type { AIProvider } from '../core/ai-provider.js';
import { goalDescriptions } from '../core/goal-context.js';
import type {
  GoalCategory,
  SupportedLanguage,
  ConversationPhase,
  ConversationContext,
  ChatMessage,
  ExtractedInsight,
  AICoachResponse,
} from '../types/index.js';

export class ConversationService {
  constructor(private provider: AIProvider) {}

  async getUserName(userId: string): Promise<string | null> {
    try {
      const result = await query<{ first_name: string | null; last_name: string | null }>(
        `SELECT first_name, last_name FROM users WHERE id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      const parts = [row.first_name, row.last_name].filter(Boolean);
      return parts.length > 0 ? parts.join(' ') : null;
    } catch (error) {
      logger.error('[AICoach] Error getting user name', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  async generateOpeningMessage(
    goal: GoalCategory,
    userName?: string,
    language?: SupportedLanguage,
    userId?: string,
    isOnboarding?: boolean
  ): Promise<AICoachResponse> {
    try {
      let message: string;

      if (isOnboarding) {
        logger.debug('[AICoach] Generating onboarding question', {
          goal,
          userName,
          language,
        });
        message = this.generateOnboardingQuestion(goal, userName, language);
      } else {
        const shouldUsePersonalizedGreeting = userId &&
          langGraphChatbotService &&
          typeof langGraphChatbotService.generateGreeting === 'function';

        if (shouldUsePersonalizedGreeting) {
          try {
            message = await langGraphChatbotService.generateGreeting(
              userId,
              goal,
              language || 'en'
            );

            if (!message || message.trim().length === 0) {
              throw new Error('Empty greeting received');
            }
          } catch (langGraphError) {
            const errorMessage = langGraphError instanceof Error ? langGraphError.message : String(langGraphError);
            logger.warn('[AICoach] LangGraph greeting generation failed, using fallback', {
              userId,
              goal,
              error: errorMessage,
            });
            message = this.generateFallbackGreeting(goal, userName, language);
          }
        } else {
          logger.debug('[AICoach] Using fallback greeting', {
            hasUserId: !!userId,
            hasService: !!langGraphChatbotService,
            hasMethod: langGraphChatbotService && typeof langGraphChatbotService.generateGreeting === 'function',
          });
          message = this.generateFallbackGreeting(goal, userName, language);
        }
      }

      return {
        message,
        phase: 'opening',
        insights: [],
        isComplete: false,
        suggestedActions: [],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('[AICoach] Error generating opening message', {
        goal,
        userName,
        language,
        userId,
        isOnboarding,
        error: errorMessage,
      });

      const fallbackMessage = isOnboarding
        ? this.generateOnboardingQuestion(goal, userName, language)
        : this.generateFallbackGreeting(goal, userName, language);

      return {
        message: fallbackMessage,
        phase: 'opening',
        insights: [],
        isComplete: false,
        suggestedActions: [],
      };
    }
  }

  private generateOnboardingQuestion(
    goal: GoalCategory,
    userName?: string,
    language?: SupportedLanguage
  ): string {
    if (language === 'ur') {
      const questions: Record<string, string> = {
        weight_loss: userName
          ? `${userName}، آپ وزن کم کرنے کا فیصلہ کیوں کیا؟ کیا کوئی خاص واقعہ یا وجہ ہے جس نے آپ کو متاثر کیا؟`
          : `آپ وزن کم کرنے کا فیصلہ کیوں کیا؟ کیا کوئی خاص واقعہ یا وجہ ہے جس نے آپ کو متاثر کیا؟`,
        muscle_building: userName
          ? `${userName}، آپ پٹھے بنانے کی کوشش کیوں کر رہے ہیں؟ آپ کا موجودہ فٹنس لیول کیا ہے؟`
          : `آپ پٹھے بنانے کی کوشش کیوں کر رہے ہیں؟ آپ کا موجودہ فٹنس لیول کیا ہے؟`,
        sleep_improvement: userName
          ? `${userName}، آپ کی نیند میں کیا مسائل ہیں؟ آپ عام طور پر کتنے گھنٹے سوتے ہیں؟`
          : `آپ کی نیند میں کیا مسائل ہیں؟ آپ عام طور پر کتنے گھنٹے سوتے ہیں؟`,
        stress_wellness: userName
          ? `${userName}، آپ کو تناؤ کب سب سے زیادہ محسوس ہوتا ہے؟ آپ اسے کیسے مینج کرتے ہیں؟`
          : `آپ کو تناؤ کب سب سے زیادہ محسوس ہوتا ہے؟ آپ اسے کیسے مینج کرتے ہیں؟`,
        energy_productivity: userName
          ? `${userName}، آپ کی توانائی کا لیول دن میں کب سب سے زیادہ ہوتا ہے؟ کیا چیزیں آپ کو تھکا دیتی ہیں؟`
          : `آپ کی توانائی کا لیول دن میں کب سب سے زیادہ ہوتا ہے؟ کیا چیزیں آپ کو تھکا دیتی ہیں؟`,
        event_training: userName
          ? `${userName}، آپ کس قسم کے ایونٹ کے لیے ٹریننگ کر رہے ہیں؟ ایونٹ کب ہے اور آپ کا موجودہ فٹنس لیول کیا ہے؟`
          : `آپ کس قسم کے ایونٹ کے لیے ٹریننگ کر رہے ہیں؟ ایونٹ کب ہے اور آپ کا موجودہ فٹنس لیول کیا ہے؟`,
        health_condition: userName
          ? `${userName}، آپ کس قسم کی صحت کی حالت کا انتظام کر رہے ہیں؟ یہ آپ کی روزمرہ زندگی کو کیسے متاثر کرتا ہے؟`
          : `آپ کس قسم کی صحت کی حالت کا انتظام کر رہے ہیں؟ یہ آپ کی روزمرہ زندگی کو کیسے متاثر کرتا ہے؟`,
        habit_building: userName
          ? `${userName}، آپ کون سا عادت بنانا چاہتے ہیں؟ آپ نے پہلے کبھی یہ عادت بنانے کی کوشش کی ہے؟`
          : `آپ کون سا عادت بنانا چاہتے ہیں؟ آپ نے پہلے کبھی یہ عادت بنانے کی کوشش کی ہے؟`,
        overall_optimization: userName
          ? `${userName}، آپ کی صحت کا کون سا پہلو سب سے زیادہ بہتری چاہتا ہے؟ آپ کیا تبدیلیاں کرنے کے لیے تیار ہیں؟`
          : `آپ کی صحت کا کون سا پہلو سب سے زیادہ بہتری چاہتا ہے؟ آپ کیا تبدیلیاں کرنے کے لیے تیار ہیں؟`,
        custom: userName
          ? `${userName}، آپ کا صحت کا بنیادی مقصد کیا ہے؟ آپ کیا تبدیلیاں کرنا چاہتے ہیں؟`
          : `آپ کا صحت کا بنیادی مقصد کیا ہے؟ آپ کیا تبدیلیاں کرنا چاہتے ہیں؟`,
      };
      return questions[goal] || (userName ? `${userName}، آپ کیا تبدیلیاں کرنا چاہتے ہیں؟` : `آپ کیا تبدیلیاں کرنا چاہتے ہیں؟`);
    }

    const questions: Record<string, string> = {
      weight_loss: userName
        ? `Hi ${userName}! I'd love to understand your motivation better. What made you decide to focus on weight loss? Was there a specific moment or reason that inspired you?`
        : `I'd love to understand your motivation better. What made you decide to focus on weight loss? Was there a specific moment or reason that inspired you?`,
      muscle_building: userName
        ? `Hey ${userName}! Let's talk about your muscle building goals. What's driving you to build muscle, and what's your current fitness level?`
        : `Let's talk about your muscle building goals. What's driving you to build muscle, and what's your current fitness level?`,
      sleep_improvement: userName
        ? `Hi ${userName}! Sleep is so important for overall health. What specific sleep challenges are you facing? How many hours of sleep do you typically get each night?`
        : `Sleep is so important for overall health. What specific sleep challenges are you facing? How many hours of sleep do you typically get each night?`,
      stress_wellness: userName
        ? `Hey ${userName}! Stress management is crucial. When do you feel most stressed in your daily life, and how do you currently handle it?`
        : `Stress management is crucial. When do you feel most stressed in your daily life, and how do you currently handle it?`,
      energy_productivity: userName
        ? `Hi ${userName}! Let's talk about your energy levels. When during the day do you feel most energized, and what tends to drain your energy?`
        : `Let's talk about your energy levels. When during the day do you feel most energized, and what tends to drain your energy?`,
      event_training: userName
        ? `Hey ${userName}! Exciting that you're training for an event! What type of event are you preparing for, when is it, and what's your current fitness level?`
        : `Exciting that you're training for an event! What type of event are you preparing for, when is it, and what's your current fitness level?`,
      health_condition: userName
        ? `Hi ${userName}! I'm here to support your health journey. What health condition are you managing, and how does it affect your daily life?`
        : `I'm here to support your health journey. What health condition are you managing, and how does it affect your daily life?`,
      habit_building: userName
        ? `Hey ${userName}! Building healthy habits is powerful. What specific habit are you looking to build, and have you tried building it before?`
        : `Building healthy habits is powerful. What specific habit are you looking to build, and have you tried building it before?`,
      overall_optimization: userName
        ? `Hi ${userName}! Let's optimize your health holistically. Which aspect of your health needs the most improvement, and what changes are you ready to make?`
        : `Let's optimize your health holistically. Which aspect of your health needs the most improvement, and what changes are you ready to make?`,
      custom: userName
        ? `Hey ${userName}! I'd love to understand your goals better. What's your primary health goal, and what changes would you like to make?`
        : `I'd love to understand your goals better. What's your primary health goal, and what changes would you like to make?`,
    };

    return questions[goal] || (userName ? `Hi ${userName}! What changes would you like to make?` : `What changes would you like to make?`);
  }

  private generateFallbackGreeting(
    goal: GoalCategory,
    userName?: string,
    language?: SupportedLanguage
  ): string {
    if (language === 'ur') {
      if (userName) {
        return `السلام علیکم ${userName}! میں آپ کی ${goal} کے لیے مدد کرنے کے لیے یہاں ہوں۔ آج آپ کیا کرنا چاہیں گے؟`;
      } else {
        return `السلام علیکم! میں آپ کی ${goal} کے لیے مدد کرنے کے لیے یہاں ہوں۔ آج آپ کیا کرنا چاہیں گے؟`;
      }
    }

    if (userName) {
      const goalMessages: Record<string, string> = {
        weight_loss: `Hey ${userName}! Ready to start your weight loss journey? Let's create a plan that works for you.`,
        muscle_building: `Hey ${userName}! Let's build some muscle together. What's your current fitness level?`,
        sleep_improvement: `Hey ${userName}! Sleep is so important. Let's work on improving your rest.`,
        stress_wellness: `Hey ${userName}! Managing stress is key to overall wellness. How are you feeling today?`,
        energy_productivity: `Hey ${userName}! Let's boost your energy and productivity. What's been draining you lately?`,
        event_training: `Hey ${userName}! Got an event coming up? Let's get you ready!`,
        health_condition: `Hey ${userName}! I'm here to support your health journey. What would you like to focus on?`,
        habit_building: `Hey ${userName}! Building good habits is the foundation of success. What habit are we working on?`,
        overall_optimization: `Hey ${userName}! Let's optimize your overall health and wellness. Where should we start?`,
        custom: `Hey ${userName}! I'm here to help you reach your goals. What are we working on today?`,
      };

      return goalMessages[goal] || `Hey ${userName}! I'm here to help you with your ${goal} goal. What would you like to focus on today?`;
    } else {
      return `Hey! I'm here to help you with your ${goal} goal. What would you like to focus on today?`;
    }
  }

  async generateResponse(
    context: ConversationContext,
    history?: ChatMessage[],
    message?: string
  ): Promise<AICoachResponse> {
    try {
      if (!context.userId || !message) {
        throw ApiError.badRequest('userId and message are required');
      }

      let phase: ConversationPhase = context.phase || 'opening';
      if (context.messageCount) {
        if (context.messageCount < 3) {
          phase = 'opening';
        } else if (context.messageCount < 10) {
          phase = 'exploration';
        } else {
          phase = 'deep_dive';
        }
      }

      if (context.isOnboarding) {
        return this.generateOnboardingResponse(context, history || [], message, phase);
      }

      const response = await langGraphChatbotService.chat({
        userId: context.userId,
        message,
        conversationId: undefined,
        callPurpose: context.goal || undefined,
        language: context.language || 'en',
      });

      const insights: ExtractedInsight[] = [];
      const isComplete = context.messageCount && context.messageCount > 20 ? true : false;

      return {
        message: response.response || 'I understand. How can I help you further?',
        phase,
        insights,
        isComplete,
        suggestedActions: [],
      };
    } catch (error) {
      logger.error('[AICoach] Error generating response', {
        userId: context.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      return {
        message: "I'm here to help you with your health and fitness goals. What would you like to work on today?",
        phase: context.phase || 'opening',
        insights: [],
        isComplete: false,
        suggestedActions: [],
      };
    }
  }

  private async generateOnboardingResponse(
    context: ConversationContext,
    history: ChatMessage[],
    message: string,
    phase: ConversationPhase
  ): Promise<AICoachResponse> {
    const goal = context.goal || 'custom';
    const language = context.language || 'en';
    const userCount = context.messageCount || 0;
    const targetMessages = 6;
    const isComplete = userCount >= targetMessages;

    const goalDesc = goalDescriptions[goal] || goalDescriptions.custom;

    const languageInstruction = language === 'ur'
      ? 'CRITICAL: Respond in Urdu (اردو) using Urdu script. Sound like a real Urdu-speaking friend.'
      : 'Respond in English. Sound like a friendly, casual life coach.';

    const systemPrompt = `You are a life coaching assessment specialist. You are conducting a brief onboarding assessment about ${goalDesc}.

${languageInstruction}

Your job is to:
1. Acknowledge the user's answer briefly and warmly (1 short sentence)
2. Ask ONE follow-up question to learn more about their situation
3. Focus on understanding: current habits, challenges, motivation, lifestyle, and preferences

Phase: ${phase} (${userCount}/${targetMessages} questions asked)
${isComplete ? 'IMPORTANT: This is the final response. Summarize what you learned and thank the user. Do NOT ask another question.' : ''}

Guidelines:
- Keep responses SHORT (2-3 sentences max)
- Be conversational and warm, not clinical
- Ask specific, focused questions (not open-ended)
- Each question should cover a different topic area
- Do NOT use tools, do NOT reference workouts/meals/data - this is a fresh assessment`;

    const recentHistory = history.slice(-6).map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    try {
      let responseText = '';

      if (this.provider.geminiApiKey) {
        try {
          const allMessages = [
            ...recentHistory,
            { role: 'user' as const, content: message },
          ];
          responseText = await this.provider.callGeminiText(systemPrompt, allMessages, 200, 0.7);
        } catch (geminiError: any) {
          logger.warn('[AICoach] Gemini assessment failed, trying OpenAI', { error: geminiError?.message });
        }
      }

      if (!responseText && this.provider.visionClient) {
        const model = env.openai.model || 'gpt-4o-mini';
        const completion = await this.provider.visionClient.chat.completions.create({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            ...recentHistory,
            { role: 'user', content: message },
          ],
          ...this.provider.getTemperatureParameter(model, 0.7),
          ...this.provider.getTokenParameter(model, 200),
        });
        responseText = completion.choices[0]?.message?.content?.trim() || '';
      }

      if (!responseText) {
        throw new Error('Empty response from all AI providers');
      }

      const insights: ExtractedInsight[] = [{
        category: goal,
        text: message.substring(0, 200),
        confidence: 0.8,
      }];

      return {
        message: responseText,
        phase,
        insights,
        isComplete,
        suggestedActions: [],
      };
    } catch (error) {
      logger.warn('[AICoach] Onboarding response generation failed, using fallback', {
        error: error instanceof Error ? error.message : 'Unknown error',
        goal,
        phase,
      });

      const fallbackMessage = isComplete
        ? "Thank you for sharing all of that! I have a great understanding of where you're at. Let's move on to creating your personalized plan."
        : "Thanks for sharing that! Can you tell me a bit more about your daily routine and what challenges you face?";

      return {
        message: fallbackMessage,
        phase,
        insights: [],
        isComplete,
        suggestedActions: [],
      };
    }
  }
}
