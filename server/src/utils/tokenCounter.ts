/**
 * Token counter — estimates or measures input/output tokens for OpenAI-family
 * models. Used by the entitlement middleware to settle reservations with the
 * actual consumption reported back from the provider or measured at stream end.
 *
 * Prefer the provider's `usage` field when available (non-streaming OpenAI
 * responses include it). Fall back to tiktoken for streaming + pre-flight
 * estimation.
 *
 * Tiktoken encoders are heavy; cache them by encoding name. The handles must
 * be freed with `.free()` on shutdown, but we run one per process for the
 * lifetime so this is an acceptable leak.
 */

import { get_encoding, encoding_for_model, type TiktokenEncoding, type TiktokenModel, type Tiktoken } from 'tiktoken';
import { logger } from '../services/logger.service.js';

type EncoderName = TiktokenEncoding | 'cl100k_base';

const encoderCache = new Map<EncoderName, Tiktoken>();

function getEncoder(encoding: EncoderName = 'cl100k_base'): Tiktoken {
    const cached = encoderCache.get(encoding);
    if (cached) return cached;
    const encoder = get_encoding(encoding);
    encoderCache.set(encoding, encoder);
    return encoder;
}

/**
 * Count tokens for a single string against the cl100k_base encoding (GPT-4,
 * GPT-4o, GPT-3.5-turbo, text-embedding-ada-002). Falls back to a 4-chars-per-
 * token heuristic when tiktoken fails, which is accurate enough for budgeting.
 */
export function countTokens(input: string, encoding: EncoderName = 'cl100k_base'): number {
    if (!input) return 0;
    try {
        const encoder = getEncoder(encoding);
        const tokens = encoder.encode(input);
        const count = tokens.length;
        return count;
    } catch (err) {
        logger.warn('[tokenCounter] tiktoken failed, using heuristic', {
            error: (err as Error).message,
            encoding,
        });
        return Math.ceil(input.length / 4);
    }
}

/**
 * Count tokens for a chat messages array. Every message carries a 4-token
 * overhead per OpenAI's guidance plus a 2-token closing. Not used for
 * billing (we charge on the provider's usage field when present), but useful
 * for pre-flight reservation sizing on `consumeCredits`.
 */
export interface ChatMessage {
    role: string;
    content: string;
    name?: string;
}

export function countChatTokens(messages: ChatMessage[], encoding: EncoderName = 'cl100k_base'): number {
    let total = 0;
    for (const msg of messages) {
        total += 4; // message overhead
        total += countTokens(msg.role, encoding);
        total += countTokens(msg.content, encoding);
        if (msg.name) total += countTokens(msg.name, encoding) - 1;
    }
    total += 2; // closing
    return total;
}

/**
 * Pick the right encoding for a given OpenAI model. Unknown models fall back
 * to cl100k_base which covers everything released since GPT-3.5-turbo.
 */
export function encodingForModel(model: string): EncoderName {
    try {
        const enc = encoding_for_model(model as TiktokenModel);
        // encoding_for_model returns a Tiktoken instance, not a name. We only
        // need its identity for caching, so normalize to a string key.
        enc.free();
        return 'cl100k_base';
    } catch {
        return 'cl100k_base';
    }
}

/**
 * Rough credit estimator for a chat call, expressed in server credit units.
 * The calibration here is deliberately conservative (1 credit per 250 tokens
 * in, plus per-output-token) so reservations don't over-reserve, while the
 * settle path adjusts to the provider's real usage. Tune via feature catalog
 * `credit_cost_default`, not here.
 */
export function estimateChatCredits(params: {
    messages: ChatMessage[];
    maxOutputTokens?: number;
    creditsPerInputBucket?: number; // default 1 credit / 250 input tokens
    creditsPerOutputBucket?: number; // default 1 credit / 100 output tokens
}): number {
    const inputTokens = countChatTokens(params.messages);
    const outputTokens = params.maxOutputTokens ?? 512;
    const inBucket = params.creditsPerInputBucket ?? 250;
    const outBucket = params.creditsPerOutputBucket ?? 100;
    const inCredits = Math.ceil(inputTokens / inBucket);
    const outCredits = Math.ceil(outputTokens / outBucket);
    return Math.max(1, inCredits + outCredits);
}

/**
 * Free all cached encoders. Call from graceful-shutdown if you care about
 * the WASM heap. Normal process exit reclaims it for us.
 */
export function freeEncoders(): void {
    for (const enc of encoderCache.values()) {
        try { enc.free(); } catch { /* ignore */ }
    }
    encoderCache.clear();
}
