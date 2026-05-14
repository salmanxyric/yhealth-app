import { logger } from './logger.service.js';
import { env } from '../config/env.config.js';
import type { WebRTCOffer, WebRTCAnswer, RTCIceServer } from '../types/voice-call.types.js';

/**
 * WebRTC Signaling Service
 * Handles WebRTC offer/answer exchange and ICE candidate management
 * 
 * Delegates offer processing to a configured signaling backend.
 */
class WebRTCSignalingService {
  /**
   * Get ICE servers configuration
   * Returns STUN/TURN servers for WebRTC connection
   */
  getIceServers(): RTCIceServer[] {
    const defaultServers: RTCIceServer[] = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ];

    // If Twilio is configured, use Twilio TURN servers
    if (env.twilio.accountSid && env.twilio.authToken) {
      // TODO: Generate Twilio token and add TURN servers
      // For now, return default STUN servers
      logger.info('[WebRTCSignaling] Using default STUN servers (Twilio TURN not yet configured)');
      return defaultServers;
    }

    return defaultServers;
  }

  /**
   * Process WebRTC offer and generate answer.
   */
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

  /**
   * Generate Twilio access token for TURN servers
   * This is used when Twilio is configured
   */
  async generateTwilioToken(identity: string, roomName: string): Promise<string> {
    if (!env.twilio.accountSid || !env.twilio.authToken || !env.twilio.apiKey || !env.twilio.apiSecret) {
      throw new Error('Twilio credentials not configured');
    }

    logger.info('[WebRTCSignaling] Generating Twilio token', { identity, roomName });
    throw new Error('Twilio token generation requires Twilio SDK integration');
  }

  /**
   * Get signaling URL for a call
   */
  getSignalingUrl(callId: string): string {
    return `/api/voice-calls/${callId}/signaling`;
  }
}

export const webrtcSignalingService = new WebRTCSignalingService();
