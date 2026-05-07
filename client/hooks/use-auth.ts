"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signIn, signOut, getSession, getProviders } from "next-auth/react";
import { api } from "@/lib/api-client";
import { getAuthFlowErrorMessage } from "@/lib/auth-errors";
import toast from "react-hot-toast";

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
}

interface VerifyRegistrationData {
  activationToken: string;
  activationCode: string;
  email?: string;
  password?: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface ForgotPasswordData {
  email: string;
}

interface ResetPasswordData {
  token: string;
  password: string;
  confirmPassword: string;
}

interface VerifyEmailData {
  token: string;
}

export function useAuth() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = useCallback(
    async (
      data: RegisterData
    ): Promise<{ success: boolean; activationToken?: string }> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await api.post<{
          activationToken: string;
          message: string;
        }>("/auth/register", data);

        if (response.success && response.data?.activationToken) {
          toast.success("Verification code sent to your email!");
          return {
            success: true,
            activationToken: response.data.activationToken,
          };
        }
      } catch (err) {
        const message = getAuthFlowErrorMessage(err, "register");
        setError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }

      return { success: false };
    },
    []
  );

  const verifyRegistration = useCallback(
    async (data: VerifyRegistrationData) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await api.post<{
          user: { email: string };
          tokens: {
            accessToken: string;
            refreshToken: string;
          };
        }>("/auth/verify-registration", data);

        if (response.success && response.data) {
          // Set the token immediately after registration
          // Backend returns { user, tokens: { accessToken, refreshToken } }
          const accessToken = response.data.tokens?.accessToken;
          if (accessToken) {
            api.setAccessToken(accessToken);
          }

          if (data.email && data.password) {
            const signInResult = await signIn("credentials", {
              email: data.email,
              password: data.password,
              redirect: false,
            });

            if (signInResult?.error) {
              throw new Error(
                "Your email was verified, but we could not create a browser session. Please sign in with your email and password."
              );
            }
          }

          toast.success("Account created successfully! Welcome to Balencia!");
          router.push("/dashboard");
          return true;
        }
      } catch (err) {
        const message = getAuthFlowErrorMessage(err, "verifyRegistration");
        setError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }

      return false;
    },
    [router]
  );

  const login = useCallback(
    async (data: LoginData) => {
      setIsLoading(true);
      setError(null);

      try {
        const loginResponse = await api.post<{
          user: { email: string };
          tokens: {
            accessToken: string;
            refreshToken: string;
          };
        }>("/auth/login", data);

        const accessToken = loginResponse.data?.tokens?.accessToken;
        if (loginResponse.success && accessToken) {
          api.setAccessToken(accessToken);
        }

        const result = await signIn("credentials", {
          email: data.email,
          password: data.password,
          redirect: false,
        });

        if (result?.error) {
          const errorMsg =
            result.code === "credentials" ||
            result.error === "CredentialsSignin" ||
            result.error === "Configuration"
              ? "Invalid email or password"
              : result.error;
          throw new Error(
            errorMsg === "Invalid email or password"
              ? "Your credentials were accepted, but the browser session could not be created. Please try again."
              : errorMsg
          );
        }

        if (result?.ok) {
          // Wait for NextAuth session to be updated, then check if it has accessToken
          const session = await getSession();

          if (session?.accessToken) {
            // Session has accessToken from JWT callback, use it
            api.setAccessToken(session.accessToken);
            if (process.env.NODE_ENV === "development") {
              console.log("[useAuth] Got accessToken from NextAuth session");
            }
          }

          toast.success("Welcome back!");
          router.push("/dashboard");
          return true;
        }
      } catch (err) {
        const message = getAuthFlowErrorMessage(err, "login");
        setError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }

      return false;
    },
    [router]
  );

  const loginWithGoogle = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const providers = await getProviders();

      if (!providers?.google) {
        const message = getAuthFlowErrorMessage(
          "Google sign-in is not configured for this environment. Use email sign-in or contact support.",
          "google"
        );
        setError(message);
        toast.error(message);
        return false;
      }

      const result = await signIn("google", {
        callbackUrl: "/dashboard",
        redirect: false,
      });

      if (result?.error) {
        const message = getAuthFlowErrorMessage(result.error, "google");
        setError(message);
        toast.error(message);
        return false;
      }

      if (result?.url) {
        window.location.href = result.url;
      }

      return true;
    } catch (_err) {
      const message = getAuthFlowErrorMessage(_err, "google");
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);

    try {
      await signOut({ callbackUrl: "/" });
      toast.success("Signed out successfully");
    } catch (_err) {
      toast.error(getAuthFlowErrorMessage(_err, "logout"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const forgotPassword = useCallback(async (data: ForgotPasswordData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post("/auth/forgot-password", data);

      if (response.success) {
        toast.success("Password reset email sent! Check your inbox.");
        return true;
      }
    } catch (err) {
      const message = getAuthFlowErrorMessage(err, "forgotPassword");
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }

    return false;
  }, []);

  const resetPassword = useCallback(
    async (data: ResetPasswordData) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await api.post("/auth/reset-password", data);

        if (response.success) {
          toast.success("Password reset successfully! Please sign in.");
          router.push("/auth/signin");
          return true;
      }
    } catch (err) {
      const message = getAuthFlowErrorMessage(err, "resetPassword");
      setError(message);
      toast.error(message);
      } finally {
        setIsLoading(false);
      }

      return false;
    },
    [router]
  );

  const verifyEmail = useCallback(
    async (data: VerifyEmailData) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await api.post("/auth/verify-email", data);

        if (response.success) {
          toast.success("Email verified! You can now sign in.");
          router.push("/auth/signin");
          return true;
      }
    } catch (err) {
      const message = getAuthFlowErrorMessage(err, "verifyEmail");
      setError(message);
      toast.error(message);
      } finally {
        setIsLoading(false);
      }

      return false;
    },
    [router]
  );

  const resendVerification = useCallback(async (email: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post("/auth/resend-verification", { email });

      if (response.success) {
        toast.success("Verification email sent!");
        return true;
      }
    } catch (err) {
      const message = getAuthFlowErrorMessage(err, "verifyEmail");
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }

    return false;
  }, []);

  const resendRegistrationOTP = useCallback(
    async (
      activationToken: string
    ): Promise<{ success: boolean; activationToken?: string }> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await api.post<{
          activationToken: string;
          message: string;
        }>("/auth/resend-registration-otp", { activationToken });

        if (response.success && response.data?.activationToken) {
          toast.success("New verification code sent to your email!");
          return {
            success: true,
            activationToken: response.data.activationToken,
          };
        }
      } catch (err) {
        const message = getAuthFlowErrorMessage(err, "resendRegistrationOTP");
        setError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }

      return { success: false };
    },
    []
  );

  const changePassword = useCallback(
    async (data: { currentPassword: string; newPassword: string; confirmPassword: string }) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await api.post("/auth/change-password", data);

        if (response.success) {
          toast.success("Password changed successfully!");
          return true;
        }
      } catch (err) {
        const message = getAuthFlowErrorMessage(err, "resetPassword");
        setError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }

      return false;
    },
    []
  );

  return {
    isLoading,
    error,
    register,
    verifyRegistration,
    resendRegistrationOTP,
    login,
    loginWithGoogle,
    logout,
    forgotPassword,
    resetPassword,
    changePassword,
    verifyEmail,
    resendVerification,
  };
}
