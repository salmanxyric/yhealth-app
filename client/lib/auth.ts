import NextAuth, { CredentialsSignin, customFetch } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";
import { googleOAuthFetch } from "@/lib/google-oauth-fetch";
import { createLogger } from "@/lib/logger";

const log = createLogger("Auth");

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID ||
  process.env.AUTH_GOOGLE_ID ||
  process.env.AUTH_GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET =
  process.env.GOOGLE_CLIENT_SECRET ||
  process.env.AUTH_GOOGLE_SECRET ||
  process.env.AUTH_GOOGLE_CLIENT_SECRET;

const googleProviderEnabled = Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const response = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          const data = await response.json();

          // Debug: log the full response structure
          log.debug("Backend response:", JSON.stringify(data, null, 2));

          if (!response.ok || !data.success) {
            throw new Error(data.message || data.error?.message || "Invalid credentials");
          }

          // Extract tokens - backend returns { user, tokens: { accessToken, refreshToken } }
          const responseData = data.data || data;
          const tokens = responseData.tokens || responseData;
          const accessToken = tokens.accessToken;
          const refreshToken = tokens.refreshToken;
          const user = responseData.user;

          log.debug("Extracted tokens:", {
            hasAccessToken: !!accessToken,
            hasRefreshToken: !!refreshToken,
            hasUser: !!user,
          });

          const userResult = {
            id: user.id,
            email: user.email,
            name: user.firstName
              ? `${user.firstName} ${user.lastName || ""}`
              : user.email,
            image: user.avatarUrl,
            accessToken: accessToken,
            refreshToken: refreshToken,
            onboardingStatus: user.onboardingStatus,
            role: user.role || "user", // Include role from backend
          };

          log.debug("Returning user:", {
            id: userResult.id,
            email: userResult.email,
            hasAccessToken: !!userResult.accessToken,
            accessTokenPreview: userResult.accessToken
              ? `${userResult.accessToken.substring(0, 20)}...`
              : "none",
          });

          return userResult;
        } catch (error) {
          log.error("Auth error:", error);
          throw new CredentialsSignin(
            error instanceof Error ? error.message : "Invalid credentials"
          );
        }
      },
    }),
    ...(googleProviderEnabled
      ? [
          Google({
            clientId: GOOGLE_CLIENT_ID!,
            clientSecret: GOOGLE_CLIENT_SECRET!,
            [customFetch]: googleOAuthFetch,
            // Explicit endpoints bypass the OpenID discovery fetch to
            // accounts.google.com (unreachable on some networks).
            issuer: "https://accounts.google.com",
            wellKnown: undefined as unknown as string,
            token: "https://oauth2.googleapis.com/token",
            userinfo: "https://openidconnect.googleapis.com/v1/userinfo",
            jwks_endpoint: "https://www.googleapis.com/oauth2/v3/certs",
            authorization: {
              url: "https://accounts.google.com/o/oauth2/v2/auth",
              params: {
                prompt: "consent",
                access_type: "offline",
                response_type: "code",
              },
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Handle Google sign-in - register/login with backend
      if (account?.provider === "google" && profile?.email) {
        try {
          const googleProfile = profile as {
            sub?: string;
            name?: string;
            picture?: string;
            given_name?: string;
            family_name?: string;
          };

          const response = await fetch(`${API_URL}/auth/social`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              provider: "google",
              providerId: googleProfile.sub,
              idToken: account.id_token,
              accessToken: account.access_token,
              email: profile.email,
              name: googleProfile.name,
              firstName: googleProfile.given_name,
              lastName: googleProfile.family_name,
              avatar: googleProfile.picture,
            }),
          });

          const data = await response.json();

          if (!response.ok || !data.success) {
            const errorMessage = data.error?.message || "Social authentication failed";
            return `/auth/signin?error=${encodeURIComponent(errorMessage)}`;
          }

          // Store backend tokens in user object for jwt callback
          (user as unknown as Record<string, unknown>).backendData = data.data;
          return true;
        } catch (error) {
          log.error("Social auth error:", error);
          const errorCode = error instanceof Error && error.message.includes("fetch failed")
            ? "ConnectTimeout"
            : "NetworkError";
          return `/auth/signin?error=${encodeURIComponent(errorCode)}`;
        }
      }
      return true;
    },
    async jwt({ token, user, account, trigger }) {
      // Debug logging
      log.debug("JWT Callback:", {
        trigger,
        hasUser: !!user,
        hasAccount: !!account,
        provider: account?.provider,
        userAccessToken: user?.accessToken ? "present" : "missing",
        tokenAccessToken: token.accessToken ? "present" : "missing",
      });

      // Initial sign in - user object contains data from authorize callback
      if (user) {
        // For credentials provider, user.accessToken comes from authorize()
        token.id = user.id;
        token.accessToken = user.accessToken || token.accessToken;
        token.refreshToken = user.refreshToken || token.refreshToken;
        token.onboardingStatus = user.onboardingStatus || token.onboardingStatus;
        token.role = (user as { role?: string }).role || token.role || "user"; // Store role in token

        log.debug("JWT set from user:", {
          accessToken: token.accessToken ? `${String(token.accessToken).substring(0, 20)}...` : "none",
        });

        // Handle Google sign-in - get tokens from backendData
        if (account?.provider === "google") {
          const backendData = (user as unknown as Record<string, unknown>).backendData as {
            user: { id: string; onboardingStatus: string; role?: string };
            tokens: { accessToken: string; refreshToken: string };
          } | undefined;

          if (backendData) {
            token.id = backendData.user.id;
            token.accessToken = backendData.tokens.accessToken;
            token.refreshToken = backendData.tokens.refreshToken;
            token.onboardingStatus = backendData.user.onboardingStatus;
            token.role = backendData.user.role || token.role || "user"; // Store role from backend

            log.debug("JWT set from Google backendData:", {
              accessToken: token.accessToken ? `${String(token.accessToken).substring(0, 20)}...` : "none",
            });
          }
        }
      }

      // Ensure accessToken persists between requests
      if (!user) {
        log.debug("JWT returning existing token:", {
          hasAccessToken: !!token.accessToken,
          accessToken: token.accessToken ? `${String(token.accessToken).substring(0, 20)}...` : "none",
        });
      }

      return token;
    },
    async session({ session, token }) {
      // Debug logging
      log.debug("Session Callback:", {
        tokenId: token.id,
        tokenAccessToken: token.accessToken ? `${String(token.accessToken).substring(0, 20)}...` : "missing",
        tokenRefreshToken: token.refreshToken ? "present" : "missing",
        tokenOnboardingStatus: token.onboardingStatus,
      });

      // Always copy token values to session
      session.user.id = token.id as string;
      session.accessToken = token.accessToken as string || "";
      session.refreshToken = token.refreshToken as string || "";
      session.onboardingStatus = token.onboardingStatus as string || "pending";
      // Include role in session user object
      (session.user as { role?: string }).role = (token.role as string) || "user";

      log.debug("Returning session:", {
        userId: session.user.id,
        hasAccessToken: !!session.accessToken,
        accessToken: session.accessToken ? `${session.accessToken.substring(0, 20)}...` : "none",
      });

      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/signin",
    verifyRequest: "/auth/verify",
  },
  session: {
    strategy: "jwt",
    maxAge: 3 * 24 * 60 * 60, // 3 days - match JWT_EXPIRES_IN
  },
  secret:
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    (process.env.NODE_ENV === "production" ? undefined : "development-secret"),
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production"
        ? "__Secure-authjs.session-token"
        : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 3 * 24 * 60 * 60, // 3 days
      },
    },
  },
  trustHost: true,
  debug: process.env.NODE_ENV === "development",
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
