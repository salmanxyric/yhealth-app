import OpenAI from 'openai';
import { env } from '../../../config/env.config.js';
import { logger } from '../../logger.service.js';
import { modelFactory } from '../../model-factory.service.js';

export class AIProvider {
  visionClient: OpenAI | null = null;
  geminiApiKey: string | null = null;

  constructor() {
    this.initializeVisionClient();
  }

  private initializeVisionClient(): void {
    if (env.gemini.apiKey) {
      this.geminiApiKey = env.gemini.apiKey;
      logger.info('[AICoach] Gemini vision available (primary)');
    }

    if (env.openai.apiKey) {
      try {
        this.visionClient = new OpenAI({
          apiKey: env.openai.apiKey,
          timeout: 30000,
          maxRetries: 0,
        });
        logger.info('[AICoach] OpenAI vision client initialized (fallback)');
      } catch (error) {
        logger.warn('[AICoach] Failed to initialize OpenAI Vision client', { error });
      }
    }
  }

  isAvailable(): boolean {
    return this.geminiApiKey !== null || this.visionClient !== null;
  }

  stripMarkdownFences(text: string): string {
    const trimmed = text.trim();
    if (trimmed.startsWith('```')) {
      return trimmed.replace(/^```(?:json|javascript|ts)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }
    return trimmed;
  }

  repairJSON(text: string): string {
    let s = text;
    // Strip comments
    s = s.replace(/\/\/[^\n]*/g, '');
    s = s.replace(/\/\*[\s\S]*?\*\//g, '');
    // Remove trailing commas
    s = s.replace(/,\s*([}\]])/g, '$1');
    // Fix unescaped newlines inside strings
    s = s.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, (match) => {
      return match.replace(/(?<!\\)\n/g, '\\n');
    });

    // Close unclosed strings, then close brackets/braces for truncated JSON
    const stack: string[] = [];
    let inStr = false;
    let esc = false;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (esc) { esc = false; continue; }
      if (ch === '\\' && inStr) { esc = true; continue; }
      if (ch === '"') { inStr = !inStr; continue; }
      if (inStr) continue;
      if (ch === '{' || ch === '[') stack.push(ch);
      else if (ch === '}' || ch === ']') stack.pop();
    }

    if (inStr || stack.length > 0) {
      // Close an unclosed string
      if (inStr) s += '"';
      // Remove trailing partial element after last complete value
      s = s.replace(/,\s*"[^"]*"?\s*:?\s*"?[^"]*$/, '');
      s = s.replace(/,\s*\{[^}]*$/, '');
      s = s.replace(/,\s*$/, '');
      // Recount after trimming
      const closeStack: string[] = [];
      let inStr2 = false;
      let esc2 = false;
      for (let i = 0; i < s.length; i++) {
        const ch = s[i];
        if (esc2) { esc2 = false; continue; }
        if (ch === '\\' && inStr2) { esc2 = true; continue; }
        if (ch === '"') { inStr2 = !inStr2; continue; }
        if (inStr2) continue;
        if (ch === '{') closeStack.push('}');
        else if (ch === '[') closeStack.push(']');
        else if (ch === '}' || ch === ']') closeStack.pop();
      }
      if (inStr2) s += '"';
      while (closeStack.length > 0) s += closeStack.pop();
    }

    return s;
  }

  requiresMaxCompletionTokens(model: string): boolean {
    const modelLower = model.toLowerCase();
    return (
      modelLower.startsWith('o1') ||
      modelLower.startsWith('o3') ||
      modelLower.startsWith('gpt-4o') ||
      modelLower.startsWith('gpt-5')
    );
  }

  isReasoningModel(model: string): boolean {
    const modelLower = model.toLowerCase();
    return modelLower.startsWith('o1') || modelLower.startsWith('o3') || modelLower.startsWith('gpt-5');
  }

  getTokenParameter(model: string, maxTokens: number): { max_tokens?: number; max_completion_tokens?: number } {
    const adjustedTokens = this.isReasoningModel(model) ? maxTokens * 4 : maxTokens;
    if (this.requiresMaxCompletionTokens(model)) {
      return { max_completion_tokens: adjustedTokens };
    }
    return { max_tokens: adjustedTokens };
  }

  supportsCustomTemperature(model: string): boolean {
    const modelLower = model.toLowerCase();
    if (modelLower.includes('mini')) return true;
    const restrictedModels = ['gpt-4o', 'gpt-5'];
    return !restrictedModels.some(prefix => modelLower.startsWith(prefix));
  }

  getTemperatureParameter(model: string, temperature: number): { temperature?: number } {
    if (this.supportsCustomTemperature(model)) {
      return { temperature };
    }
    return {};
  }

  supportsResponseFormat(_model: string): boolean {
    return true;
  }

  getResponseFormatParameter(model: string): { response_format?: { type: 'json_object' } } {
    if (this.supportsResponseFormat(model)) {
      return { response_format: { type: 'json_object' } };
    }
    return {};
  }

  async callGeminiVision(
    systemPrompt: string,
    promptText: string,
    imageDataUrl: string,
    maxTokens: number,
    jsonMode: boolean = false,
  ): Promise<string> {
    if (modelFactory.isProviderRateLimited('gemini')) {
      throw new Error('Gemini is currently rate-limited in ModelFactory');
    }
    const VISION_MODELS = [env.gemini.model || 'gemini-2.5-flash', 'gemini-2.5-flash-lite'];

    let inlineData: { mimeType: string; data: string } | undefined;

    if (imageDataUrl.startsWith('data:')) {
      const match = imageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) throw new Error('Invalid data URL format');
      inlineData = { mimeType: match[1], data: match[2] };
    } else {
      const imgResp = await fetch(imageDataUrl);
      if (!imgResp.ok) throw new Error(`Failed to fetch image: ${imgResp.status}`);
      const buf = Buffer.from(await imgResp.arrayBuffer());
      const contentType = imgResp.headers.get('content-type') || 'image/jpeg';
      inlineData = { mimeType: contentType, data: buf.toString('base64') };
    }

    const body: Record<string, unknown> = {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{
        parts: [
          { inlineData },
          { text: promptText },
        ],
      }],
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: 0.4,
        ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
        thinkingConfig: { thinkingBudget: 0 },
      },
    };

    let lastError: Error | null = null;
    for (const model of VISION_MODELS) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.geminiApiKey}`;

      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        if ((resp.status === 503 || resp.status === 429) && model !== VISION_MODELS[VISION_MODELS.length - 1]) {
          logger.warn(`[AICoach] Gemini vision ${model} returned ${resp.status}, trying fallback`, { model, fallback: VISION_MODELS[VISION_MODELS.indexOf(model) + 1] });
          lastError = new Error(`Gemini vision error (${resp.status}): ${errText}`);
          continue;
        }
        throw new Error(`Gemini vision error (${resp.status}): ${errText}`);
      }

      lastError = null;

      const data = await resp.json() as {
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string; thought?: boolean }> };
          finishReason?: string;
        }>;
        promptFeedback?: { blockReason?: string };
      };

      if (data.promptFeedback?.blockReason) {
        logger.warn('[AICoach] Gemini vision blocked by safety filter', { blockReason: data.promptFeedback.blockReason });
        throw new Error(`Gemini vision blocked: ${data.promptFeedback.blockReason}`);
      }

      const candidate = data.candidates?.[0];
      if (candidate?.finishReason === 'SAFETY') {
        logger.warn('[AICoach] Gemini vision response blocked by safety', { finishReason: candidate.finishReason });
        throw new Error('Gemini vision response blocked by safety filter');
      }

      const text = (candidate?.content?.parts || []).filter(p => !p.thought && p.text).map(p => p.text).join('').trim();
      if (!text) {
        logger.warn('[AICoach] Gemini vision returned empty content', {
          hasCandidates: !!data.candidates?.length,
          finishReason: candidate?.finishReason,
          responseKeys: Object.keys(data),
        });
        throw new Error('Gemini vision returned empty response');
      }
      return text;
    }

    throw lastError || new Error('All Gemini vision models failed');
  }

  async callGeminiText(
    systemPrompt: string,
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    maxTokens?: number,
    temperature = 0.7,
    jsonMode = false,
  ): Promise<string> {
    if (!this.geminiApiKey) throw new Error('Gemini API key not available');
    if (modelFactory.isProviderRateLimited('gemini')) {
      throw new Error('Gemini is currently rate-limited in ModelFactory');
    }
    const model = env.gemini.model || 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.geminiApiKey}`;

    const contents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const body: Record<string, unknown> = {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: {
        ...(maxTokens ? { maxOutputTokens: maxTokens } : {}),
        temperature,
        ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
        thinkingConfig: { thinkingBudget: 0 },
      },
    };

    const controller = new AbortController();
    const fetchTimeout = setTimeout(() => controller.abort(), 15000);
    let resp: Response;
    try {
      resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (err: any) {
      clearTimeout(fetchTimeout);
      if (err.name === 'AbortError') {
        modelFactory.markProviderRateLimited('gemini', 60_000);
        throw new Error('Gemini text request timed out (15s)');
      }
      throw err;
    }
    clearTimeout(fetchTimeout);

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`Gemini text error (${resp.status}): ${errText}`);
    }

    const data = await resp.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string; thought?: boolean }> } }>;
    };
    const parts = data.candidates?.[0]?.content?.parts || [];
    const textParts = parts.filter(p => !p.thought && p.text);
    const text = textParts.map(p => p.text).join('');
    if (!text) throw new Error('Gemini text returned empty response');
    return text;
  }
}

export const aiProvider = new AIProvider();
