/**
 * Shared OpenAI token-parameter helpers.
 * Newer models (o1, o3, gpt-5.*) require `max_completion_tokens`
 * instead of the legacy `max_tokens` parameter.
 */

export function requiresMaxCompletionTokens(model: string): boolean {
  const m = model.toLowerCase();
  return m.startsWith('o1') || m.startsWith('o3') || m.startsWith('gpt-5');
}

export function getTokenParameter(
  model: string,
  maxTokens: number,
): { max_tokens?: number; max_completion_tokens?: number } {
  if (requiresMaxCompletionTokens(model)) {
    return { max_completion_tokens: maxTokens };
  }
  return { max_tokens: maxTokens };
}
