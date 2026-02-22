import { assertEquals } from "jsr:@std/assert@1";
import { setConfig } from "./config.ts";

Deno.test("setConfig - accepts valid config without warnings", () => {
  const warnings: string[] = [];
  const origWarn = console.warn;
  console.warn = (msg: string) => warnings.push(msg);

  setConfig({
    name: "Test Site",
    navigation: [{ title: "Home", href: "/docs/home" }],
  });

  console.warn = origWarn;
  assertEquals(
    warnings.filter((w) => w.includes("Config validation")).length,
    0,
  );
});

Deno.test("setConfig - warns on empty name", () => {
  const warnings: string[] = [];
  const origWarn = console.warn;
  console.warn = (msg: string) => warnings.push(msg);

  setConfig({ name: "", navigation: [{ title: "X" }] });

  console.warn = origWarn;
  assertEquals(
    warnings.some((w) => w.includes("name")),
    true,
  );
});

Deno.test("setConfig - warns on invalid hex color", () => {
  const warnings: string[] = [];
  const origWarn = console.warn;
  console.warn = (msg: string) => warnings.push(msg);

  setConfig({
    name: "Test",
    navigation: [{ title: "X", href: "/docs/x" }],
    colors: { primary: "red" },
  });

  console.warn = origWarn;
  assertEquals(
    warnings.some((w) => w.includes("valid hex color")),
    true,
  );
});

Deno.test("setConfig - accepts valid hex colors without warnings", () => {
  const warnings: string[] = [];
  const origWarn = console.warn;
  console.warn = (msg: string) => warnings.push(msg);

  setConfig({
    name: "Test",
    navigation: [{ title: "X", href: "/docs/x" }],
    colors: { primary: "#ff0000" },
  });

  console.warn = origWarn;
  assertEquals(
    warnings.filter((w) => w.includes("Config validation")).length,
    0,
  );
});

Deno.test("setConfig - accepts 3-digit and 8-digit hex colors", () => {
  const warnings: string[] = [];
  const origWarn = console.warn;
  console.warn = (msg: string) => warnings.push(msg);

  setConfig({
    name: "Test",
    navigation: [{ title: "X", href: "/docs/x" }],
    colors: { primary: "#f00", accent: "#ff000080" },
  });

  console.warn = origWarn;
  assertEquals(
    warnings.filter((w) => w.includes("Config validation")).length,
    0,
  );
});

Deno.test("setConfig - does not throw on invalid config", () => {
  const origWarn = console.warn;
  console.warn = () => {};

  // Should warn but not throw — the app continues with defaults
  // @ts-ignore: intentionally testing invalid config
  setConfig({ name: "", navigation: [] });

  console.warn = origWarn;
  // If we got here, setConfig didn't throw — that's the assertion
});

// ---------------------------------------------------------------------------
// SEO config validation
// ---------------------------------------------------------------------------

Deno.test("setConfig - accepts valid seo config without warnings", () => {
  const warnings: string[] = [];
  const origWarn = console.warn;
  console.warn = (msg: string) => warnings.push(msg);

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

  console.warn = origWarn;
  assertEquals(
    warnings.filter((w) => w.includes("Config validation")).length,
    0,
  );
});

Deno.test("setConfig - warns on invalid seo.url", () => {
  const warnings: string[] = [];
  const origWarn = console.warn;
  console.warn = (msg: string) => warnings.push(msg);

  setConfig({
    name: "Test",
    navigation: [{ title: "X", href: "/docs/x" }],
    seo: { url: "not-a-url" },
  });

  console.warn = origWarn;
  assertEquals(
    warnings.some((w) => w.includes("seo.url")),
    true,
  );
});

Deno.test("setConfig - warns on invalid seo.ogImage", () => {
  const warnings: string[] = [];
  const origWarn = console.warn;
  console.warn = (msg: string) => warnings.push(msg);

  setConfig({
    name: "Test",
    navigation: [{ title: "X", href: "/docs/x" }],
    seo: { ogImage: "not-a-url" },
  });

  console.warn = origWarn;
  assertEquals(
    warnings.some((w) => w.includes("seo.ogImage")),
    true,
  );
});

// ---------------------------------------------------------------------------
// Landing config validation
// ---------------------------------------------------------------------------

Deno.test("setConfig - accepts valid landing config without warnings", () => {
  const warnings: string[] = [];
  const origWarn = console.warn;
  console.warn = (msg: string) => warnings.push(msg);

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

  console.warn = origWarn;
  assertEquals(
    warnings.filter((w) => w.includes("Config validation")).length,
    0,
  );
});

Deno.test("setConfig - warns on landing.hero missing title", () => {
  const warnings: string[] = [];
  const origWarn = console.warn;
  console.warn = (msg: string) => warnings.push(msg);

  setConfig({
    name: "Test",
    navigation: [{ title: "X", href: "/docs/x" }],
    // @ts-ignore: intentionally omitting required hero.title
    landing: { hero: { badge: "Open Source" } },
  });

  console.warn = origWarn;
  assertEquals(
    warnings.some((w) => w.includes("landing")),
    true,
  );
});
