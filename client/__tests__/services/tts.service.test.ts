/**
 * TTS Service Tests
 *
 * Unit tests for the client-side text-to-speech service.
 * Covers checkStatus, speak (with fetch mocking), speakWithElevenLabs delegation,
 * revokeAudioUrl, and auth token extraction from cookies.
 *
 * @module __tests__/services/tts.service.test
 */

// ---------------------------------------------------------------------------
// Mock: @/lib/api-client
// ---------------------------------------------------------------------------

jest.mock('@/lib/api-client', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
  api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

// Import after mock
import { api } from '@/lib/api-client';
import { ttsService } from '@/src/shared/services/tts.service';

let mockGet: jest.Mock;

// ---------------------------------------------------------------------------
// Global mocks
// ---------------------------------------------------------------------------

const originalFetch = global.fetch;
const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TTS Service', () => {
  beforeEach(() => {
    mockGet = api.get as jest.Mock;

    // Reset fetch mock
    global.fetch = jest.fn();

    // Mock URL object methods
    URL.createObjectURL = jest.fn().mockReturnValue('blob:http://localhost/mock-audio-url');
    URL.revokeObjectURL = jest.fn();

    // Set default API URL
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:5000/api';

    // Clear cookies
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    delete process.env.NEXT_PUBLIC_API_URL;
    jest.restoreAllMocks();
  });

  // =========================================================================
  // checkStatus
  // =========================================================================

  describe('checkStatus', () => {
    it('should return status data on successful API call', async () => {
      const statusData = {
        available: true,
        provider: 'elevenlabs',
        message: 'TTS service is available',
      };
      mockGet.mockResolvedValueOnce({ data: statusData });

      const result = await ttsService.checkStatus();

      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledWith('/tts/status');
      expect(result).toEqual(statusData);
    });

    it('should return fallback when response has no data', async () => {
      mockGet.mockResolvedValueOnce({ data: null });

      const result = await ttsService.checkStatus();

      expect(result).toEqual({
        available: false,
        provider: 'browser',
        message: 'TTS service unavailable',
      });
    });

    it('should return fallback when response data is undefined', async () => {
      mockGet.mockResolvedValueOnce({});

      const result = await ttsService.checkStatus();

      expect(result).toEqual({
        available: false,
        provider: 'browser',
        message: 'TTS service unavailable',
      });
    });

    it('should return fallback on API error', async () => {
      mockGet.mockRejectedValueOnce(new Error('Network error'));

      const result = await ttsService.checkStatus();

      expect(result).toEqual({
        available: false,
        provider: 'browser',
        message: 'TTS service unavailable',
      });
    });
  });

  // =========================================================================
  // speak
  // =========================================================================

  describe('speak', () => {
    it('should return error for empty text', async () => {
      const result = await ttsService.speak('');

      expect(result).toEqual({
        success: false,
        error: { message: 'Text cannot be empty' },
      });
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should return error for whitespace-only text', async () => {
      const result = await ttsService.speak('   ');

      expect(result).toEqual({
        success: false,
        error: { message: 'Text cannot be empty' },
      });
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should POST to TTS endpoint and return audio on success', async () => {
      const mockBlob = new Blob(['audio-data'], { type: 'audio/mpeg' });
      const mockResponse = {
        ok: true,
        headers: new Headers({ 'X-TTS-Provider': 'elevenlabs' }),
        blob: jest.fn().mockResolvedValueOnce(mockBlob),
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await ttsService.speak('Hello world');

      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Verify fetch was called with the correct URL
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toBe('http://localhost:5000/api/tts/speak');

      // Verify request options
      const fetchOptions = fetchCall[1];
      expect(fetchOptions.method).toBe('POST');
      expect(fetchOptions.headers['Content-Type']).toBe('application/json');
      expect(fetchOptions.headers['Idempotency-Key']).toBeDefined();

      // Verify request body
      const body = JSON.parse(fetchOptions.body);
      expect(body.text).toBe('Hello world');
      expect(body.stream).toBe(false);

      // Verify response
      expect(result.success).toBe(true);
      expect(result.provider).toBe('elevenlabs');
      expect(result.data).toBeDefined();
      expect(result.data!.blob).toBe(mockBlob);
      expect(URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(result.data!.audioUrl).toBe('blob:http://localhost/mock-audio-url');
    });

    it('should trim input text before sending', async () => {
      const mockBlob = new Blob(['audio'], { type: 'audio/mpeg' });
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        blob: jest.fn().mockResolvedValueOnce(mockBlob),
      });

      await ttsService.speak('  hello  ');

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.text).toBe('hello');
    });

    it('should pass voice options in the request body', async () => {
      const mockBlob = new Blob(['audio'], { type: 'audio/mpeg' });
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        blob: jest.fn().mockResolvedValueOnce(mockBlob),
      });

      await ttsService.speak('Hello', {
        voiceId: 'voice-123',
        voiceGender: 'female',
        languageCode: 'en-US',
      });

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.voiceId).toBe('voice-123');
      expect(body.voiceGender).toBe('female');
      expect(body.languageCode).toBe('en-US');
    });

    it('should include auth header when cookie contains access token', async () => {
      document.cookie = 'balencia_access_token=my-jwt-token-123';

      const mockBlob = new Blob(['audio'], { type: 'audio/mpeg' });
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        blob: jest.fn().mockResolvedValueOnce(mockBlob),
      });

      await ttsService.speak('Hello');

      const fetchOptions = (global.fetch as jest.Mock).mock.calls[0][1];
      expect(fetchOptions.headers.Authorization).toBe('Bearer my-jwt-token-123');
    });

    it('should not include auth header when no access token cookie exists', async () => {
      document.cookie = 'other_cookie=value';

      const mockBlob = new Blob(['audio'], { type: 'audio/mpeg' });
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        blob: jest.fn().mockResolvedValueOnce(mockBlob),
      });

      await ttsService.speak('Hello');

      const fetchOptions = (global.fetch as jest.Mock).mock.calls[0][1];
      expect(fetchOptions.headers.Authorization).toBeUndefined();
    });

    it('should return "unknown" provider when header is missing', async () => {
      const mockBlob = new Blob(['audio'], { type: 'audio/mpeg' });
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers(), // no X-TTS-Provider
        blob: jest.fn().mockResolvedValueOnce(mockBlob),
      });

      const result = await ttsService.speak('Hello');

      expect(result.provider).toBe('unknown');
    });

    it('should handle HTTP error with JSON error body', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: jest.fn().mockResolvedValueOnce(
          JSON.stringify({ message: 'Rate limit exceeded' })
        ),
      });

      const result = await ttsService.speak('Hello');

      expect(result.success).toBe(false);
      expect(result.error!.message).toBe('Rate limit exceeded');
      expect(result.error!.code).toBe('429');
    });

    it('should handle HTTP error with nested error.message in JSON body', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: jest.fn().mockResolvedValueOnce(
          JSON.stringify({ error: { message: 'Internal failure' } })
        ),
      });

      const result = await ttsService.speak('Hello');

      expect(result.success).toBe(false);
      expect(result.error!.message).toBe('Internal failure');
      expect(result.error!.code).toBe('500');
    });

    it('should handle HTTP error with plain text body', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 503,
        text: jest.fn().mockResolvedValueOnce('Service Unavailable'),
      });

      const result = await ttsService.speak('Hello');

      expect(result.success).toBe(false);
      expect(result.error!.message).toBe('Service Unavailable');
      expect(result.error!.code).toBe('503');
    });

    it('should use fallback message when error text is empty', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 502,
        text: jest.fn().mockResolvedValueOnce(''),
      });

      const result = await ttsService.speak('Hello');

      expect(result.success).toBe(false);
      expect(result.error!.message).toBe('TTS request failed: 502');
    });

    it('should handle network error (fetch throws)', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network request failed'));

      const result = await ttsService.speak('Hello');

      expect(result.success).toBe(false);
      expect(result.error!.message).toBe('Network request failed');
    });

    it('should handle non-Error throws with generic message', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce('string error');

      const result = await ttsService.speak('Hello');

      expect(result.success).toBe(false);
      expect(result.error!.message).toBe(
        'Failed to convert text to speech. Please try again.'
      );
    });

    it('should use default API URL when NEXT_PUBLIC_API_URL is not set', async () => {
      delete process.env.NEXT_PUBLIC_API_URL;

      const mockBlob = new Blob(['audio'], { type: 'audio/mpeg' });
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        blob: jest.fn().mockResolvedValueOnce(mockBlob),
      });

      await ttsService.speak('Hello');

      const fetchUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(fetchUrl).toBe('http://localhost:5000/api/tts/speak');
    });
  });

  // =========================================================================
  // speakWithElevenLabs (deprecated)
  // =========================================================================

  describe('speakWithElevenLabs', () => {
    it('should delegate to speak with voiceId option', async () => {
      const mockBlob = new Blob(['audio'], { type: 'audio/mpeg' });
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'X-TTS-Provider': 'elevenlabs' }),
        blob: jest.fn().mockResolvedValueOnce(mockBlob),
      });

      const result = await ttsService.speakWithElevenLabs('Hello', 'voice-abc');

      // Verify fetch was called (proving it went through speak())
      expect(global.fetch).toHaveBeenCalledTimes(1);

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.voiceId).toBe('voice-abc');
      expect(body.text).toBe('Hello');
      expect(result.success).toBe(true);
    });

    it('should delegate to speak without voiceId when not provided', async () => {
      const mockBlob = new Blob(['audio'], { type: 'audio/mpeg' });
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        blob: jest.fn().mockResolvedValueOnce(mockBlob),
      });

      await ttsService.speakWithElevenLabs('Hello');

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.voiceId).toBeUndefined();
    });
  });

  // =========================================================================
  // revokeAudioUrl
  // =========================================================================

  describe('revokeAudioUrl', () => {
    it('should call URL.revokeObjectURL for blob: URLs', () => {
      ttsService.revokeAudioUrl('blob:http://localhost/some-id');

      expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/some-id');
    });

    it('should not call URL.revokeObjectURL for non-blob URLs', () => {
      ttsService.revokeAudioUrl('https://example.com/audio.mp3');

      expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    });

    it('should not call URL.revokeObjectURL for empty string', () => {
      ttsService.revokeAudioUrl('');

      expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    });
  });
});
