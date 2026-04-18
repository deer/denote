/**
 * HTTP-level integration tests for Denote endpoints.
 *
 * Uses denote() factory → app.handler() to test the full HTTP layer
 * without starting a server. Covers AI endpoints, API endpoints,
 * SEO endpoints, and MCP CORS preflight.
 */
import { assert, assertEquals, assertStringIncludes } from "jsr:@std/assert@1";
import { denote } from "../mod.ts";

// Prevent file watcher from starting during tests
Deno.env.set("DENO_TESTING", "1");

import { dirname, fromFileUrl, join } from "@std/path";

const __dirname = dirname(fromFileUrl(import.meta.url));
const contentDir = join(__dirname, "fixtures");

function createHandler() {
  const app = denote({
    config: {
      name: "Test Docs",
      navigation: [
        {
          title: "Guide",
          children: [
            { title: "Introduction", href: "/docs/introduction" },
            { title: "Installation", href: "/docs/installation" },
          ],
        },
      ],
      ai: { mcp: true },
      seo: { url: "https://example.com" },
    },
    contentDir,
    includeStaticFiles: false,
    includeErrorHandlers: false,
  });
  return app.handler();
}

const handler = createHandler();

async function request(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  return await handler(new Request(`http://localhost${path}`, init));
}

// ── /llms.txt ──────────────────────────────────────────────

Deno.test("GET /llms.txt - returns text with doc links", async () => {
  const res = await request("/llms.txt");
  assertEquals(res.status, 200);
  assertEquals(res.headers.get("content-type"), "text/plain; charset=utf-8");
  const text = await res.text();
  assertStringIncludes(text, "# Test Docs");
  assertStringIncludes(text, "introduction");
  assertStringIncludes(text, "llms-full.txt");
  assertStringIncludes(text, "/mcp");
});

// ── /llms-full.txt ─────────────────────────────────────────

Deno.test("GET /llms-full.txt - returns full docs dump", async () => {
  const res = await request("/llms-full.txt");
  assertEquals(res.status, 200);
  assertEquals(res.headers.get("content-type"), "text/plain; charset=utf-8");
  assert(res.headers.has("cache-control"));
  const text = await res.text();
  assertStringIncludes(text, "Complete Documentation");
  assertStringIncludes(text, "Introduction");
});

// ── /api/docs ──────────────────────────────────────────────

Deno.test("GET /api/docs - returns structured JSON", async () => {
  const res = await request("/api/docs");
  assertEquals(res.status, 200);
  assertEquals(res.headers.get("content-type"), "application/json");
  assert(res.headers.has("cache-control"));
  const json = await res.json();
  assertEquals(json.name, "Test Docs");
  assert(Array.isArray(json.pages));
  assert(json.pages.length > 0);
  // Should include MCP info since ai.mcp is enabled
  assert(json.mcp);
  assertEquals(json.mcp.transport, "Streamable HTTP");
});

// ── /api/search ────────────────────────────────────────────

Deno.test("GET /api/search - returns MiniSearch index", async () => {
  const res = await request("/api/search");
  assertEquals(res.status, 200);
  assertEquals(res.headers.get("content-type"), "application/json");
  assert(res.headers.has("cache-control"));
  const json = await res.json();
  // MiniSearch serialized index is an object, not an array
  assert(typeof json === "object" && !Array.isArray(json));
});

// ── /sitemap.xml ───────────────────────────────────────────

Deno.test("GET /sitemap.xml - returns valid XML", async () => {
  const res = await request("/sitemap.xml");
  assertEquals(res.status, 200);
  assertStringIncludes(
    res.headers.get("content-type") || "",
    "application/xml",
  );
  const text = await res.text();
  assertStringIncludes(text, '<?xml version="1.0"');
  assertStringIncludes(text, "<urlset");
  assertStringIncludes(text, "https://example.com");
});

// ── /robots.txt ────────────────────────────────────────────

Deno.test("GET /robots.txt - returns robots directives", async () => {
  const res = await request("/robots.txt");
  assertEquals(res.status, 200);
  const text = await res.text();
  assertStringIncludes(text, "User-agent");
  assertStringIncludes(text, "Sitemap");
  assertStringIncludes(text, "https://example.com");
});

// ── /mcp ───────────────────────────────────────────────────

Deno.test("OPTIONS /mcp - returns CORS preflight headers", async () => {
  const res = await request("/mcp", { method: "OPTIONS" });
  assertEquals(res.status, 204);
  assertEquals(res.headers.get("access-control-allow-origin"), "*");
  assertStringIncludes(
    res.headers.get("access-control-allow-methods") || "",
    "POST",
  );
  assertStringIncludes(
    res.headers.get("access-control-allow-headers") || "",
    "Content-Type",
  );
});

