import { assertEquals, assertNotEquals } from "jsr:@std/assert@1";
import { csp } from "./csp.ts";

/** Call the csp middleware with a dummy context and return the CSP header */
async function getCspHeader(
  ...args: Parameters<typeof csp>
): Promise<string> {
  const middleware = csp(...args);
  const res = await middleware({
    next: () => Promise.resolve(new Response("ok")),
  });
  return res.headers.get("Content-Security-Policy") ?? "";
}

/** Parse a CSP string into a map of directive-name → full directive */
function parseDirectives(header: string): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const part of header.split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const name = trimmed.split(/\s+/)[0];
    const existing = map.get(name) ?? [];
    existing.push(trimmed);
    map.set(name, existing);
  }
  return map;
}

// ---------------------------------------------------------------------------
// Core fix: custom directives override defaults by name
// ---------------------------------------------------------------------------

Deno.test("csp - custom directive overrides default by name", async () => {
  const header = await getCspHeader({
    csp: ["font-src 'self' https://fonts.gstatic.com"],
  });
  const directives = parseDirectives(header);

  // Must contain exactly ONE font-src directive (the custom one)
  assertEquals(directives.get("font-src")?.length, 1);
  assertEquals(
    directives.get("font-src")?.[0],
    "font-src 'self' https://fonts.gstatic.com",
  );
});

Deno.test("csp - no duplicate directive names when overriding", async () => {
  const header = await getCspHeader({
    csp: [
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
    ],
  });
  const directives = parseDirectives(header);

  // Every directive name must appear exactly once
  for (const [name, occurrences] of directives) {
    assertEquals(
      occurrences.length,
      1,
      `directive "${name}" appears ${occurrences.length} times — duplicates break CSP (browsers ignore all but the first)`,
    );
  }
});

Deno.test("csp - override values are actually present in header", async () => {
  const header = await getCspHeader({
    csp: ["font-src 'self' https://fonts.gstatic.com"],
  });

  // The custom value must be in the final header, not silently dropped
  assertNotEquals(
    header.indexOf("https://fonts.gstatic.com"),
    -1,
    "custom font-src value missing from CSP header",
  );

  // The default-only version must NOT be present as a separate directive
  const directives = parseDirectives(header);
  const fontDirective = directives.get("font-src")?.[0] ?? "";
  assertNotEquals(
    fontDirective,
    "font-src 'self'",
    "default font-src was not overridden",
  );
});

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

Deno.test("csp - includes all default directives when no overrides", async () => {
  const header = await getCspHeader();
  const directives = parseDirectives(header);

  const expected = [
    "default-src",
    "script-src",
    "style-src",
    "font-src",
    "img-src",
    "media-src",
    "worker-src",
    "connect-src",
    "object-src",
    "base-uri",
    "form-action",
    "frame-ancestors",
    "upgrade-insecure-requests",
  ];
  for (const name of expected) {
    assertEquals(
      directives.has(name),
      true,
      `missing default directive: ${name}`,
    );
  }
});

Deno.test("csp - new directive types are appended", async () => {
  const header = await getCspHeader({
    csp: ["child-src 'self'"],
  });
  const directives = parseDirectives(header);

  assertEquals(directives.has("child-src"), true);
  assertEquals(directives.get("child-src")?.[0], "child-src 'self'");
});

// ---------------------------------------------------------------------------
// reportOnly / reportTo
// ---------------------------------------------------------------------------

Deno.test("csp - reportOnly uses Report-Only header", async () => {
  const middleware = csp({ reportOnly: true });
  const res = await middleware({
    next: () => Promise.resolve(new Response("ok")),
  });

  assertEquals(res.headers.has("Content-Security-Policy-Report-Only"), true);
  assertEquals(res.headers.has("Content-Security-Policy"), false);
});

Deno.test("csp - reportTo adds reporting directives and endpoint header", async () => {
  const middleware = csp({ reportTo: "/api/csp-reports" });
  const res = await middleware({
    next: () => Promise.resolve(new Response("ok")),
  });

  const header = res.headers.get("Content-Security-Policy") ?? "";
  const directives = parseDirectives(header);

  assertEquals(directives.has("report-to"), true);
  assertEquals(directives.has("report-uri"), true);
  assertEquals(
    directives.get("report-uri")?.[0],
    "report-uri /api/csp-reports",
  );
  assertEquals(
    res.headers.get("Reporting-Endpoints"),
    'csp-endpoint="/api/csp-reports"',
  );
});
