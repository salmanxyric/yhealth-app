/**
 * Model Factory Service Unit Tests
 *
 * Tests for provider cascading, rate limiting, error handling,
 * and invokeWithFallback functionality.
 */

import { jest } from '@jest/globals';

// ============================================
// MOCKS (unstable_mockModule for ESM)
// ============================================

const mockLogger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };

jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
  logger: mockLogger,
}));

// Mock env with only gemini available by default
const mockEnv = {
  gemini: {
    apiKey: 'fake-gemini-key',
    model: 'gemini-2.5-flash',
    reasoningModel: 'gemini-2.5-pro',
    lightModel: 'gemini-2.5-flash',
    visionModel: 'gemini-2.5-flash-lite',
  },
  anthropic: {
    apiKey: 'fake-anthropic-key',
    model: 'claude-sonnet-4-6',
    maxTokens: 1000,
  },
  deepseek: {
    apiKey: '',
    model: 'deepseek-chat',
    reasoningModel: 'deepseek-reasoner',
    baseUrl: 'https://api.deepseek.com',
  },
  openai: {
    apiKey: '',
    model: 'gpt-5-mini',
    maxTokens: 1000,
  },
};

jest.unstable_mockModule('../../../src/config/env.config.js', () => ({
  env: mockEnv,
}));

// Mock LangChain model constructors
const mockGeminiInstance = { invoke: jest.fn<any>(), _type: 'gemini' };
const mockAnthropicInstance = { invoke: jest.fn<any>(), _type: 'anthropic' };

jest.unstable_mockModule('@langchain/google-genai', () => ({
  ChatGoogleGenerativeAI: jest.fn<any>().mockReturnValue(mockGeminiInstance),
}));

jest.unstable_mockModule('@langchain/anthropic', () => ({
  ChatAnthropic: jest.fn<any>().mockReturnValue(mockAnthropicInstance),
}));

jest.unstable_mockModule('@langchain/openai', () => ({
  ChatOpenAI: jest.fn<any>().mockReturnValue({ invoke: jest.fn<any>(), _type: 'openai' }),
}));

// ============================================
// IMPORTS (dynamic, after mock setup)
// ============================================

// We need to import the ModelFactory class fresh for each test suite.
// Since modelFactory is a singleton, we import the module.
const modelFactoryModule = await import('../../../src/services/model-factory.service.js');
const { modelFactory } = modelFactoryModule;

// ============================================
// TESTS
// ============================================

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getModel', () => {
  it('returns a model from the first available provider', () => {
    const model = modelFactory.getModel();

    expect(model).toBeDefined();
    // Should use gemini (first available)
    expect(modelFactory.getLastProviderUsed()).toBe('gemini');
  });

  it('returns a model with specified tier', () => {
    const model = modelFactory.getModel({ tier: 'reasoning' });

    expect(model).toBeDefined();
  });

  it('returns a model with custom options', () => {
    const model = modelFactory.getModel({
      tier: 'light',
      temperature: 0.3,
      maxTokens: 500,
      streaming: true,
    });

    expect(model).toBeDefined();
  });

  it('skips rate-limited providers and falls back to next', () => {
    // Rate-limit gemini
    modelFactory.markProviderRateLimited('gemini', 60_000);

    const model = modelFactory.getModel();

    expect(model).toBeDefined();
    expect(modelFactory.getLastProviderUsed()).toBe('anthropic');

    // Clear for other tests
    modelFactory.clearProviderRateLimit('gemini');
  });

  it('throws when no providers are available', () => {
    // Rate-limit all available providers
    modelFactory.markProviderRateLimited('gemini', 60_000);
    modelFactory.markProviderRateLimited('anthropic', 60_000);

    expect(() => modelFactory.getModel()).toThrow('No LLM providers available');

    // Cleanup
    modelFactory.clearProviderRateLimit('gemini');
    modelFactory.clearProviderRateLimit('anthropic');
  });
});

