import { assertEquals } from "jsr:@std/assert@1";
import { assertSpyCalls, spy } from "jsr:@std/testing@1/mock";
import { analyticsMiddleware } from "./analytics.ts";
import type { AnalyticsConfig } from "./analytics.ts";

/** Minimal mock of Fresh's Context */
function mockCtx(
  opts: {
    url?: string;
    method?: string;
    responseHeaders?: Record<string, string>;
    responseStatus?: number;
  } = {},
) {
  const {
    url = "http://localhost:8000/docs/intro",
    method = "GET",
    responseHeaders = { "content-type": "text/html" },
    responseStatus = 200,
  } = opts;

  const response = new Response("OK", {
    status: responseStatus,
    headers: responseHeaders,
  });

  const nextFn = spy(() => Promise.resolve(response));

  const ctx = {
    req: new Request(url, {
      method,
      headers: {
        "user-agent": "TestAgent/1.0",
        "accept-language": "en-US",
      },
    }),
    next: nextFn,
  };

  return { ctx, nextFn, response };
}

const umamiConfig: AnalyticsConfig = {
  provider: "umami",
  endpoint: "https://cloud.umami.is/api/send",
  siteId: "test-website-id",
};

const plausibleConfig: AnalyticsConfig = {
  provider: "plausible",
  endpoint: "https://plausible.io/api/event",
  siteId: "example.com",
};

const customConfig: AnalyticsConfig = {
  provider: "custom",
  endpoint: "https://my-analytics.example.com/collect",
  siteId: "my-site",
};

// Analytics fires background fetch requests that are intentionally not awaited.
const opts = { sanitizeOps: false, sanitizeResources: false };

/** Drain microtask queue so background analytics fetch completes. */
const flushAnalytics = async () => {
  await new Promise<void>((r) => setTimeout(r, 0));
  await new Promise<void>((r) => setTimeout(r, 0));
};

Deno.test(
  "analyticsMiddleware - passes through and returns response",
  opts,
  async () => {
    const handler = analyticsMiddleware(umamiConfig);
    const { ctx, nextFn, response } = mockCtx();

    // deno-lint-ignore no-explicit-any
    const res = await handler(ctx as any);

    assertSpyCalls(nextFn, 1);
    assertEquals(res.status, response.status);
  },
);

Deno.test("analyticsMiddleware - skips non-GET requests", opts, async () => {
  const fetchSpy = spy(globalThis, "fetch");
  try {
    const handler = analyticsMiddleware(umamiConfig);
    const { ctx } = mockCtx({ method: "POST" });

    // deno-lint-ignore no-explicit-any
    await handler(ctx as any);

    // fetch should not be called for POST requests
    assertSpyCalls(fetchSpy, 0);
  } finally {
    fetchSpy.restore();
  }
});

Deno.test("analyticsMiddleware - skips non-HTML responses", opts, async () => {
  const fetchSpy = spy(globalThis, "fetch");
  try {
    const handler = analyticsMiddleware(umamiConfig);
    const { ctx } = mockCtx({
      responseHeaders: { "content-type": "application/json" },
    });

    // deno-lint-ignore no-explicit-any
    await handler(ctx as any);

    assertSpyCalls(fetchSpy, 0);
  } finally {
    fetchSpy.restore();
  }
});

Deno.test("analyticsMiddleware - skips asset paths", opts, async () => {
  const fetchSpy = spy(globalThis, "fetch");
  try {
    const handler = analyticsMiddleware(umamiConfig);
    const { ctx } = mockCtx({ url: "http://localhost:8000/_fresh/chunk.js" });

    // deno-lint-ignore no-explicit-any
    await handler(ctx as any);

    // Give the microtask a chance to run
    await flushAnalytics();
    assertSpyCalls(fetchSpy, 0);
  } finally {
    fetchSpy.restore();
  }
});

Deno.test(
  "analyticsMiddleware - works with plausible provider",
  opts,
  async () => {
    const handler = analyticsMiddleware(plausibleConfig);
    const { ctx, nextFn } = mockCtx();

    // deno-lint-ignore no-explicit-any
    const res = await handler(ctx as any);

    assertSpyCalls(nextFn, 1);
    assertEquals(res.status, 200);
  },
);

Deno.test(
  "analyticsMiddleware - resolves siteId from env var",
  opts,
  async () => {
    const prev = Deno.env.get("ANALYTICS_SITE_ID");
    try {
      Deno.env.set("ANALYTICS_SITE_ID", "env-website-id");
      const handler = analyticsMiddleware({ provider: "umami" });
      const { ctx, nextFn } = mockCtx();

      // deno-lint-ignore no-explicit-any
      const res = await handler(ctx as any);

      assertSpyCalls(nextFn, 1);
      assertEquals(res.status, 200);
    } finally {
      if (prev) Deno.env.set("ANALYTICS_SITE_ID", prev);
      else Deno.env.delete("ANALYTICS_SITE_ID");
    }
  },
);

