import { describe, expect, it } from '@jest/globals';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { finalizeProactiveCoachMessage } from '../utils/proactive-message-finalizer.js';

const root = resolve(process.cwd(), 'src');

function readSource(relativePath: string): string {
  return readFileSync(resolve(root, relativePath), 'utf8');
}

describe('AI Coach operational fixes', () => {
  it('does not use stale prompt or tool schema caches', () => {
    const source = readSource('services/langgraph-chatbot.service.ts');

    expect(source).not.toContain('systemPromptCache');
    expect(source).not.toContain('toolSchemaCache');
    expect(source).toContain('Converting tools');
  });

  it('formats streamed tool results instead of sending raw JSON deltas', () => {
    const source = readSource('services/langgraph-chatbot.service.ts');

    expect(source).toContain('formatToolResultEvent');
    expect(source).toContain('Schedule retrieved');
    expect(source).toContain('Financial report ready');
    expect(source).not.toContain('resultContent.substring(0, 100)');
  });

  it('keeps tools bound when empty Gemini responses cascade to fallback providers', () => {
    const source = readSource('services/langgraph-chatbot.service.ts');

    expect(source).toContain('const fallbackLlmWithTools = fallbackLlm.bindTools');
    expect(source).toContain('response = await fallbackLlmWithTools.invoke(messages)');
    expect(source).toContain('fallbackLlmWithTools.stream(messages)');
  });

  it('runs wiki maintenance for stored streaming and non-streaming turns', () => {
    const source = readSource('services/langgraph-chatbot.service.ts');

    expect(source).toContain('private enqueueWikiMaintenance');
    expect(source.match(/this\.enqueueWikiMaintenance\(userId, message, responseContent, activeConversationId\);/g)).toHaveLength(2);
  });

  it('guards optional entitlement shadow logging table', () => {
    const source = readSource('middlewares/entitlement.middleware.ts');

    expect(source).toContain("to_regclass('public.entitlement_shadow_log')");
    expect(source).toContain('persistShadowDenial');
  });

  it('qualifies adaptive coaching last-message query', () => {
    const source = readSource('services/adaptive-coaching-loop.service.ts');

    expect(source).toContain('SELECT MAX(rm.created_at) AS last_at');
    expect(source).not.toContain('SELECT MAX(created_at) AS last_at');
  });

  it('rejects proactive fragments even after a complete opening sentence', () => {
    const result = finalizeProactiveCoachMessage({
      message: "Hey Salman, nice work completing lunch today! It's a small",
      type: 'positive_momentum',
      fallbackMessage: 'fallback message.',
    });

    expect(result).toEqual({
      message: 'fallback message.',
      rejectedReason: 'message_too_short_for_review',
      usedFallback: true,
    });
  });

  it('preserves a complete proactive review with impact and action', () => {
    const message = 'Salman, your lunch log is a real win because it keeps your nutrition visible today. That matters because consistent tracking is what lets us adjust protein before the day gets away from you. Add your next meal when you eat so we can keep the pattern intact.';

    const result = finalizeProactiveCoachMessage({
      message,
      type: 'positive_momentum',
      fallbackMessage: 'fallback message.',
    });

    expect(result).toEqual({
      message,
      usedFallback: false,
    });
  });

  it('trims a trailing partial sentence when the remaining message is complete', () => {
    const complete = 'Salman, your active recovery has dropped to zero on your busiest days. That matters because your body needs those minutes to repair and keep your training progress moving. Take ten minutes after work for mobility before anything else.';

    const result = finalizeProactiveCoachMessage({
      message: `${complete} It is a small`,
      type: 'daily_progress_review',
      fallbackMessage: 'fallback message.',
    });

    expect(result).toEqual({
      message: complete,
      usedFallback: false,
    });
  });

  it('allows short data-gap messages only when they are complete', () => {
    const complete = finalizeProactiveCoachMessage({
      message: 'Salman, how was dinner tonight?',
      type: 'data_gap_dinner',
      fallbackMessage: 'fallback message.',
    });
    const partial = finalizeProactiveCoachMessage({
      message: 'Salman, how was',
      type: 'data_gap_dinner',
      fallbackMessage: 'fallback message.',
    });

    expect(complete).toEqual({
      message: 'Salman, how was dinner tonight?',
      usedFallback: false,
    });
    expect(partial).toEqual({
      message: 'fallback message.',
      rejectedReason: 'no_complete_sentence',
      usedFallback: true,
    });
  });
});