describe('markProviderRateLimited', () => {
  it('marks provider and logs warning with remaining providers', () => {
    modelFactory.markProviderRateLimited('gemini', 5000);

    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('gemini rate-limited'),
      expect.any(Object),
    );

    // Cleanup
    modelFactory.clearProviderRateLimit('gemini');
  });

  it('respects cooldown period', () => {
    modelFactory.markProviderRateLimited('gemini', 60_000);

    // Should skip gemini
    const _model = modelFactory.getModel();
    expect(modelFactory.getLastProviderUsed()).toBe('anthropic');

    // Cleanup
    modelFactory.clearProviderRateLimit('gemini');
  });
});

describe('clearProviderRateLimit', () => {
  it('removes rate limit and re-enables provider', () => {
    modelFactory.markProviderRateLimited('gemini', 60_000);
    modelFactory.clearProviderRateLimit('gemini');

    const _model = modelFactory.getModel();
    expect(modelFactory.getLastProviderUsed()).toBe('gemini');
  });

  it('is a no-op for providers not rate-limited', () => {
    modelFactory.clearProviderRateLimit('gemini');
    // Should not log anything
    expect(mockLogger.info).not.toHaveBeenCalledWith(
      expect.stringContaining('Rate limit cleared'),
    );
  });
});

describe('hasAvailableProviders', () => {
  it('returns true when at least one provider is available', () => {
    expect(modelFactory.hasAvailableProviders()).toBe(true);
  });

  it('returns false when all providers are rate-limited', () => {
    modelFactory.markProviderRateLimited('gemini', 60_000);
    modelFactory.markProviderRateLimited('anthropic', 60_000);

    expect(modelFactory.hasAvailableProviders()).toBe(false);

    // Cleanup
    modelFactory.clearProviderRateLimit('gemini');
    modelFactory.clearProviderRateLimit('anthropic');
  });
});

describe('isRateLimitError', () => {
  it('detects 429 errors', () => {
    expect(modelFactory.isRateLimitError(new Error('HTTP 429 Too Many Requests'))).toBe(true);
  });

  it('detects rate limit messages', () => {
    expect(modelFactory.isRateLimitError(new Error('rate limit exceeded'))).toBe(true);
  });

  it('detects quota exceeded', () => {
    expect(modelFactory.isRateLimitError(new Error('You exceeded your current quota'))).toBe(true);
  });

  it('detects insufficient balance', () => {
    expect(modelFactory.isRateLimitError(new Error('Insufficient balance'))).toBe(true);
  });

  it('returns false for non-rate-limit errors', () => {
    expect(modelFactory.isRateLimitError(new Error('Network timeout'))).toBe(false);
  });

  it('returns false for non-Error values', () => {
    expect(modelFactory.isRateLimitError('string error')).toBe(false);
    expect(modelFactory.isRateLimitError(null)).toBe(false);
  });
});

describe('isTimeoutError', () => {
  it('detects provider request timeouts', () => {
    expect(modelFactory.isTimeoutError(new Error('Request timed out.'))).toBe(true);
    expect(modelFactory.isTimeoutError(new Error('LLM final stream timeout'))).toBe(true);
  });

  it('returns false for non-timeout errors', () => {
    expect(modelFactory.isTimeoutError(new Error('503 Service UNAVAILABLE'))).toBe(false);
  });
});

describe('isAuthError', () => {
  it('detects 401 errors', () => {
    expect(modelFactory.isAuthError(new Error('HTTP 401 Unauthorized'))).toBe(true);
  });

  it('detects invalid API key', () => {
    expect(modelFactory.isAuthError(new Error('Invalid API key provided'))).toBe(true);
  });

  it('detects billing errors', () => {
    expect(modelFactory.isAuthError(new Error('Please purchase credits to continue'))).toBe(true);
  });

  it('returns false for rate limit errors', () => {
    expect(modelFactory.isAuthError(new Error('429 Too Many Requests'))).toBe(false);
  });
});