// ── /docs redirect ─────────────────────────────────────────

Deno.test("GET /docs - redirects to first nav page", async () => {
  const res = await request("/docs");
  assertEquals(res.status, 302);
  assertEquals(res.headers.get("location"), "/docs/introduction");
  await res.body?.cancel();
});

// ── Security headers ───────────────────────────────────────

Deno.test("Responses include security headers", async () => {
  const res = await request("/llms.txt");
  // CSP and other security headers should be set by middleware
  assert(
    res.headers.has("content-security-policy") ||
      res.headers.has("x-content-type-options"),
  );
  await res.text(); // consume body
});

// ── /manifest.json ─────────────────────────────────────────

Deno.test("GET /manifest.json - returns PWA manifest derived from config", async () => {
  const res = await request("/manifest.json");
  assertEquals(res.status, 200);
  assertStringIncludes(
    res.headers.get("content-type") || "",
    "manifest",
  );
  const json = await res.json();
  assertEquals(json.name, "Test Docs");
  assertEquals(json.start_url, "/");
  assert(Array.isArray(json.icons) && json.icons.length > 0);
});

// ── Trailing slash redirect ─────────────────────────────────

Deno.test("GET /docs/introduction/ - redirects to canonical path without trailing slash", async () => {
  const res = await request("/docs/introduction/");
  assert(res.status === 301 || res.status === 302);
  assertEquals(res.headers.get("location"), "/docs/introduction");
  await res.body?.cancel();
});

// ── HTML meta tags ─────────────────────────────────────────

function createHandlerWithSeoDescription() {
  const app = denote({
    config: {
      name: "Meta Test",
      navigation: [{
        title: "Guide",
        children: [{ title: "Introduction", href: "/docs/introduction" }],
      }],
      seo: {
        url: "https://example.com",
        description: "A custom site description",
      },
    },
    contentDir,
    includeStaticFiles: false,
    includeErrorHandlers: false,
  });
  return app.handler();
}

Deno.test("seo.description used as meta description fallback on pages without frontmatter description", async () => {
  // introduction.md fixture has no description in frontmatter
  const handler2 = createHandlerWithSeoDescription();
  const res = await handler2(
    new Request("http://localhost/docs/introduction"),
  );
  assertEquals(res.status, 200);
  const html = await res.text();
  assertStringIncludes(html, 'content="A custom site description"');
});

Deno.test("og:locale meta tag is emitted", async () => {
  const res = await request("/docs/introduction");
  assertEquals(res.status, 200);
  const html = await res.text();
  assertStringIncludes(html, 'property="og:locale"');
});

Deno.test("twitter:card is summary when no ogImage configured", async () => {
  const res = await request("/docs/introduction");
  assertEquals(res.status, 200);
  const html = await res.text();
  assertStringIncludes(html, 'content="summary"');
});

Deno.test("twitter:card is summary_large_image when ogImage configured", async () => {
  const app = denote({
    config: {
      name: "OG Test",
      navigation: [{
        title: "Guide",
        children: [{ title: "Introduction", href: "/docs/introduction" }],
      }],
      seo: {
        url: "https://example.com",
        ogImage: "https://example.com/og.png",
      },
    },
    contentDir,
    includeStaticFiles: false,
    includeErrorHandlers: false,
  });
  const res = await app.handler()(
    new Request("http://localhost/docs/introduction"),
  );
  assertEquals(res.status, 200);
  const html = await res.text();
  assertStringIncludes(html, 'content="summary_large_image"');
});

// ── "Powered by Denote" footer ──────────────────────────────

Deno.test("docs page includes Powered by Denote attribution by default", async () => {
  const res = await request("/docs/introduction");
  assertEquals(res.status, 200);
  const html = await res.text();
  assertStringIncludes(html, "denote.sh");
  assertStringIncludes(html, "Denote");
});

Deno.test("footer.poweredBy: false suppresses attribution", async () => {
  const app = denote({
    config: {
      name: "No Attribution",
      navigation: [{
        title: "Guide",
        children: [{ title: "Introduction", href: "/docs/introduction" }],
      }],
      footer: { poweredBy: false },
    },
    contentDir,
    includeStaticFiles: false,
    includeErrorHandlers: false,
  });
  const res = await app.handler()(
    new Request("http://localhost/docs/introduction"),
  );
  assertEquals(res.status, 200);
  const html = await res.text();
  // "denote.sh" link should not appear
  assert(!html.includes("denote.sh"));
});
