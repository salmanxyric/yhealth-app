import { NextResponse } from "next/server";

const googleClientId =
  process.env.GOOGLE_CLIENT_ID ||
  process.env.AUTH_GOOGLE_ID ||
  process.env.AUTH_GOOGLE_CLIENT_ID;

const googleClientSecret =
  process.env.GOOGLE_CLIENT_SECRET ||
  process.env.AUTH_GOOGLE_SECRET ||
  process.env.AUTH_GOOGLE_CLIENT_SECRET;

export function GET() {
  const missing: string[] = [];

  if (!googleClientId) missing.push("GOOGLE_CLIENT_ID");
  if (!googleClientSecret) missing.push("GOOGLE_CLIENT_SECRET");

  return NextResponse.json(
    {
      providers: {
        google: {
          enabled: missing.length === 0,
          missing: process.env.NODE_ENV === "development" ? missing : undefined,
        },
      },
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
