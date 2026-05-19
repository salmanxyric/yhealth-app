import { logger } from './logger.service.js';
import type { WebRTCOffer, WebRTCAnswer, RTCIceServer } from '../types/voice-call.types.js';

class WebRTCSignalingService {
  private readonly defaultIceServers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
  ];

  getIceServers(): RTCIceServer[] {
    return this.defaultIceServers;
  }

  async processOffer(offer: WebRTCOffer, callId: string): Promise<WebRTCAnswer> {
    try {
      logger.info('[WebRTCSignaling] Processing offer', { callId, offerType: offer.type });

      const signalingUrl = process.env.VOICE_SIGNALING_URL;
      if (!signalingUrl) {
        throw new Error('VOICE_SIGNALING_URL is not configured');
      }

      const response = await fetch(`${signalingUrl.replace(/\/$/, '')}/calls/${callId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offer }),
      });

      if (!response.ok) {
        throw new Error(`Signaling backend returned ${response.status}`);
      }

      const answer = await response.json() as Partial<WebRTCAnswer>;
      if (answer.type !== 'answer' || typeof answer.sdp !== 'string' || answer.sdp.trim().length === 0) {
        throw new Error('Signaling backend returned an invalid answer');
      }

      logger.info('[WebRTCSignaling] Offer processed, answer generated', { callId });
      return { type: 'answer', sdp: answer.sdp };
    } catch (error) {
      logger.error('[WebRTCSignaling] Error processing offer', { error, callId });
      throw error;
    }
  }

  getSignalingUrl(callId: string): string {
    return `/api/voice-calls/${callId}/signaling`;
  }
}

export const webrtcSignalingService = new WebRTCSignalingService();
