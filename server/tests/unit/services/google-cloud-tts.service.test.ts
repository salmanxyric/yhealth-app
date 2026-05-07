import { jest } from '@jest/globals';
import { GoogleCloudTTSService } from '../../../src/services/google-cloud-tts.service.js';

describe('GoogleCloudTTSService', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('uses the resolved voice language when a regional English locale falls back to en-US', async () => {
    const service = new GoogleCloudTTSService();
    (service as unknown as { apiKey: string }).apiKey = 'test-google-api-key';

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ audioContent: Buffer.from('audio').toString('base64') }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await service.textToSpeech('Hello from Canada', {
      languageCode: 'en-CA',
      voiceGender: 'female',
    });

    const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body);

    expect(requestBody.voice).toEqual({
      languageCode: 'en-US',
      name: 'en-US-Chirp3-HD-Achernar',
    });
  });

  it('uses the default voice language when no configured voice supports the requested language', async () => {
    const service = new GoogleCloudTTSService();
    (service as unknown as { apiKey: string }).apiKey = 'test-google-api-key';

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ audioContent: Buffer.from('audio').toString('base64') }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await service.textToSpeech('Bonjour', {
      languageCode: 'fr-CA',
      voiceGender: 'male',
    });

    const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body);

    expect(requestBody.voice).toEqual({
      languageCode: 'en-US',
      name: 'en-US-Chirp3-HD-Alnilam',
    });
  });
});
