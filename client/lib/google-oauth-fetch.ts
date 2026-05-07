import dns from "node:dns";
import http from "node:http";
import https from "node:https";
import type { LookupFunction } from "node:net";

const GOOGLE_OAUTH_TIMEOUT_MS = Number(
  process.env.GOOGLE_OAUTH_FETCH_TIMEOUT_MS || 30000
);

function headersToRecord(headers: Headers): Record<string, string> {
  const record: Record<string, string> = {};
  headers.forEach((value, key) => {
    record[key] = value;
  });
  return record;
}

function normalizeBody(
  body: BodyInit | null | undefined,
  headers: Headers
): Buffer | string | undefined {
  if (!body) return undefined;

  if (body instanceof URLSearchParams) {
    if (!headers.has("content-type")) {
      headers.set("content-type", "application/x-www-form-urlencoded;charset=UTF-8");
    }
    return body.toString();
  }

  if (typeof body === "string") return body;

  if (body instanceof ArrayBuffer) {
    return Buffer.from(body);
  }

  if (ArrayBuffer.isView(body)) {
    return Buffer.from(body.buffer, body.byteOffset, body.byteLength);
  }

  return undefined;
}

const lookupIpv4: LookupFunction = (hostname, options, callback) => {
  dns.lookup(hostname, { ...options, family: 4 }, callback);
};

// oauth2.googleapis.com is unreachable on some networks.
// Google serves the same endpoints on www.googleapis.com.
const HOST_REWRITES: Record<string, { hostname: string; pathPrefix: string }> = {
  "oauth2.googleapis.com": { hostname: "www.googleapis.com", pathPrefix: "/oauth2/v4" },
};

export async function googleOAuthFetch(
  input: Parameters<typeof fetch>[0],
  init?: Parameters<typeof fetch>[1]
): ReturnType<typeof fetch> {
  const inputRequest = input instanceof Request ? input : null;
  const url = new URL(
    typeof input === "string" || input instanceof URL ? input.toString() : input.url
  );
  const headers = new Headers(inputRequest?.headers);

  if (init?.headers) {
    new Headers(init.headers).forEach((value, key) => headers.set(key, value));
  }

  const body = normalizeBody(init?.body, headers);
  if (body && !headers.has("content-length")) {
    headers.set("content-length", Buffer.byteLength(body).toString());
  }

  const method = init?.method || inputRequest?.method || "GET";
  const transport = url.protocol === "http:" ? http : https;
  const startedAt = Date.now();

  // Rewrite unreachable Google hosts to reachable alternatives
  const rewrite = HOST_REWRITES[url.hostname];
  const effectiveHostname = rewrite?.hostname ?? url.hostname;
  const effectivePath = rewrite
    ? `${rewrite.pathPrefix}${url.pathname}${url.search}`
    : `${url.pathname}${url.search}`;

  console.info("[googleOAuthFetch] Starting request", {
    method,
    host: url.hostname,
    effectiveHost: effectiveHostname,
    path: effectivePath,
  });

  return new Promise<Response>((resolve, reject) => {
    const request = transport.request(
      {
        protocol: url.protocol,
        hostname: effectiveHostname,
        port: url.port || undefined,
        path: effectivePath,
        method,
        headers: headersToRecord(headers),
        lookup: lookupIpv4,
      },
      (response) => {
        const chunks: Buffer[] = [];

        response.on("data", (chunk) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });

        response.on("end", () => {
          const responseHeaders = new Headers();
          for (const [key, value] of Object.entries(response.headers)) {
            if (Array.isArray(value)) {
              value.forEach((item) => responseHeaders.append(key, item));
            } else if (typeof value !== "undefined") {
              responseHeaders.set(key, String(value));
            }
          }

          if (process.env.NODE_ENV === "development") {
            console.info("[NextAuth Google OAuth] request completed", {
              host: url.hostname,
              path: url.pathname,
              status: response.statusCode,
              durationMs: Date.now() - startedAt,
            });
          }

          resolve(
            new Response(Buffer.concat(chunks), {
              status: response.statusCode || 200,
              statusText: response.statusMessage,
              headers: responseHeaders,
            })
          );
        });
      }
    );

    request.setTimeout(GOOGLE_OAUTH_TIMEOUT_MS, () => {
      request.destroy(
        new Error(
          `Google OAuth request timed out after ${GOOGLE_OAUTH_TIMEOUT_MS}ms`
        )
      );
    });

    request.on("error", (error) => {
      reject(error);
    });

    if (body) {
      request.write(body);
    }

    request.end();
  });
}
