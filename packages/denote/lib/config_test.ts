import { assertEquals, assertThrows } from "jsr:@std/assert@1";
import {
  _resetConfigForTesting,
  getConfig,
  getDocsBasePath,
  setConfig,
  setDocsBasePath,
} from "./config.ts";

/** Capture console.warn calls during fn(), restoring console.warn even if fn throws. */
function captureWarnings(fn: () => void): string[] {
  const warnings: string[] = [];
  const origWarn = console.warn;
  console.warn = (...args: unknown[]) => warnings.push(String(args[0]));
  try {
    fn();
  } finally {
    console.warn = origWarn;
  }
  return warnings;
}

Deno.test("setConfig - accepts valid config without warnings", () => {
  const warnings = captureWarnings(() => {
    setConfig({
      name: "Test Site",
      navigation: [{ title: "Home", href: "/docs/home" }],
    });
  });

  assertEquals(
    warnings.filter((w) => w.includes("Config validation")).length,
    0,
  );
});

Deno.test("setConfig - warns on empty name", () => {
  const warnings = captureWarnings(() => {
    setConfig({ name: "", navigation: [{ title: "X" }] });
  });

  assertEquals(
    warnings.some((w) => w.includes("name")),
    true,
  );
});

Deno.test("setConfig - warns on invalid hex color", () => {
  const warnings = captureWarnings(() => {
    setConfig({
      name: "Test",
      navigation: [{ title: "X", href: "/docs/x" }],
      colors: { primary: "red" },
    });
  });

  assertEquals(
    warnings.some((w) => w.includes("valid hex color")),
    true,
  );
});

Deno.test("setConfig - accepts valid hex colors without warnings", () => {
  const warnings = captureWarnings(() => {
    setConfig({
      name: "Test",
      navigation: [{ title: "X", href: "/docs/x" }],
      colors: { primary: "#ff0000" },
    });
  });

  assertEquals(
    warnings.filter((w) => w.includes("Config validation")).length,
    0,
  );
});

Deno.test("setConfig - accepts 3-digit and 8-digit hex colors", () => {
  const warnings = captureWarnings(() => {
    setConfig({
      name: "Test",
      navigation: [{ title: "X", href: "/docs/x" }],
      colors: { primary: "#f00", accent: "#ff000080" },
    });
  });

  assertEquals(
    warnings.filter((w) => w.includes("Config validation")).length,
    0,
  );
});

Deno.test("setConfig - does not throw on invalid config", () => {
  captureWarnings(() => {
    // Should warn but not throw — the app continues with defaults
    // @ts-ignore: intentionally testing invalid config
    setConfig({ name: "", navigation: [] });
  });
  // If we got here, setConfig didn't throw — that's the assertion
});

// ---------------------------------------------------------------------------
// SEO config validation
// ---------------------------------------------------------------------------

Deno.test("setConfig - accepts valid seo config without warnings", () => {
  const warnings = captureWarnings(() => {
    setConfig({
      name: "Test",
      navigation: [{ title: "X", href: "/docs/x" }],
      seo: {
        url: "https://denote.sh",
        ogImage: "https://denote.sh/og.png",
        ogImageWidth: 1200,
        ogImageHeight: 630,
        locale: "en",
        jsonLdType: "WebSite",
      },
    });
  });

  assertEquals(
    warnings.filter((w) => w.includes("Config validation")).length,
    0,
  );
});

Deno.test("setConfig - warns on invalid seo.url", () => {
  const warnings = captureWarnings(() => {
    setConfig({
      name: "Test",
      navigation: [{ title: "X", href: "/docs/x" }],
      seo: { url: "not-a-url" },
    });
  });

  assertEquals(
    warnings.some((w) => w.includes("seo.url")),
    true,
  );
});

Deno.test("setConfig - warns on invalid seo.ogImage", () => {
  const warnings = captureWarnings(() => {
    setConfig({
      name: "Test",
      navigation: [{ title: "X", href: "/docs/x" }],
      seo: { ogImage: "not-a-url" },
    });
  });

  assertEquals(
    warnings.some((w) => w.includes("seo.ogImage")),
    true,
  );
});

// ---------------------------------------------------------------------------
// Landing config validation
// ---------------------------------------------------------------------------

