const AUTH_ERROR_MESSAGES: Record<string, string> = {
  Configuration:
    "Sign-in could not be completed. The server may be unable to reach the authentication provider. Please try again or use email sign-in.",
  AccessDenied: "Sign-in was cancelled or access was denied by the provider.",
  OAuthAccountNotLinked:
    "This email is already registered with a different sign-in method. Sign in with email first, then connect Google from your profile.",
  OAuthCallbackError:
    "Sign-in could not be completed. Please try again.",
  CallbackRouteError:
    "Sign-in could not be completed due to a server error. Please try again or use email sign-in.",
  Verification:
    "The sign-in link or verification token is invalid or has expired.",
  CredentialsSignin:
    "Invalid email or password. Please check your credentials and try again.",
  ConnectTimeout:
    "The server could not reach the authentication provider (connection timed out). Please check your internet connection and try again.",
  OAuthCallbackTimeout:
    "Google sign-in timed out while the Next.js server was contacting Google. Check server internet/DNS access and try again.",
  OAuthCallbackNetwork:
    "Google sign-in could not reach Google from the Next.js server. Check server internet/DNS access and try again.",
  NetworkError:
    "A network error occurred during sign-in. Please check your connection and try again.",
  AccountNotFound:
    "No account found with this email. Please create an account first.",
  AccountDisabled:
    "This account has been disabled. Please contact support for assistance.",
  EmailNotVerified:
    "Your email has not been verified. Please check your inbox for the verification email.",
  TooManyRequests:
    "Too many sign-in attempts. Please wait a few minutes before trying again.",
};

export function getFriendlyAuthError(error: string | null | undefined): string {
  if (!error) {
    return "Authentication failed. Please try again.";
  }

  const decoded = decodeURIComponent(error);
  return AUTH_ERROR_MESSAGES[decoded] || decoded;
}

type AuthFlow =
  | "register"
  | "verifyRegistration"
  | "login"
  | "google"
  | "forgotPassword"
  | "resetPassword"
  | "verifyEmail"
  | "resendRegistrationOTP"
  | "logout";

type ErrorLike = {
  message?: string;
  code?: string;
  statusCode?: number;
  details?: unknown;
};

const FLOW_FALLBACKS: Record<AuthFlow, string> = {
  register: "We could not create your account. Please check the highlighted fields and try again.",
  verifyRegistration: "We could not verify that code. Check the code and try again.",
  login: "We could not sign you in. Check your email and password, then try again.",
  google: "Google sign-in could not complete. Please try again.",
  forgotPassword: "We could not send the reset email. Please check the email and try again.",
  resetPassword: "We could not update your password. Please check the requirements and try again.",
  verifyEmail: "We could not verify your email. The link may be expired.",
  resendRegistrationOTP: "We could not send a new verification code. Please try again.",
  logout: "We could not sign you out. Please try again.",
};

const CODE_MESSAGES: Record<string, string> = {
  NETWORK_ERROR:
    "The app cannot reach the backend server. Make sure the API server is running and your network connection is available.",
  VALIDATION_ERROR: "Some information is missing or invalid. Review the details below and try again.",
  CONFLICT: "An account already exists with this email. Sign in or use forgot password.",
  UNAUTHORIZED: "The credentials or verification details were not accepted.",
  FORBIDDEN: "This account cannot complete that action right now.",
  TOO_MANY_REQUESTS: "Too many attempts. Wait a moment, then try again.",
  INTERNAL_SERVER_ERROR: "Something went wrong on the server. Please try again in a moment.",
  SERVICE_UNAVAILABLE: "The service is temporarily unavailable. Please try again shortly.",
};

function formatDetails(details: unknown): string {
  if (!details) return "";

  if (Array.isArray(details)) {
    return details
      .map((detail) => {
        if (typeof detail === "string") return detail;
        if (detail && typeof detail === "object") {
          const record = detail as Record<string, unknown>;
          const field = typeof record.field === "string" ? record.field : "";
          const message = typeof record.message === "string" ? record.message : "";
          return field && message ? `${field}: ${message}` : message || field;
        }
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }

  if (typeof details === "object") {
    return Object.entries(details as Record<string, unknown>)
      .flatMap(([field, messages]) => {
        if (Array.isArray(messages)) {
          return messages.map((message) => `${field}: ${String(message)}`);
        }
        return `${field}: ${String(messages)}`;
      })
      .join("\n");
  }

  return String(details);
}

function addSuggestedAction(message: string, flow: AuthFlow, code?: string): string {
  const lower = message.toLowerCase();

  if (flow === "login" && lower.includes("social account")) {
    return `${message}\nUse Google sign-in for this account, or reset your password if you want to use email login.`;
  }

  if ((flow === "register" || flow === "verifyRegistration") && code === "CONFLICT") {
    return `${message}\nUse Sign In if this is your account, or Forgot Password if you do not remember the password.`;
  }

  if (flow === "resetPassword" && lower.includes("expired")) {
    return `${message}\nRequest a new reset link from the Forgot Password page.`;
  }

  if (flow === "verifyRegistration" && lower.includes("expired")) {
    return `${message}\nGo back to registration and request a fresh verification code.`;
  }

  return message;
}

export function getAuthFlowErrorMessage(error: unknown, flow: AuthFlow): string {
  if (typeof error === "string") {
    return getFriendlyAuthError(error);
  }

  const err = error as ErrorLike;
  const code = err?.code;
  const rawMessage = err?.message;
  const baseMessage =
    rawMessage && rawMessage !== "Request failed"
      ? rawMessage
      : (code && CODE_MESSAGES[code]) || FLOW_FALLBACKS[flow];

  const message = addSuggestedAction(baseMessage, flow, code);
  const details = formatDetails(err?.details);

  return details ? `${message}\n\nDetails:\n${details}` : message;
}