Deno.test(
  "analyticsMiddleware - silently passes through when no siteId",
  opts,
  async () => {
    const prev = Deno.env.get("ANALYTICS_SITE_ID");
    try {
      Deno.env.delete("ANALYTICS_SITE_ID");
      const fetchSpy = spy(globalThis, "fetch");
      try {
        const handler = analyticsMiddleware({ provider: "umami" });
        const { ctx } = mockCtx();

        // deno-lint-ignore no-explicit-any
        await handler(ctx as any);

        await flushAnalytics();
        assertSpyCalls(fetchSpy, 0);
      } finally {
        fetchSpy.restore();
      }
    } finally {
      if (prev) Deno.env.set("ANALYTICS_SITE_ID", prev);
    }
  },
);

Deno.test(
  "analyticsMiddleware - works with custom provider",
  opts,
  async () => {
    const handler = analyticsMiddleware(customConfig);
    const { ctx, nextFn } = mockCtx();

    // deno-lint-ignore no-explicit-any
    const res = await handler(ctx as any);

    assertSpyCalls(nextFn, 1);
    assertEquals(res.status, 200);
  },
);

Deno.test("analyticsMiddleware - umami payload shape", opts, async () => {
  const fetchSpy = spy(globalThis, "fetch");
  try {
    const handler = analyticsMiddleware(umamiConfig);
    const { ctx } = mockCtx();

    // deno-lint-ignore no-explicit-any
    await handler(ctx as any);

    // Let the async sendEvent fire
    await flushAnalytics();

    assertSpyCalls(fetchSpy, 1);
    const [url, init] = fetchSpy.calls[0].args;
    assertEquals(url, "https://cloud.umami.is/api/send");
    assertEquals(init!.method, "POST");

    const body = JSON.parse(init!.body as string);
    assertEquals(body.type, "event");
    assertEquals(body.payload.website, "test-website-id");
    assertEquals(body.payload.url, "/docs/intro");
    assertEquals(body.payload.hostname, "localhost");
  } finally {
    fetchSpy.restore();
  }
});

Deno.test("analyticsMiddleware - plausible payload shape", opts, async () => {
  const fetchSpy = spy(globalThis, "fetch");
  try {
    const handler = analyticsMiddleware(plausibleConfig);
    const { ctx } = mockCtx();

    // deno-lint-ignore no-explicit-any
    await handler(ctx as any);

    await flushAnalytics();

    assertSpyCalls(fetchSpy, 1);
    const [url, init] = fetchSpy.calls[0].args;
    assertEquals(url, "https://plausible.io/api/event");

    const body = JSON.parse(init!.body as string);
    assertEquals(body.name, "pageview");
    assertEquals(body.domain, "example.com");
    assertEquals(body.url, "http://localhost:8000/docs/intro");
  } finally {
    fetchSpy.restore();
  }
});

Deno.test("analyticsMiddleware - custom payload shape", opts, async () => {
  const fetchSpy = spy(globalThis, "fetch");
  try {
    const handler = analyticsMiddleware(customConfig);
    const { ctx } = mockCtx();

    // deno-lint-ignore no-explicit-any
    await handler(ctx as any);

    await flushAnalytics();

    assertSpyCalls(fetchSpy, 1);
    const [url, init] = fetchSpy.calls[0].args;
    assertEquals(url, "https://my-analytics.example.com/collect");

    const body = JSON.parse(init!.body as string);
    assertEquals(body.event, "pageview");
    assertEquals(body.siteId, "my-site");
    assertEquals(body.path, "/docs/intro");
    assertEquals(body.hostname, "localhost");
    assertEquals(body.userAgent, "TestAgent/1.0");
    assertEquals(body.language, "en-US");
  } finally {
    fetchSpy.restore();
  }
});

Deno.test(
  "analyticsMiddleware - handles fetch errors gracefully",
  opts,
  async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = () => Promise.reject(new Error("network down"));
    const errorSpy = spy(console, "error");
    try {
      const handler = analyticsMiddleware(umamiConfig);
      const { ctx } = mockCtx();

      // deno-lint-ignore no-explicit-any
      const res = await handler(ctx as any);
      assertEquals(res.status, 200);

      // Let the async error handler run
      await flushAnalytics();

      assertEquals(
        errorSpy.calls.some((c) => String(c.args[1]).includes("network down")),
        true,
      );
    } finally {
      errorSpy.restore();
      globalThis.fetch = originalFetch;
    }
  },
);

Deno.test(
  "analyticsMiddleware - defaults endpoint for known providers",
  opts,
  async () => {
    const prev = Deno.env.get("ANALYTICS_SITE_ID");
    try {
      Deno.env.set("ANALYTICS_SITE_ID", "test-id");
      // No endpoint specified — should default to cloud.umami.is
      const handler = analyticsMiddleware({ provider: "umami" });
      const { ctx, nextFn } = mockCtx();

      // deno-lint-ignore no-explicit-any
      const res = await handler(ctx as any);

      assertSpyCalls(nextFn, 1);
      assertEquals(res.status, 200);
    } finally {
      if (prev) Deno.env.set("ANALYTICS_SITE_ID", prev);
      else Deno.env.delete("ANALYTICS_SITE_ID");
    }
  },
);