Deno.test("setConfig - accepts valid landing config without warnings", () => {
  const warnings = captureWarnings(() => {
    setConfig({
      name: "Test",
      navigation: [{ title: "X", href: "/docs/x" }],
      landing: {
        enabled: true,
        hero: {
          badge: "Open Source",
          title: "My Docs",
          titleHighlight: "Docs",
          subtitle: "A subtitle",
          description: "Some description text.",
        },
        cta: {
          primary: { text: "Get Started", href: "/docs" },
          secondary: { text: "GitHub", href: "https://github.com/example" },
        },
        install: "deno add @example/lib",
        features: [
          { icon: "📝", title: "Markdown", description: "Write in Markdown." },
          { title: "Fast", description: "Very fast." },
        ],
      },
    });
  });

  assertEquals(
    warnings.filter((w) => w.includes("Config validation")).length,
    0,
  );
});

Deno.test("setConfig - warns on landing.hero missing title", () => {
  const warnings = captureWarnings(() => {
    setConfig({
      name: "Test",
      navigation: [{ title: "X", href: "/docs/x" }],
      // @ts-ignore: intentionally omitting required hero.title
      landing: { hero: { badge: "Open Source" } },
    });
  });

  assertEquals(
    warnings.some((w) => w.includes("landing")),
    true,
  );
});

// ---------------------------------------------------------------------------
// Strict mode — unrecognized keys
// ---------------------------------------------------------------------------

Deno.test("setConfig - warns on unrecognized top-level key", () => {
  const warnings = captureWarnings(() => {
    setConfig({
      name: "Test",
      navigation: [{ title: "X", href: "/docs/x" }],
      // @ts-ignore: intentionally testing unknown key
      darkmode: "toggle",
    });
  });
  assertEquals(warnings.some((w) => w.includes("darkmode")), true);
});

// ---------------------------------------------------------------------------
// New field validation
// ---------------------------------------------------------------------------

Deno.test("setConfig - warns on invalid style.darkMode enum", () => {
  const warnings = captureWarnings(() => {
    setConfig({
      name: "Test",
      navigation: [{ title: "X", href: "/docs/x" }],
      // @ts-ignore: intentionally testing invalid enum
      style: { darkMode: "maybe" },
    });
  });
  assertEquals(warnings.some((w) => w.includes("style")), true);
});

Deno.test("setConfig - warns on invalid style.roundedness enum", () => {
  const warnings = captureWarnings(() => {
    setConfig({
      name: "Test",
      navigation: [{ title: "X", href: "/docs/x" }],
      // @ts-ignore: intentionally testing invalid enum
      style: { roundedness: "huge" },
    });
  });
  assertEquals(warnings.some((w) => w.includes("style")), true);
});

Deno.test("setConfig - warns on invalid analytics.provider enum", () => {
  const warnings = captureWarnings(() => {
    setConfig({
      name: "Test",
      navigation: [{ title: "X", href: "/docs/x" }],
      // @ts-ignore: intentionally testing invalid enum
      analytics: { provider: "google" },
    });
  });
  assertEquals(warnings.some((w) => w.includes("analytics")), true);
});

Deno.test("setConfig - warns on invalid layout.sidebarWidth type", () => {
  const warnings = captureWarnings(() => {
    setConfig({
      name: "Test",
      navigation: [{ title: "X", href: "/docs/x" }],
      // @ts-ignore: intentionally testing invalid type
      layout: { sidebarWidth: "wide" },
    });
  });
  assertEquals(warnings.some((w) => w.includes("layout")), true);
});

Deno.test("setConfig - accepts full valid config without warnings", () => {
  const warnings = captureWarnings(() => {
    setConfig({
      name: "Test",
      navigation: [{ title: "X", href: "/docs/x" }],
      logo: { text: "test", suffix: ".dev" },
      favicon: "/favicon.svg",
      colors: { primary: "#ff0000" },
      fonts: {
        body: "Inter",
        heading: "Inter",
        mono: "Fira Code",
        imports: ["/fonts.css"],
      },
      style: {
        darkMode: "toggle",
        roundedness: "lg",
        customCss: "/custom.css",
      },
      layout: {
        sidebarWidth: 280,
        headerHeight: 64,
        toc: true,
        breadcrumbs: true,
        footer: true,
      },
      topNav: [{ title: "Docs", href: "/docs" }],
      footer: {
        copyright: "2026",
        links: [{ title: "GH", href: "https://github.com" }],
      },
      social: { github: "https://github.com/example" },
      search: { enabled: true },
      analytics: { provider: "umami" },
      editUrl: "https://github.com/org/repo/edit/main/docs",
      seo: { url: "https://example.com" },
      landing: { enabled: true, hero: { title: "Hello" } },
      ai: { mcp: true },
    });
  });
  assertEquals(
    warnings.filter((w) => w.includes("Config validation")).length,
    0,
  );
});

