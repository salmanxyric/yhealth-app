/**
 * Message Type Classifier — Unit Tests
 *
 * Tests the first-stage synchronous classifier that gates messages
 * before the AI coach pipeline runs.
 */

import { messageTypeClassifier } from '../../../src/services/message-type-classifier.service.js';

describe('messageTypeClassifier.classify', () => {
  // ============================================
  // GREETINGS
  // ============================================

  describe('greetings', () => {
    it.each([
      'hi', 'hello', 'hey', 'yo', 'howdy', 'hiya',
      'good morning', 'good afternoon', 'good evening',
      'salaam', 'assalamu alaikum',
    ])('should classify "%s" as greeting', (msg) => {
      const result = messageTypeClassifier.classify(msg);
      expect(result.type).toBe('greeting');
      expect(result.isLightweight).toBe(true);
    });

    it('should classify short greeting with emoji as greeting', () => {
      const result = messageTypeClassifier.classify('hi! 👋');
      expect(result.type).toBe('greeting');
      expect(result.isLightweight).toBe(true);
    });

    it('should classify single emoji as greeting', () => {
      const result = messageTypeClassifier.classify('👋');
      expect(result.type).toBe('greeting');
      expect(result.isLightweight).toBe(true);
    });

    it('should NOT classify "hi, log my breakfast" as greeting (domain signal)', () => {
      const result = messageTypeClassifier.classify('hi, log my breakfast');
      expect(result.type).not.toBe('greeting');
      expect(result.isLightweight).toBe(false);
    });

    it('should NOT classify "hello, can you track my workout" as greeting', () => {
      const result = messageTypeClassifier.classify('hello, can you track my workout');
      expect(result.isLightweight).toBe(false);
    });
  });

  // ============================================
  // CASUAL CHAT
  // ============================================

  describe('casual chat', () => {
    it.each([
      'how are you', "how's it going", "what's up",
      'how are you doing today', "how's your day",
    ])('should classify "%s" as casual_chat', (msg) => {
      const result = messageTypeClassifier.classify(msg);
      expect(result.type).toBe('casual_chat');
      expect(result.isLightweight).toBe(true);
    });

    it('should NOT classify "how are you, I need a workout plan" as casual (domain signal)', () => {
      const result = messageTypeClassifier.classify('how are you, I need a workout plan');
      expect(result.isLightweight).toBe(false);
    });
  });

  // ============================================
  // GRATITUDE
  // ============================================

  describe('gratitude', () => {
    it.each([
      'thanks', 'thank you', 'appreciate it',
      'awesome', 'perfect', 'great', 'cool',
      'got it', 'makes sense', 'jazakallah',
    ])('should classify "%s" as gratitude', (msg) => {
      const result = messageTypeClassifier.classify(msg);
      expect(result.type).toBe('gratitude');
      expect(result.isLightweight).toBe(true);
    });

    it('should NOT classify "thanks, now show me my workout" as gratitude', () => {
      const result = messageTypeClassifier.classify('thanks, now show me my workout');
      expect(result.isLightweight).toBe(false);
    });
  });

  // ============================================
  // FOLLOW-UP
  // ============================================

  describe('follow-up', () => {
    it.each([
      'yes', 'no', 'yeah', 'sure', 'ok', 'okay',
      'do it', 'go ahead', 'continue', 'why', 'how',
      'tell me more', 'lol', 'haha',
    ])('should classify "%s" as follow_up', (msg) => {
      const result = messageTypeClassifier.classify(msg);
      expect(result.type).toBe('follow_up');
      expect(result.isLightweight).toBe(true);
    });
  });

  // ============================================
  // COMMAND
  // ============================================

  describe('command', () => {
    it.each([
      'create a workout plan',
      'add eggs to my list',
      'log my breakfast',
      'delete that meal',
      'show me my goals',
      'schedule a workout for tomorrow',
    ])('should classify "%s" as command', (msg) => {
      const result = messageTypeClassifier.classify(msg);
      expect(result.type).toBe('command');
      expect(result.isLightweight).toBe(false);
    });
  });

  // ============================================
  // DOMAIN INTENT
  // ============================================

  describe('domain intent', () => {
    it.each([
      'how much protein should I eat today',
      'what workout should I do for chest',
      'I slept 5 hours last night',
      'my recovery score is low',
      'can you analyze my nutrition this week',
    ])('should classify "%s" as domain_intent', (msg) => {
      const result = messageTypeClassifier.classify(msg);
      expect(result.type).toBe('domain_intent');
      expect(result.isLightweight).toBe(false);
    });
  });

  // ============================================
  // CRITICAL: SHORT MESSAGE SAFETY
  // ============================================

  describe('short message safety — "hi" should never route to domain', () => {
    it('should classify "hi" as greeting, not domain_intent', () => {
      const result = messageTypeClassifier.classify('hi');
      expect(result.type).toBe('greeting');
      expect(result.isLightweight).toBe(true);
    });

    it('should classify "hey" as greeting, not workouts', () => {
      const result = messageTypeClassifier.classify('hey');
      expect(result.type).toBe('greeting');
    });

    it('should classify empty string as follow_up', () => {
      const result = messageTypeClassifier.classify('');
      expect(result.type).toBe('follow_up');
    });
  });

  // ============================================
  // isLightweight helper
  // ============================================

  describe('isLightweight', () => {
    it('should return true for greeting', () => {
      expect(messageTypeClassifier.isLightweight('greeting')).toBe(true);
    });
    it('should return true for casual_chat', () => {
      expect(messageTypeClassifier.isLightweight('casual_chat')).toBe(true);
    });
    it('should return true for gratitude', () => {
      expect(messageTypeClassifier.isLightweight('gratitude')).toBe(true);
    });
    it('should return false for command', () => {
      expect(messageTypeClassifier.isLightweight('command')).toBe(false);
    });
    it('should return false for domain_intent', () => {
      expect(messageTypeClassifier.isLightweight('domain_intent')).toBe(false);
    });
  });
});
