import { logger } from './logger.service.js';
import {
  DEFAULT_PERSONA_DIRECTIVE,
  type EmotionalContext,
  type PersonaDirective,
  type SiaPersonaType,
  type TopicClassification,
} from '@shared/types/domain/emotional-intelligence.js';

const MAX_TRANSITION_SHIFT = 0.3;
const ANCHOR_TURNS = 10;
const ANCHOR_MAX_SHIFT = 0.2;

function persona(
  type: SiaPersonaType,
  overrides: Partial<PersonaDirective> = {},
): PersonaDirective {
  return { ...DEFAULT_PERSONA_DIRECTIVE, primaryPersona: type, blendWeight: 1.0, ...overrides };
}

function blend(
  primary: SiaPersonaType,
  secondary: SiaPersonaType,
  primaryWeight: number,
  overrides: Partial<PersonaDirective> = {},
): PersonaDirective {
  return {
    ...DEFAULT_PERSONA_DIRECTIVE,
    primaryPersona: primary,
    blendWeight: primaryWeight,
    secondaryPersona: secondary,
    secondaryWeight: 1.0 - primaryWeight,
    ...overrides,
  };
}

class PersonaSelectorService {
  private history: Array<{ persona: SiaPersonaType; timestamp: number }> = [];

  select(ctx: EmotionalContext, topic: TopicClassification): PersonaDirective {
    const raw = this.selectRaw(ctx, topic);
    const smoothed = this.applyTransitionSmoothing(raw);

    this.history.push({ persona: smoothed.primaryPersona, timestamp: Date.now() });
    if (this.history.length > 20) this.history.shift();

    logger.debug('[PersonaSelector] Selected persona', {
      primary: smoothed.primaryPersona,
      secondary: smoothed.secondaryPersona,
      blendWeight: smoothed.blendWeight,
      topic: topic.domain,
    });

    return smoothed;
  }

  resetTransitionState(): void {
    this.history = [];
  }

  private selectRaw(ctx: EmotionalContext, topic: TopicClassification): PersonaDirective {
    // Crisis override
    if (ctx.riskLevel === 'critical') {
      return blend('emotional_recovery', 'therapist', 0.8, {
        shouldEscalate: true,
        warmthLevel: 10,
        challengeLevel: 0,
        responseLength: 'standard',
        openingStyle: 'acknowledge_first',
        avoid: ['generic_motivation', 'toxic_positivity', 'premature_solutions'],
      });
    }

    if (ctx.riskLevel === 'high') {
      return blend('emotional_recovery', 'therapist', 0.7, {
        shouldEscalate: true,
        warmthLevel: 9,
        challengeLevel: 0,
        responseLength: 'standard',
        openingStyle: 'acknowledge_first',
        avoid: ['generic_motivation', 'toxic_positivity', 'premature_solutions'],
      });
    }

    // Emotional shutdown
    if (ctx.hiddenStates.includes('emotional_shutdown')) {
      return persona('deep_listener', {
        responseLength: 'minimal',
        challengeLevel: 0,
        warmthLevel: 9,
        questionDensity: 'none',
        vulnerabilityTolerance: 0,
        openingStyle: 'silence_then_speak',
        closingStyle: 'none',
        avoid: ['unsolicited_advice', 'premature_solutions', 'generic_motivation'],
      });
    }

    // Self-sabotage (3+ occurrences, not high risk)
    if (ctx.isSelfSabotaging && (ctx.riskLevel === 'none' || ctx.riskLevel === 'low')) {
      return persona('brutal_accountability', {
        challengeLevel: 8,
        warmthLevel: 4,
        shouldConfirm: true,
        questionDensity: 'one',
        vulnerabilityTolerance: 6,
        openingStyle: 'insight_first',
        closingStyle: 'action_item',
        avoid: ['toxic_positivity', 'minimizing_feelings'],
      });
    }

    // Multiple hidden states or shame
    if (ctx.hiddenStates.length >= 2 || ctx.primaryEmotion === 'shame') {
      return persona('therapist', {
        warmthLevel: 8,
        challengeLevel: 2,
        shouldUseMCQ: true,
        vulnerabilityTolerance: 7,
        questionDensity: 'one',
        openingStyle: 'acknowledge_first',
        closingStyle: 'reflection_prompt',
        avoid: ['unsolicited_advice', 'premature_solutions'],
      });
    }

    // Cognitive overload
    if (ctx.cognitiveLoad === 'overloaded') {
      return persona('calm_mentor', {
        responseLength: 'concise',
        structureLevel: 9,
        challengeLevel: 1,
        warmthLevel: 7,
        questionDensity: 'none',
        openingStyle: 'acknowledge_first',
        closingStyle: 'action_item',
        avoid: ['information_dumps', 'multiple_options'],
      });
    }

    // Topic-based selection (low emotional intensity)
    if (ctx.emotionalIntensity < 40) {
      const topicPersona = this.selectByTopic(topic);
      if (topicPersona) return topicPersona;
    }

    // Needs-based fallback
    if (ctx.needsEmpathy && !ctx.needsChallenge) {
      return persona('therapist', { warmthLevel: 8, challengeLevel: 2 });
    }
    if (ctx.needsChallenge && !ctx.needsEmpathy) {
      return persona('performance_coach', { challengeLevel: 7, warmthLevel: 4 });
    }
    if (ctx.needsEmpathy && ctx.needsChallenge) {
      return blend('therapist', 'brutal_accountability', 0.6, {
        warmthLevel: 6,
        challengeLevel: 6,
      });
    }
    if (ctx.needsStructure) {
      return persona('calm_mentor', { structureLevel: 9 });
    }

    // Default
    return persona('calm_mentor', { warmthLevel: 6, challengeLevel: 4 });
  }

