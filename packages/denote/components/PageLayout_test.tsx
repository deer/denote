import { assertEquals, assertStringIncludes } from "jsr:@std/assert@1";
import { renderToString } from "preact-render-to-string";
import { PageLayout } from "./PageLayout.tsx";
import type { DenoteConfig } from "../denote.config.ts";
import type { State } from "../utils.ts";

/** Build a minimal PageProps-like object for testing PageLayout. */
function fakeCtx(
  config: DenoteConfig,
  url = "http://localhost:8000/test",
) {
  const ChildComponent = () => <p>child content</p>;

  // Cast through unknown — we only populate the fields PageLayout reads
  return {
    req: new Request(url),
    state: {
      denote: {
        config,
        contentDir: "./content/docs",
        docsBasePath: "/docs",
      },
    } as State,
    Component: ChildComponent,
  } as unknown as Parameters<typeof PageLayout>[0];
}

const minimalConfig: DenoteConfig = {
  name: "Test Site",
  navigation: [],
};

const configWithFooter: DenoteConfig = {
  ...minimalConfig,
  footer: {
    copyright: "© 2026 Test",
    links: [
      { title: "Privacy", href: "/privacy" },
      { title: "Impressum", href: "/impressum" },
    ],
  },
};

Deno.test("PageLayout - renders header", () => {
  const html = renderToString(<PageLayout {...fakeCtx(minimalConfig)} />);
  assertStringIncludes(html, "<header");
  assertStringIncludes(html, "Test Site");
});

Deno.test("PageLayout - renders child content", () => {
  const html = renderToString(<PageLayout {...fakeCtx(minimalConfig)} />);
  assertStringIncludes(html, "child content");
});

Deno.test("PageLayout - renders footer with links when configured", () => {
  const html = renderToString(<PageLayout {...fakeCtx(configWithFooter)} />);
  assertStringIncludes(html, "<footer");
  assertStringIncludes(html, "© 2026 Test");
  assertStringIncludes(html, "Privacy");
  assertStringIncludes(html, "/privacy");
  assertStringIncludes(html, "Impressum");
  assertStringIncludes(html, "/impressum");
});

Deno.test("PageLayout - no footer when not configured", () => {
  const html = renderToString(<PageLayout {...fakeCtx(minimalConfig)} />);
  assertEquals(html.includes("<footer"), false);
});

Deno.test("PageLayout - copyright falls back to site name", () => {
  const config: DenoteConfig = {
    ...minimalConfig,
    footer: { links: [] },
  };
  const html = renderToString(<PageLayout {...fakeCtx(config)} />);
  assertStringIncludes(html, "Test Site");
  assertStringIncludes(html, "<footer");
});

Deno.test("PageLayout - wraps content in main element", () => {
  const html = renderToString(<PageLayout {...fakeCtx(minimalConfig)} />);
  assertStringIncludes(html, "<main");
  // Child content should be inside main
  const mainStart = html.indexOf("<main");
  const childPos = html.indexOf("child content");
  const mainEnd = html.indexOf("</main>");
  assertEquals(mainStart < childPos && childPos < mainEnd, true);
});
