import { NextRequest, NextResponse } from "next/server";

/**
 * Google Calendar OAuth callback (frontend forwarder).
 *
 * Google redirects the user here with `?code=…&state=…&scope=…` after consent.
 * Because the server handles token exchange, we forward the query string to
 * the Express route `/api/calendar/callback`. That route redirects back into
 * the web app with `?calendar=connected` or `?calendar=error&reason=…` — we
 * land the user on `/calendar/connected` which auto-forwards to the schedule.
 *
 * Register THIS URL as the Authorized redirect URI on the Google OAuth client:
 *   http://localhost:3000/api/integrations/oauth/callback/google
 *   (or the equivalent prod origin)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // Google-reported error (e.g., access_denied) — skip server round-trip.
  if (error) {
    const url = new URL("/calendar/connected", baseUrl);
    url.searchParams.set("status", "error");
    url.searchParams.set("reason", error);
    return NextResponse.redirect(url);
  }

  if (!code || !state) {
    const url = new URL("/calendar/connected", baseUrl);
    url.searchParams.set("status", "error");
    url.searchParams.set("reason", "Missing authorization code or state");
    return NextResponse.redirect(url);
  }

  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9090/api";
    // Hit the server callback, which performs the token exchange and then
    // issues its own 302. We follow it manually so we can land the user on
    // our premium success page instead of whatever the server picks.
    const forwardUrl = new URL(`${API_URL.replace(/\/$/, "")}/calendar/callback`);
    forwardUrl.searchParams.set("code", code);
    forwardUrl.searchParams.set("state", state);

    const serverRes = await fetch(forwardUrl.toString(), {
      method: "GET",
      redirect: "manual",
    });

    // Server returns a 302 to `${clientUrl}/calendar/connected?status=connected`
    // or `?status=error&reason=…`. Parse the `status` and `reason` query
    // params out of the Location header instead of substring-matching.
    let status: "connected" | "error" = "error";
    let reason: string | null = null;

    if (serverRes.status >= 300 && serverRes.status < 400) {
      const location = serverRes.headers.get("location") || "";
      try {
        // Location may be absolute or relative — give URL a base either way.
        const loc = new URL(location, baseUrl);
        const s = loc.searchParams.get("status");
        const r = loc.searchParams.get("reason");
        if (s === "connected") status = "connected";
        else if (s === "error") {
          status = "error";
          reason = r;
        } else {
          // Legacy fallback for older servers that used `calendar=connected|error`.
          if (location.includes("calendar=connected")) status = "connected";
          else if (location.includes("calendar=error")) {
            const legacyMatch = /[?&]reason=([^&]+)/.exec(location);
            reason = legacyMatch ? decodeURIComponent(legacyMatch[1]) : null;
          }
        }
      } catch {
        reason = "Invalid redirect from server";
      }
    } else if (serverRes.ok) {
      status = "connected";
    } else {
      try {
        const body = await serverRes.json();
        reason = body?.message || body?.error || `HTTP ${serverRes.status}`;
      } catch {
        reason = `HTTP ${serverRes.status}`;
      }
    }

    const successUrl = new URL("/calendar/connected", baseUrl);
    successUrl.searchParams.set("status", status);
    if (reason) successUrl.searchParams.set("reason", reason);
    return NextResponse.redirect(successUrl);
  } catch (err) {
    const url = new URL("/calendar/connected", baseUrl);
    url.searchParams.set("status", "error");
    url.searchParams.set("reason", err instanceof Error ? err.message : "server_unreachable");
    return NextResponse.redirect(url);
  }
}