  private selectByTopic(topic: TopicClassification): PersonaDirective | null {
    switch (topic.domain) {
      case 'career':
        if (topic.subtype === 'founder') {
          return persona('founder_advisor', { structureLevel: 7, challengeLevel: 5 });
        }
        return persona('strategic_advisor', { structureLevel: 9, challengeLevel: 5 });

      case 'fitness':
      case 'health':
      case 'nutrition':
      case 'sleep':
        return persona('wellness_strategist', {
          structureLevel: 7,
          warmthLevel: 6,
          closingStyle: 'action_item',
        });

      case 'productivity':
        return persona('performance_coach', {
          responseLength: 'concise',
          structureLevel: 8,
          challengeLevel: 6,
        });

      case 'spirituality':
      case 'meaning':
      case 'purpose':
        return persona('reflective_philosopher', {
          responseLength: 'expansive',
          questionDensity: 'one',
          closingStyle: 'reflection_prompt',
          avoid: ['premature_solutions', 'unsolicited_advice'],
        });

      case 'finance':
        return persona('strategic_advisor', {
          structureLevel: 9,
          avoid: ['specific_investment_advice'],
        });

      default:
        return null;
    }
  }

  private applyTransitionSmoothing(incoming: PersonaDirective): PersonaDirective {
    if (this.history.length === 0) return incoming;

    const lastPersona = this.history[this.history.length - 1].persona;

    if (incoming.shouldEscalate) return incoming;
    if (incoming.primaryPersona === lastPersona) return incoming;

    let consecutiveCount = 0;
    for (let i = this.history.length - 1; i >= 0; i--) {
      if (this.history[i].persona === lastPersona) consecutiveCount++;
      else break;
    }

    const maxShift = consecutiveCount >= ANCHOR_TURNS ? ANCHOR_MAX_SHIFT : MAX_TRANSITION_SHIFT;

    if (consecutiveCount >= 3) {
      return blend(incoming.primaryPersona, lastPersona, 1.0 - maxShift, {
        ...incoming,
        blendWeight: 1.0 - maxShift,
        secondaryWeight: maxShift,
      });
    }

    return incoming;
  }
}

export const personaSelectorService = new PersonaSelectorService();
