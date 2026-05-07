import { env } from '../config/env.config.js';
import { logger } from './logger.service.js';

const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io/v1';
const DEFAULT_MODEL_ID = 'eleven_multilingual_v2';

export interface ElevenLabsTTSOptions {
  voiceId?: string;
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  useSpeakerBoost?: boolean;
}

export class ElevenLabsService {
  private apiKey: string;

  constructor() {
    this.apiKey = env.elevenlabs.apiKey || '';
    if (!this.apiKey) {
      logger.warn('[ElevenLabs] API key not configured. TTS will fallback to browser synthesis.');
    }
  }

  /**
   * Convert text to speech using ElevenLabs API
   * @param text - Text to convert to speech
   * @param options - Optional TTS parameters
   * @returns Audio buffer (MP3 format)
   */
  async textToSpeech(
    text: string,
    options: ElevenLabsTTSOptions = {}
  ): Promise<Buffer> {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    const voiceId = options.voiceId || env.elevenlabs.voiceId;
    if (!voiceId) {
      throw new Error('ElevenLabs voice ID not configured. Set ELEVEN_LAB_VOICE_ID to a voice available to this account.');
    }

    const modelId = options.modelId || DEFAULT_MODEL_ID;

    const url = `${ELEVENLABS_API_BASE}/text-to-speech/${voiceId}`;

    const requestBody = {
      text: text.trim(),
      model_id: modelId,
      voice_settings: {
        stability: options.stability ?? 0.5,
        similarity_boost: options.similarityBoost ?? 0.75,
        style: options.style ?? 0.0,
        use_speaker_boost: options.useSpeakerBoost ?? true,
      },
    };

    try {
      logger.debug('[ElevenLabs] Requesting TTS', {
        voiceId,
        textLength: text.length,
        modelId,
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        let errorMessage = `ElevenLabs API error: ${response.status}`;

        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.detail?.message || errorJson.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }

        const diagnostics: Record<string, unknown> = {
          status: response.status,
          statusText: response.statusText,
          error: errorMessage,
          voiceId,
          apiKeyPrefix: this.apiKey ? `${this.apiKey.substring(0, 8)}...` : 'NOT_SET',
        };

        if (response.status === 401) {
          diagnostics.hint = 'ELEVEN_LAB_API_KEY is invalid or expired — regenerate at elevenlabs.io/api';
        } else if (response.status === 402) {
          diagnostics.hint = 'ElevenLabs plan does not support this feature — upgrade subscription or use a different voice/model';
        } else if (response.status === 429) {
          diagnostics.hint = 'ElevenLabs rate limit or quota exceeded — check usage at elevenlabs.io';
        }

        logger.error('[ElevenLabs] API error', diagnostics);
        throw new Error(errorMessage);
      }

      const audioBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(audioBuffer);

      logger.debug('[ElevenLabs] TTS successful', {
        voiceId,
        audioSize: buffer.length,
      });

      return buffer;
    } catch (error) {
      logger.error('[ElevenLabs] TTS request failed', {
        error: error instanceof Error ? error.message : String(error),
        voiceId,
      });
      throw error;
    }
  }

  /**
   * Stream text to speech using ElevenLabs API
   * @param text - Text to convert to speech
   * @param options - Optional TTS parameters
   * @returns Readable stream of audio data
   */
  async textToSpeechStream(
    text: string,
    options: ElevenLabsTTSOptions = {}
  ): Promise<ReadableStream<Uint8Array>> {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    const voiceId = options.voiceId || env.elevenlabs.voiceId;
    if (!voiceId) {
      throw new Error('ElevenLabs voice ID not configured. Set ELEVEN_LAB_VOICE_ID to a voice available to this account.');
    }

    const modelId = options.modelId || DEFAULT_MODEL_ID;

    const url = `${ELEVENLABS_API_BASE}/text-to-speech/${voiceId}/stream`;

    const requestBody = {
      text: text.trim(),
      model_id: modelId,
      voice_settings: {
        stability: options.stability ?? 0.5,
        similarity_boost: options.similarityBoost ?? 0.75,
        style: options.style ?? 0.0,
        use_speaker_boost: options.useSpeakerBoost ?? true,
      },
    };

    try {
      logger.debug('[ElevenLabs] Requesting TTS stream', {
        voiceId,
        textLength: text.length,
        modelId,
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        let errorMessage = `ElevenLabs API error: ${response.status}`;

        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.detail?.message || errorJson.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }

        logger.error('[ElevenLabs] API error', {
          status: response.status,
          statusText: response.statusText,
          error: errorMessage,
        });

        throw new Error(errorMessage);
      }

      if (!response.body) {
        throw new Error('No response body from ElevenLabs API');
      }

      logger.debug('[ElevenLabs] TTS stream started', {
        voiceId,
      });

      return response.body as ReadableStream<Uint8Array>;
    } catch (error) {
      logger.error('[ElevenLabs] TTS stream request failed', {
        error: error instanceof Error ? error.message : String(error),
        voiceId,
      });
      throw error;
    }
  }

  /**
   * Check if ElevenLabs is configured and available
   */
  isAvailable(): boolean {
    return !!this.apiKey;
  }
}

export const elevenlabsService = new ElevenLabsService();