// ---------------------------------------------------------------------------
// Locale validation (BCP 47-like)
// ---------------------------------------------------------------------------

Deno.test("setConfig - accepts valid locale tags", () => {
  for (const locale of ["en", "en-US", "zh-Hant-TW", "pt-BR"]) {
    const warnings = captureWarnings(() => {
      setConfig({
        name: "Test",
        navigation: [{ title: "X", href: "/docs/x" }],
        seo: { locale },
      });
    });
    assertEquals(
      warnings.some((w) => w.includes("locale")),
      false,
      `Expected no warning for locale "${locale}"`,
    );
  }
});

Deno.test("setConfig - warns on invalid locale", () => {
  for (const locale of ["123", "e", "en_US", "javascript:alert(1)"]) {
    const warnings = captureWarnings(() => {
      setConfig({
        name: "Test",
        navigation: [{ title: "X", href: "/docs/x" }],
        seo: { locale },
      });
    });
    assertEquals(
      warnings.some((w) => w.includes("locale")),
      true,
      `Expected warning for locale "${locale}"`,
    );
  }
});

// ---------------------------------------------------------------------------
// Safe href validation (blocks javascript: URIs)
// ---------------------------------------------------------------------------

Deno.test("setConfig - warns on javascript: href in navigation", () => {
  const warnings = captureWarnings(() => {
    setConfig({
      name: "Test",
      // @ts-ignore: intentionally testing dangerous href
      navigation: [{ title: "X", href: "javascript:alert(1)" }],
    });
  });
  assertEquals(warnings.some((w) => w.includes("javascript:")), true);
});

Deno.test("setConfig - warns on javascript: href in topNav", () => {
  const warnings = captureWarnings(() => {
    setConfig({
      name: "Test",
      navigation: [{ title: "X", href: "/docs/x" }],
      // @ts-ignore: intentionally testing dangerous href
      topNav: [{ title: "Evil", href: "javascript:alert(1)" }],
    });
  });
  assertEquals(warnings.some((w) => w.includes("javascript:")), true);
});

Deno.test("setConfig - warns on javascript: href in footer links", () => {
  const warnings = captureWarnings(() => {
    setConfig({
      name: "Test",
      navigation: [{ title: "X", href: "/docs/x" }],
      // @ts-ignore: intentionally testing dangerous href
      footer: { links: [{ title: "Evil", href: "javascript:void(0)" }] },
    });
  });
  assertEquals(warnings.some((w) => w.includes("javascript:")), true);
});

Deno.test("setConfig - warns on data: URI in logo", () => {
  const warnings = captureWarnings(() => {
    setConfig({
      name: "Test",
      navigation: [{ title: "X", href: "/docs/x" }],
      // @ts-ignore: intentionally testing dangerous URI
      logo: { light: "data:image/svg+xml,<svg/>" },
    });
  });
  assertEquals(warnings.some((w) => w.includes("data:")), true);
});

Deno.test("setConfig - accepts safe hrefs (local paths and http URLs)", () => {
  const warnings = captureWarnings(() => {
    setConfig({
      name: "Test",
      navigation: [{ title: "X", href: "/docs/x" }],
      topNav: [{ title: "Docs", href: "/docs" }],
      footer: { links: [{ title: "GH", href: "https://github.com" }] },
      logo: { light: "/logo.svg", dark: "https://example.com/logo.png" },
      landing: {
        hero: { title: "Hi" },
        cta: {
          primary: { text: "Go", href: "/docs" },
          secondary: { text: "Code", href: "https://github.com" },
        },
      },
    });
  });
  assertEquals(
    warnings.filter((w) => w.includes("Config validation")).length,
    0,
  );
});

// ---------------------------------------------------------------------------
// fonts.imports validation
// ---------------------------------------------------------------------------

Deno.test("setConfig - warns on javascript: in fonts.imports", () => {
  const warnings = captureWarnings(() => {
    setConfig({
      name: "Test",
      navigation: [{ title: "X", href: "/docs/x" }],
      // @ts-ignore: intentionally testing dangerous URI
      fonts: { imports: ["javascript:alert(1)"] },
    });
  });
  assertEquals(warnings.some((w) => w.includes("javascript:")), true);
});

