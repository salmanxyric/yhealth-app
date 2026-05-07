import jwt from 'jsonwebtoken';
import { logger } from './logger.service.js';
import type { AuthProvider } from '../models/index.js';

interface ISocialProfile {
  provider: AuthProvider;
  providerId: string;
  email: string;
  name?: string;
  avatar?: string;
  accessToken?: string;
}

// Type stub for google-auth-library (install package for full functionality)
interface OAuth2ClientInterface {
  verifyIdToken(options: { idToken: string; audience?: string }): Promise<{
    getPayload(): GoogleTokenPayload | undefined;
  }>;
}

interface GoogleTokenPayload {
  sub: string;
  email: string;
  email_verified: boolean | string;
  aud?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

interface AppleTokenPayload {
  sub: string;
  email?: string;
  email_verified?: boolean;
}

interface SocialProfileData {
  provider: AuthProvider;
  providerId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  accessToken?: string;
}

class OAuthService {
  private static instance: OAuthService;
  private googleClient: OAuth2ClientInterface | null = null;
  private initializationPromise: Promise<void>;

  private constructor() {
    this.initializationPromise = this.initializeClients();
  }

  public static getInstance(): OAuthService {
    if (!OAuthService.instance) {
      OAuthService.instance = new OAuthService();
    }
    return OAuthService.instance;
  }

  private async initializeClients(): Promise<void> {
    const googleClientId = this.getGoogleClientId();
    if (googleClientId) {
      try {
        // Dynamically import google-auth-library if available
        const googleAuth = await (Function('return import("google-auth-library")')() as Promise<{ OAuth2Client: new (clientId: string) => OAuth2ClientInterface }>);
        this.googleClient = new googleAuth.OAuth2Client(googleClientId);
        logger.info('Google OAuth client initialized');
      } catch {
        logger.warn('google-auth-library not installed - Google OAuth will use tokeninfo fallback');
      }
    } else {
      logger.warn('Google OAuth not configured - GOOGLE_CLIENT_ID missing');
    }
  }

  private getGoogleClientId(): string | undefined {
    return (
      process.env['GOOGLE_CLIENT_ID'] ||
      process.env['AUTH_GOOGLE_ID'] ||
      process.env['AUTH_GOOGLE_CLIENT_ID']
    );
  }

  private getGoogleClientIds(): string[] {
    const ids = new Set<string>();
    for (const key of ['GOOGLE_CLIENT_ID', 'AUTH_GOOGLE_ID', 'AUTH_GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_ID_WEB']) {
      const val = process.env[key];
      if (val) ids.add(val);
    }
    return [...ids];
  }

  private async ensureInitialized(): Promise<void> {
    await this.initializationPromise;
  }

  /**
   * Verify Google ID token and extract profile
   */
  public async verifyGoogleToken(idToken: string): Promise<SocialProfileData | null> {
    await this.ensureInitialized();

    const googleClientId = this.getGoogleClientId();
    if (!googleClientId) {
      throw new Error('Google OAuth server configuration is missing');
    }

    const validAudiences = this.getGoogleClientIds();

    try {
      let payload: GoogleTokenPayload | undefined;

      if (this.googleClient) {
        // Try each valid audience until one succeeds
        for (const aud of validAudiences) {
          try {
            payload = (await this.googleClient.verifyIdToken({
              idToken,
              audience: aud,
            })).getPayload() as GoogleTokenPayload | undefined;
            if (payload) break;
          } catch (audError) {
            const msg = audError instanceof Error ? audError.message : '';
            if (msg.includes('audience') || msg.includes('recipient')) {
              continue;
            }
            throw audError;
          }
        }
      } else {
        payload = await this.verifyGoogleTokenWithTokenInfo(idToken, googleClientId);
      }

      if (!payload) {
        logger.warn('Invalid Google token - no payload');
        return null;
      }

      if (payload.aud && !validAudiences.includes(payload.aud)) {
        logger.warn('Invalid Google token - audience mismatch', { aud: payload.aud, expected: validAudiences });
        return null;
      }

      if (payload.email_verified !== true && payload.email_verified !== 'true') {
        logger.warn('Google email not verified', { email: payload.email });
        return null;
      }

      logger.info('Google token verified', {
        email: payload.email,
        sub: payload.sub,
      });

      return {
        provider: 'google',
        providerId: payload.sub,
        email: payload.email,
        firstName: payload.given_name,
        lastName: payload.family_name,
        avatar: payload.picture,
      };
    } catch (error) {
      logger.error('Google token verification failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  private async verifyGoogleTokenWithTokenInfo(
    idToken: string,
    _googleClientId: string
  ): Promise<GoogleTokenPayload | undefined> {
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
    );

    if (!response.ok) {
      logger.warn('Google tokeninfo verification failed', {
        status: response.status,
      });
      return undefined;
    }

    const payload = (await response.json()) as GoogleTokenPayload;

    const validAudiences = this.getGoogleClientIds();
    if (payload.aud && !validAudiences.includes(payload.aud)) {
      logger.warn('Google tokeninfo audience mismatch', { aud: payload.aud, expected: validAudiences });
      return undefined;
    }

    return payload;
  }

  /**
   * Verify Apple ID token and extract profile
   * Apple Sign-In uses JWT tokens that can be verified with Apple's public keys
   */
  public async verifyAppleToken(
    idToken: string,
    userData?: { email?: string; name?: { firstName?: string; lastName?: string } }
  ): Promise<SocialProfileData | null> {
    try {
      // Decode the JWT without verification first to get the header
      const decoded = jwt.decode(idToken, { complete: true });

      if (!decoded) {
        logger.warn('Invalid Apple token - could not decode');
        return null;
      }

      // In production, fetch Apple's public keys and verify the signature
      // For now, we'll decode and trust the token (should be verified properly in production)
      const payload = decoded.payload as AppleTokenPayload;

      if (!payload.sub) {
        logger.warn('Invalid Apple token - no subject');
        return null;
      }

      // Apple only provides email on first sign-in
      // The userData parameter contains the initial user info
      const email = payload.email || userData?.email;

      if (!email) {
        logger.warn('Apple sign-in - no email provided');
        return null;
      }

      logger.info('Apple token processed', {
        sub: payload.sub,
        hasEmail: !!email,
      });

      return {
        provider: 'apple',
        providerId: payload.sub,
        email,
        firstName: userData?.name?.firstName,
        lastName: userData?.name?.lastName,
      };
    } catch (error) {
      logger.error('Apple token verification failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  /**
   * Verify social token based on provider
   */
  public async verifySocialToken(
    provider: 'google' | 'apple',
    idToken: string,
    userData?: { email?: string; name?: { firstName?: string; lastName?: string } }
  ): Promise<SocialProfileData | null> {
    switch (provider) {
      case 'google':
        return this.verifyGoogleToken(idToken);
      case 'apple':
        return this.verifyAppleToken(idToken, userData);
      default:
        logger.warn('Unknown OAuth provider', { provider });
        return null;
    }
  }

  /**
   * Create social profile object for storage
   */
  public createSocialProfile(data: SocialProfileData, accessToken?: string): ISocialProfile {
    return {
      provider: data.provider,
      providerId: data.providerId,
      email: data.email,
      name: data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : undefined,
      avatar: data.avatar,
      accessToken,
    };
  }
}

export const oauthService = OAuthService.getInstance();
export default oauthService;
