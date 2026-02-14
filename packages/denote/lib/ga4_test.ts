import { assertEquals } from "jsr:@std/assert@1";
import { assertSpyCalls, spy } from "jsr:@std/testing@1/mock";
import { ga4Middleware } from "./ga4.ts";

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
    req: new Request(url, { method }),
    next: nextFn,
    info: { remoteAddr: { hostname: "127.0.0.1", port: 0, transport: "tcp" } },
  };

  return { ctx, nextFn, response };
}

Deno.test("ga4Middleware - no env var: passes through and warns", async () => {
  // Ensure env var is unset
  const original = Deno.env.get("GA4_MEASUREMENT_ID");
  Deno.env.delete("GA4_MEASUREMENT_ID");

  const warnSpy = spy(console, "warn");
  try {
    const handler = ga4Middleware();
    const { ctx, nextFn } = mockCtx();

    // deno-lint-ignore no-explicit-any
    await handler(ctx as any);

    assertSpyCalls(nextFn, 1);
    // Warning should have been logged (at least once across all tests)
    assertEquals(
      warnSpy.calls.some((c) =>
        String(c.args[0]).includes("No measurement ID")
      ),
      true,
    );
  } finally {
    warnSpy.restore();
    if (original) Deno.env.set("GA4_MEASUREMENT_ID", original);
  }
});

// GA4 middleware fires background fetch requests (analytics beacons) that
// are intentionally not awaited. Disable Deno's leak sanitizers for these.
const ga4Opts = { sanitizeOps: false, sanitizeResources: false };

Deno.test(
  "ga4Middleware - with env var: passes through and returns response",
  ga4Opts,
  async () => {
    const original = Deno.env.get("GA4_MEASUREMENT_ID");
    Deno.env.set("GA4_MEASUREMENT_ID", "G-TEST12345");

    try {
      const handler = ga4Middleware();
      const { ctx, nextFn, response } = mockCtx();

      // deno-lint-ignore no-explicit-any
      const res = await handler(ctx as any);

      assertSpyCalls(nextFn, 1);
      assertEquals(res.status, response.status);
    } finally {
      if (original) {
        Deno.env.set("GA4_MEASUREMENT_ID", original);
      } else {
        Deno.env.delete("GA4_MEASUREMENT_ID");
      }
    }
  },
);

Deno.test(
  "ga4Middleware - with env var: error propagates",
  ga4Opts,
  async () => {
    const original = Deno.env.get("GA4_MEASUREMENT_ID");
    Deno.env.set("GA4_MEASUREMENT_ID", "G-TEST12345");

    try {
      const handler = ga4Middleware();
      const err = new Error("test boom");

      const ctx = {
        req: new Request("http://localhost:8000/docs/intro"),
        next: () => Promise.reject(err),
        info: {
          remoteAddr: { hostname: "127.0.0.1", port: 0, transport: "tcp" },
        },
      };

      let caught: Error | undefined;
      try {
        // deno-lint-ignore no-explicit-any
        await handler(ctx as any);
      } catch (e) {
        caught = e as Error;
      }

      assertEquals(caught?.message, "test boom");
    } finally {
      if (original) {
        Deno.env.set("GA4_MEASUREMENT_ID", original);
      } else {
        Deno.env.delete("GA4_MEASUREMENT_ID");
      }
    }
  },
);
