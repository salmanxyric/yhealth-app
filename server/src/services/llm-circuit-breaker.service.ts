/**
 * @file LLM Circuit Breaker Service
 * @description Global circuit breaker for OpenAI/LLM API calls.
 *
 * When the OpenAI API returns 429 (rate limit / quota exceeded), this service
 * trips the circuit and prevents all further LLM calls for a cooldown period.
 * This avoids hammering a quota-exceeded API with thousands of doomed requests
 * from parallel jobs (proactive messaging, coaching profiles, daily analysis).
 *
 * States:
 *   CLOSED  → normal operation, calls allowed
 *   OPEN    → tripped by 429, all calls blocked for cooldown period
 *   HALF_OPEN → cooldown expired, allow ONE probe call to test if API is back
 */

import { logger } from './logger.service.js';

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

class LLMCircuitBreakerService {
  private state: CircuitState = 'CLOSED';
  private trippedAt: number = 0;
  private consecutiveFailures: number = 0;
  private probeInProgress: boolean = false;

  // Cooldown starts at 5 minutes, doubles on each consecutive trip, max 60 minutes
  private baseCooldownMs = 5 * 60 * 1000;
  private maxCooldownMs = 60 * 60 * 1000;
  private currentCooldownMs = 5 * 60 * 1000;

  /**
   * Check if an LLM call is allowed right now.
   * Returns true if the call should proceed, false if circuit is open.
   */
  isCallAllowed(): boolean {
    if (this.state === 'CLOSED') {
      return true;
    }

    const elapsed = Date.now() - this.trippedAt;

    if (elapsed >= this.currentCooldownMs) {
      // Cooldown expired — transition to HALF_OPEN, allow one probe call
      if (!this.probeInProgress) {
        this.state = 'HALF_OPEN';
        this.probeInProgress = true;
        logger.info('[LLMCircuitBreaker] Cooldown expired, allowing probe call', {
          cooldownMs: this.currentCooldownMs,
          consecutiveFailures: this.consecutiveFailures,
        });
        return true;
      }
      // Another probe is already in progress — block
      return false;
    }

    // Still in cooldown
    return false;
  }

  /**
   * Record a successful LLM call. Resets the circuit to CLOSED.
   */
  recordSuccess(): void {
    if (this.state !== 'CLOSED') {
      logger.info('[LLMCircuitBreaker] Probe succeeded, closing circuit', {
        previousState: this.state,
        consecutiveFailures: this.consecutiveFailures,
      });
    }
    this.state = 'CLOSED';
    this.consecutiveFailures = 0;
    this.probeInProgress = false;
    this.currentCooldownMs = this.baseCooldownMs;
  }

  /**
   * Record a rate limit / quota error. Trips (or re-trips) the circuit.
   */
  recordRateLimitError(error?: unknown): void {
    this.consecutiveFailures++;
    this.trippedAt = Date.now();
    this.state = 'OPEN';
    this.probeInProgress = false;

    // Exponential backoff: double cooldown on each consecutive trip, cap at max
    this.currentCooldownMs = Math.min(
      this.baseCooldownMs * Math.pow(2, this.consecutiveFailures - 1),
      this.maxCooldownMs
    );

    logger.warn('[LLMCircuitBreaker] Circuit OPEN — blocking all LLM calls', {
      consecutiveFailures: this.consecutiveFailures,
      cooldownMs: this.currentCooldownMs,
      cooldownMinutes: Math.round(this.currentCooldownMs / 60000),
      error: error instanceof Error ? error.message : undefined,
    });
  }

  /**
   * Check if an error is a rate limit / quota exceeded error.
   */
  isRateLimitError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('rate limit') ||
        message.includes('429') ||
        message.includes('quota') ||
        message.includes('too many requests') ||
        message.includes('insufficient balance') ||
        message.includes('exceeded your current quota') ||
        message.includes('402')
      );
    }
    return false;
  }

  /**
   * Get current circuit state for logging/monitoring.
   */
  getStatus(): { state: CircuitState; consecutiveFailures: number; cooldownMs: number; cooldownRemaining: number } {
    const remaining = this.state === 'OPEN'
      ? Math.max(0, this.currentCooldownMs - (Date.now() - this.trippedAt))
      : 0;

    return {
      state: this.state,
      consecutiveFailures: this.consecutiveFailures,
      cooldownMs: this.currentCooldownMs,
      cooldownRemaining: remaining,
    };
  }
}

export const llmCircuitBreaker = new LLMCircuitBreakerService();
