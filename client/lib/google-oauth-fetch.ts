const GOOGLE_OAUTH_TIMEOUT_MS = Number(
  process.env.GOOGLE_OAUTH_FETCH_TIMEOUT_MS || 30000
);

// oauth2.googleapis.com is unreachable on some networks.
// Google serves the same endpoints on www.googleapis.com.
const HOST_REWRITES: Record<string, { hostname: string; pathPrefix: string }> = {
  "oauth2.googleapis.com": { hostname: "www.googleapis.com", pathPrefix: "/oauth2/v4" },
};

function rewriteUrl(url: URL): URL {
  const rewrite = HOST_REWRITES[url.hostname];
  if (!rewrite) return url;
  const rewritten = new URL(url.toString());
  rewritten.hostname = rewrite.hostname;
  rewritten.pathname = `${rewrite.pathPrefix}${url.pathname}`;
  return rewritten;
}

export async function googleOAuthFetch(
  input: Parameters<typeof fetch>[0],
  init?: Parameters<typeof fetch>[1]
): ReturnType<typeof fetch> {
  const url = new URL(
    input instanceof Request ? input.url : input.toString()
  );

  const rewrittenUrl = rewriteUrl(url);
  const method = init?.method || (input instanceof Request ? input.method : "GET");
  const startedAt = Date.now();

  console.info("[googleOAuthFetch] Starting request", {
    method,
    original: url.hostname + url.pathname,
    effective: rewrittenUrl.hostname + rewrittenUrl.pathname,
  });

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(new Error(`Google OAuth request timed out after ${GOOGLE_OAUTH_TIMEOUT_MS}ms`)),
    GOOGLE_OAUTH_TIMEOUT_MS
  );

  try {
    const response = await fetch(rewrittenUrl.toString(), {
      ...init,
      method,
      signal: controller.signal,
    });

    if (process.env.NODE_ENV === "development") {
      console.info("[googleOAuthFetch] completed", {
        original: url.hostname + url.pathname,
        status: response.status,
        durationMs: Date.now() - startedAt,
      });
    }

    return response;
  } catch (error) {
    // If the rewritten URL failed, try the original URL as fallback
    if (rewrittenUrl.toString() !== url.toString()) {
      console.warn("[googleOAuthFetch] Rewritten URL failed, trying original", {
        error: error instanceof Error ? error.message : String(error),
        original: url.toString(),
      });

      const fallbackController = new AbortController();
      const fallbackTimeout = setTimeout(
        () => fallbackController.abort(new Error(`Google OAuth request timed out after ${GOOGLE_OAUTH_TIMEOUT_MS}ms`)),
        GOOGLE_OAUTH_TIMEOUT_MS
      );

      try {
        const response = await fetch(url.toString(), {
          ...init,
          method,
          signal: fallbackController.signal,
        });

        if (process.env.NODE_ENV === "development") {
          console.info("[googleOAuthFetch] fallback completed", {
            host: url.hostname,
            status: response.status,
            durationMs: Date.now() - startedAt,
          });
        }

        return response;
      } finally {
        clearTimeout(fallbackTimeout);
      }
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
