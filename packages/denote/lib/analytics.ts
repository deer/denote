/**
 * Server-Side Analytics Middleware for Denote
 *
 * Pluggable, privacy-friendly analytics that reports pageviews server-side.
 * No client-side JavaScript, no cookies. Built-in providers (Umami, Plausible)
 * handle visitor privacy server-side. Custom endpoints receive forwarded
 * request metadata (IP, user-agent) — the endpoint operator is responsible
 * for privacy compliance.
 */

import type { Context } from "fresh";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AnalyticsConfig {
  /** Analytics provider */
  provider: "umami" | "plausible" | "custom";
  /** Collection API endpoint URL. Defaults per provider (Umami/Plausible). */
  endpoint?: string;
  /** Site identifier. Falls back to ANALYTICS_SITE_ID env var at runtime. */
  siteId?: string;
}

/** Default collection endpoints for built-in providers. */
const DEFAULT_ENDPOINTS: Record<string, string> = {
  umami: "https://cloud.umami.is/api/send",
  plausible: "https://plausible.io/api/event",
};

/** Resolve the final endpoint and siteId, applying defaults and env vars. */
function resolveConfig(
  config: AnalyticsConfig,
): { endpoint: string; siteId: string } | null {
  const siteId = config.siteId || Deno.env.get("ANALYTICS_SITE_ID");
  if (!siteId) {
    console.warn(
      "[denote] Analytics: no siteId configured and ANALYTICS_SITE_ID env var is not set — analytics disabled.",
    );
    return null;
  }

  const endpoint = config.endpoint || DEFAULT_ENDPOINTS[config.provider];
  if (!endpoint) {
    console.warn(
      `[denote] Analytics: no endpoint configured for provider "${config.provider}" — analytics disabled.`,
    );
    return null;
  }

  return { endpoint, siteId };
}

interface ProviderPayload {
  url: string;
  headers: Record<string, string>;
  body: string;
}

// ---------------------------------------------------------------------------
// Provider formatters
// ---------------------------------------------------------------------------

function formatUmami(
  request: Request,
  pageUrl: URL,
  siteId: string,
  endpoint: string,
): ProviderPayload {
  return {
    url: endpoint,
    headers: {
      "Content-Type": "application/json",
      "User-Agent": request.headers.get("user-agent") || "Denote/1.0",
    },
    body: JSON.stringify({
      type: "event",
      payload: {
        website: siteId,
        url: pageUrl.pathname,
        hostname: pageUrl.hostname,
        language: request.headers.get("accept-language")?.split(",")[0] || "",
        referrer: request.headers.get("referer") || "",
        title: "",
      },
    }),
  };
}

function formatPlausible(
  request: Request,
  pageUrl: URL,
  siteId: string,
  endpoint: string,
): ProviderPayload {
  const xff = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": request.headers.get("user-agent") || "Denote/1.0",
  };
  if (xff) {
    headers["X-Forwarded-For"] = xff;
  }

  return {
    url: endpoint,
    headers,
    body: JSON.stringify({
      name: "pageview",
      url: pageUrl.href,
      domain: siteId,
      referrer: request.headers.get("referer") || "",
    }),
  };
}

function formatCustom(
  request: Request,
  pageUrl: URL,
  siteId: string,
  endpoint: string,
): ProviderPayload {
  const xff = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "";

  return {
    url: endpoint,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      event: "pageview",
      url: pageUrl.href,
      path: pageUrl.pathname,
      hostname: pageUrl.hostname,
      siteId,
      referrer: request.headers.get("referer") || "",
      userAgent: request.headers.get("user-agent") || "",
      ip: xff,
      language: request.headers.get("accept-language")?.split(",")[0] || "",
    }),
  };
}

const FORMATTERS = {
  umami: formatUmami,
  plausible: formatPlausible,
  custom: formatCustom,
} as const;

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

/**
 * Create a server-side analytics middleware for Fresh v2.
 *
 * Sends pageview events asynchronously after each document response.
 * Non-blocking — analytics never delay the response to the visitor.
 */
export function analyticsMiddleware(
  config: AnalyticsConfig,
): <T>(ctx: Context<T>) => Promise<Response> {
  const formatter = FORMATTERS[config.provider];
  const resolved = resolveConfig(config);

  return async function analyticsHandler<T>(
    ctx: Context<T>,
  ): Promise<Response> {
    const res = await ctx.next();

    if (!resolved) return res;

    // Only track GET requests that return HTML documents
    if (ctx.req.method !== "GET") return res;
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("text/html")) return res;

    // Fire analytics async — never block the response
    sendEvent(ctx.req, resolved, formatter);

    return res;
  };
}

function sendEvent(
  request: Request,
  resolved: { endpoint: string; siteId: string },
  formatter: typeof FORMATTERS[keyof typeof FORMATTERS],
): void {
  Promise.resolve().then(async () => {
    const pageUrl = new URL(request.url);

    // Skip asset-like paths
    if (
      pageUrl.pathname.startsWith("/_fresh/") ||
      pageUrl.pathname.startsWith("/api/") ||
      /\.(js|css|svg|png|jpg|jpeg|webp|woff2?|ico|json|xml|txt)$/.test(
        pageUrl.pathname,
      )
    ) {
      return;
    }

    const payload = formatter(
      request,
      pageUrl,
      resolved.siteId,
      resolved.endpoint,
    );

    await fetch(payload.url, {
      method: "POST",
      headers: payload.headers,
      body: payload.body,
    });
  }).catch((err) => {
    console.error("[denote] Analytics reporting error:", err);
  });
}