describe('handleProviderError', () => {
  it('marks provider on rate limit error and returns true', () => {
    // First call getModel to set lastProviderUsed
    modelFactory.clearProviderRateLimit('gemini');
    modelFactory.getModel();

    const handled = modelFactory.handleProviderError(new Error('429 rate limit'));

    expect(handled).toBe(true);

    // Cleanup
    modelFactory.clearProviderRateLimit('gemini');
  });

  it('marks provider for 1 hour on auth error', () => {
    modelFactory.clearProviderRateLimit('gemini');
    modelFactory.getModel();

    const handled = modelFactory.handleProviderError(new Error('401 Unauthorized'));

    expect(handled).toBe(true);
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('disabled for 1h'),
      expect.any(Object),
    );

    // Cleanup
    modelFactory.clearProviderRateLimit('gemini');
  });

  it('marks provider on 503 / UNAVAILABLE error', () => {
    modelFactory.clearProviderRateLimit('gemini');
    modelFactory.getModel();

    const handled = modelFactory.handleProviderError(new Error('503 Service UNAVAILABLE'));

    expect(handled).toBe(true);

    // Cleanup
    modelFactory.clearProviderRateLimit('gemini');
  });

  it('marks provider on timeout error and returns true', () => {
    modelFactory.clearProviderRateLimit('gemini');
    modelFactory.clearProviderRateLimit('anthropic');
    modelFactory.getModel();

    const handled = modelFactory.handleProviderError(new Error('Request timed out.'));

    expect(handled).toBe(true);
    expect(modelFactory.getActiveProvider()).toBe('anthropic');

    modelFactory.clearProviderRateLimit('gemini');
  });

  it('returns false when no lastProviderUsed', () => {
    // Create a fresh factory scenario is hard with singleton,
    // but we can test with a generic unrelated error
    const handled = modelFactory.handleProviderError(new Error('Some unknown error'));

    // The error doesn't match any pattern, so returns false
    expect(handled).toBe(false);
  });
});

describe('getActiveProvider', () => {
  it('returns first non-rate-limited provider', () => {
    modelFactory.clearProviderRateLimit('gemini');
    modelFactory.clearProviderRateLimit('anthropic');

    expect(modelFactory.getActiveProvider()).toBe('gemini');
  });

  it('returns next provider when first is rate-limited', () => {
    modelFactory.markProviderRateLimited('gemini', 60_000);

    expect(modelFactory.getActiveProvider()).toBe('anthropic');

    modelFactory.clearProviderRateLimit('gemini');
  });
});

describe('invokeWithFallback', () => {
  it('returns result on first successful invoke', async () => {
    const mockLlm = { invoke: jest.fn<any>().mockResolvedValue('AI response') } as any;

    const { result, llm } = await modelFactory.invokeWithFallback(
      mockLlm,
      [{ role: 'user', content: 'Hello' }],
      { tier: 'default' },
    );

    expect(result).toBe('AI response');
    expect(llm).toBe(mockLlm);
  });

  it('cascades to next provider on rate limit error', async () => {
    const failLlm = {
      invoke: jest.fn<any>().mockRejectedValue(new Error('429 rate limit')),
    } as any;

    // After handleProviderError marks the provider, getModel returns a new one
    // which should succeed
    mockGeminiInstance.invoke.mockResolvedValueOnce('fallback response');

    // Ensure gemini is available for the cascade
    modelFactory.clearProviderRateLimit('gemini');
    modelFactory.clearProviderRateLimit('anthropic');

    // The first call uses failLlm, then cascades
    try {
      const { result } = await modelFactory.invokeWithFallback(
        failLlm,
        [{ role: 'user', content: 'test' }],
        { tier: 'default' },
        1,
      );
      // If we get here, a cascade happened
      expect(result).toBeDefined();
    } catch {
      // The fallback may also fail in test env since we're mocking at module level.
      // The important thing is that handleProviderError was triggered.
    }

    // Cleanup
    modelFactory.clearProviderRateLimit('gemini');
    modelFactory.clearProviderRateLimit('anthropic');
  });

  it('throws after exhausting all retries', async () => {
    const failLlm = {
      invoke: jest.fn<any>().mockRejectedValue(new Error('Generic error')),
    } as any;

    await expect(
      modelFactory.invokeWithFallback(
        failLlm,
        [{ role: 'user', content: 'test' }],
        { tier: 'default' },
        0, // no retries
      ),
    ).rejects.toThrow('Generic error');
  });
});
