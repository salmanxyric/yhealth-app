import { env } from '../config/env.config.js';
import { logger } from './logger.service.js';

const GOOGLE_TTS_API_BASE = 'https://texttospeech.googleapis.com/v1';

// Chirp 3 HD Voices - high quality multilingual voices
const VOICES: Record<string, Record<string, string>> = {
  'en-US': {
    female: 'en-US-Chirp3-HD-Achernar',
    male: 'en-US-Chirp3-HD-Alnilam',
  },
  'en-GB': {
    female: 'en-GB-Chirp3-HD-Achernar',
    male: 'en-GB-Chirp3-HD-Alnilam',
  },
  'ar': {
    female: 'ar-XA-Chirp3-HD-Achernar',
    male: 'ar-XA-Chirp3-HD-Alnilam',
  },
  'ur': {
    female: 'ur-PK-Chirp3-HD-Achernar',
    male: 'ur-PK-Chirp3-HD-Alnilam',
  },
};

// Fallback language mapping
const DEFAULT_LANGUAGE = 'en-US';

export type VoiceGender = 'male' | 'female';

interface ResolvedVoice {
  voiceName: string;
  languageCode: string;
}

export interface GoogleCloudTTSOptions {
  languageCode?: string;
  voiceGender?: VoiceGender;
  speakingRate?: number;
  pitch?: number;
}

export class GoogleCloudTTSService {
  private apiKey: string;

  constructor() {
    this.apiKey = env.googleCloudTts.apiKey || '';
    if (!this.apiKey) {
      logger.warn('[GoogleCloudTTS] API key not configured. Google Cloud TTS will not be available.');
    }
  }

  /**
   * Convert text to speech using Google Cloud TTS (Chirp 3 HD)
   * @returns Audio buffer (MP3 format)
   */
  async textToSpeech(
    text: string,
    options: GoogleCloudTTSOptions = {}
  ): Promise<Buffer> {
    if (!this.apiKey) {
      throw new Error('Google Cloud TTS API key not configured');
    }

    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    const languageCode = options.languageCode || DEFAULT_LANGUAGE;
    const gender = options.voiceGender || 'female';
    const { voiceName, languageCode: resolvedLanguageCode } = this.resolveVoice(languageCode, gender);

    const url = `${GOOGLE_TTS_API_BASE}/text:synthesize?key=${this.apiKey}`;

    const requestBody = {
      input: { text: text.trim() },
      voice: {
        languageCode: resolvedLanguageCode,
        name: voiceName,
      },
      audioConfig: {
        audioEncoding: 'MP3' as const,
        speakingRate: options.speakingRate ?? 1.0,
        pitch: options.pitch ?? 0.0,
        effectsProfileId: ['handset-class-device'],
      },
    };

    try {
      logger.debug('[GoogleCloudTTS] Requesting TTS', {
        voiceName,
        languageCode: resolvedLanguageCode,
        requestedLanguageCode: languageCode,
        gender,
        textLength: text.length,
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        let errorMessage = `Google Cloud TTS API error: ${response.status}`;

        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error?.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }

        logger.error('[GoogleCloudTTS] API error', {
          status: response.status,
          statusText: response.statusText,
          error: errorMessage,
        });

        throw new Error(errorMessage);
      }

      const responseData = (await response.json()) as { audioContent: string };

      if (!responseData.audioContent) {
        throw new Error('No audio content in Google Cloud TTS response');
      }

      // Decode base64 audio content
      const buffer = Buffer.from(responseData.audioContent, 'base64');

      logger.debug('[GoogleCloudTTS] TTS successful', {
        voiceName,
        audioSize: buffer.length,
      });

      return buffer;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      const cause = (err as any).cause;
      const errorCode = cause?.code || (err as any).code || 'UNKNOWN';
      const diagnostics: Record<string, unknown> = {
        errorCode,
        error: err.message,
        voiceName,
        languageCode: resolvedLanguageCode,
        requestedLanguageCode: languageCode,
        apiKeyPrefix: this.apiKey ? `${this.apiKey.substring(0, 8)}...` : 'NOT_SET',
      };

      if (errorCode === 'ENOTFOUND' || errorCode === 'EAI_AGAIN') {
        diagnostics.hint = 'DNS resolution failed — check internet connection or firewall/proxy settings';
      } else if (errorCode === 'ETIMEDOUT' || errorCode === 'UND_ERR_CONNECT_TIMEOUT') {
        diagnostics.hint = 'Connection timed out — Google TTS API may be blocked by firewall or proxy';
      } else if (errorCode === 'ECONNREFUSED') {
        diagnostics.hint = 'Connection refused — check if a proxy is required';
      } else if (errorCode === 'CERT_HAS_EXPIRED' || errorCode === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
        diagnostics.hint = 'TLS certificate error — check system clock or corporate SSL inspection proxy';
      } else if (err.message.includes('API key not valid')) {
        diagnostics.hint = 'GOOGLE_CLOUD_VOICE_API_KEY is invalid — regenerate at console.cloud.google.com';
      } else if (err.message === 'fetch failed') {
        diagnostics.hint = 'Network-level failure — check internet, DNS, firewall, or proxy. See cause code above.';
        if (cause) diagnostics.cause = { code: cause.code, message: cause.message, hostname: cause.hostname };
      }

      logger.error('[GoogleCloudTTS] TTS request failed', diagnostics);
      throw error;
    }
  }

  /**
   * Get the voice name for a language and gender
   */
  private resolveVoice(languageCode: string, gender: VoiceGender): ResolvedVoice {
    const normalizedLanguageCode = this.normalizeLanguageCode(languageCode);

    // Try exact match first
    const voices = VOICES[normalizedLanguageCode];
    if (voices?.[gender]) {
      return { voiceName: voices[gender], languageCode: normalizedLanguageCode };
    }

    // Try base language (e.g., 'en' from 'en-US')
    const baseLang = normalizedLanguageCode.split('-')[0];
    for (const [key, val] of Object.entries(VOICES)) {
      if (key.startsWith(baseLang) && val[gender]) {
        return { voiceName: val[gender], languageCode: key };
      }
    }

    // Fallback to default English
    return { voiceName: VOICES[DEFAULT_LANGUAGE][gender], languageCode: DEFAULT_LANGUAGE };
  }

  /**
   * Normalize language code for Google TTS API
   * Google expects format like 'en-US', 'ar-XA', 'ur-PK'
   */
  private normalizeLanguageCode(code: string): string {
    // If already in correct format, return as-is
    if (code.includes('-') && code.length >= 4) {
      return code;
    }

    // Map base language codes to full codes
    const langMap: Record<string, string> = {
      en: 'en-US',
      ar: 'ar-XA',
      ur: 'ur-PK',
      hi: 'hi-IN',
      es: 'es-ES',
      fr: 'fr-FR',
      de: 'de-DE',
      pt: 'pt-BR',
      zh: 'cmn-CN',
      ja: 'ja-JP',
      ko: 'ko-KR',
    };

    return langMap[code] || 'en-US';
  }

  /**
   * Check if Google Cloud TTS is configured and available
   */
  isAvailable(): boolean {
    return !!this.apiKey;
  }
}

export const googleCloudTTSService = new GoogleCloudTTSService();