Deno.test("setConfig - accepts safe fonts.imports", () => {
  const warnings = captureWarnings(() => {
    setConfig({
      name: "Test",
      navigation: [{ title: "X", href: "/docs/x" }],
      fonts: {
        imports: [
          "/fonts.css",
          "https://fonts.googleapis.com/css2?family=Inter",
        ],
      },
    });
  });
  assertEquals(
    warnings.filter((w) => w.includes("Config validation")).length,
    0,
  );
});

// ---------------------------------------------------------------------------
// analytics.endpoint validation
// ---------------------------------------------------------------------------

Deno.test("setConfig - warns on non-HTTPS analytics endpoint", () => {
  const warnings = captureWarnings(() => {
    setConfig({
      name: "Test",
      navigation: [{ title: "X", href: "/docs/x" }],
      analytics: { provider: "umami", endpoint: "http://internal:9090/api" },
    });
  });
  assertEquals(warnings.some((w) => w.includes("HTTPS")), true);
});

Deno.test("setConfig - warns on non-URL analytics endpoint", () => {
  const warnings = captureWarnings(() => {
    setConfig({
      name: "Test",
      navigation: [{ title: "X", href: "/docs/x" }],
      analytics: { provider: "umami", endpoint: "not-a-url" },
    });
  });
  assertEquals(warnings.some((w) => w.includes("analytics")), true);
});

Deno.test("setConfig - accepts valid HTTPS analytics endpoint", () => {
  const warnings = captureWarnings(() => {
    setConfig({
      name: "Test",
      navigation: [{ title: "X", href: "/docs/x" }],
      analytics: {
        provider: "umami",
        endpoint: "https://analytics.example.com/api",
      },
    });
  });
  assertEquals(
    warnings.filter((w) => w.includes("Config validation")).length,
    0,
  );
});

// ---------------------------------------------------------------------------
// editUrl validation
// ---------------------------------------------------------------------------

Deno.test("setConfig - warns on invalid editUrl", () => {
  const warnings = captureWarnings(() => {
    setConfig({
      name: "Test",
      navigation: [{ title: "X", href: "/docs/x" }],
      editUrl: "not-a-url",
    });
  });
  assertEquals(warnings.some((w) => w.includes("editUrl")), true);
});

// ---------------------------------------------------------------------------
// setDocsBasePath normalization
// ---------------------------------------------------------------------------

Deno.test("setDocsBasePath - adds leading slash", () => {
  const saved = getDocsBasePath();
  try {
    setDocsBasePath("docs");
    assertEquals(getDocsBasePath(), "/docs");
  } finally {
    setDocsBasePath(saved);
  }
});

Deno.test("setDocsBasePath - strips trailing slash", () => {
  const saved = getDocsBasePath();
  try {
    setDocsBasePath("/docs/");
    assertEquals(getDocsBasePath(), "/docs");
  } finally {
    setDocsBasePath(saved);
  }
});

Deno.test("setDocsBasePath - preserves root slash", () => {
  const saved = getDocsBasePath();
  try {
    setDocsBasePath("/");
    assertEquals(getDocsBasePath(), "/");
  } finally {
    setDocsBasePath(saved);
  }
});

Deno.test("setDocsBasePath - normalizes bare path with trailing slash", () => {
  const saved = getDocsBasePath();
  try {
    setDocsBasePath("guide/");
    assertEquals(getDocsBasePath(), "/guide");
  } finally {
    setDocsBasePath(saved);
  }
});

Deno.test("setDocsBasePath - already normalized is unchanged", () => {
  const saved = getDocsBasePath();
  try {
    setDocsBasePath("/docs");
    assertEquals(getDocsBasePath(), "/docs");
  } finally {
    setDocsBasePath(saved);
  }
});

// ---------------------------------------------------------------------------
// getConfig after reset
// ---------------------------------------------------------------------------

Deno.test("getConfig - throws after _resetConfigForTesting", () => {
  _resetConfigForTesting();
  try {
    assertThrows(
      () => getConfig(),
      Error,
      "not initialized",
    );
  } finally {
    // Restore config so subsequent tests still work
    setConfig({
      name: "Denote",
      navigation: [{ title: "X", href: "/docs/x" }],
    });
  }
});
