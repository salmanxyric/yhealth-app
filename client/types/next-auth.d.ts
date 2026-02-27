import "next-auth";
import "next-auth/jwt";
import "@auth/core/types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    accessToken: string;
    refreshToken: string;
    onboardingStatus: string;
  }

  interface User {
    id: string;
    email: string;
    name?: string;
    image?: string;
    accessToken?: string;
    refreshToken?: string;
    onboardingStatus?: string;
  }
}

declare module "@auth/core/types" {
  interface User {
    id: string;
    email: string;
    name?: string;
    image?: string;
    accessToken?: string;
    refreshToken?: string;
    onboardingStatus?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    accessToken?: string;
    refreshToken?: string;
    onboardingStatus?: string;
  }
}
