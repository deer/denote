import { assertEquals, assertStringIncludes } from "jsr:@std/assert@1";
import { generateThemeCSS } from "./theme.ts";
import type { DenoteConfig } from "../denote.config.ts";

/** Helper: minimal config */
function cfg(overrides: Partial<DenoteConfig> = {}): DenoteConfig {
  return { name: "Test", navigation: [], ...overrides } as DenoteConfig;
}

// --- Empty / no-op ---

Deno.test("generateThemeCSS - empty string when no colors or fonts", () => {
  assertEquals(generateThemeCSS(cfg()), "");
});

// --- Primary color ---

Deno.test("generateThemeCSS - primary color and derived variants", () => {
  const css = generateThemeCSS(cfg({ colors: { primary: "#ff0000" } }));
  assertStringIncludes(css, "html:root {");
  assertStringIncludes(css, "--denote-primary: #ff0000;");
  assertStringIncludes(
    css,
    "--denote-primary-hover: color-mix(in srgb, #ff0000 85%, black);",
  );
  assertStringIncludes(
    css,
    "--denote-primary-subtle: color-mix(in srgb, #ff0000 12%, white);",
  );
  assertStringIncludes(css, "--denote-primary-text: #ff0000;");
  assertStringIncludes(
    css,
    "--denote-shadow-primary: color-mix(in srgb, #ff0000 25%, transparent);",
  );
});

Deno.test("generateThemeCSS - auto-derives dark primary from light", () => {
  const css = generateThemeCSS(cfg({ colors: { primary: "#ff0000" } }));
  assertStringIncludes(css, "html:root.dark {");
  assertStringIncludes(css, "color-mix(in srgb, #ff0000 70%, white)");
});

// --- Accent ---

Deno.test("generateThemeCSS - accent color", () => {
  const css = generateThemeCSS(
    cfg({ colors: { primary: "#000", accent: "#00ff00" } }),
  );
  assertStringIncludes(css, "--denote-accent: #00ff00;");
});

Deno.test("generateThemeCSS - auto-derives dark accent", () => {
  const css = generateThemeCSS(
    cfg({ colors: { primary: "#000", accent: "#00ff00" } }),
  );
  assertStringIncludes(css, "html:root.dark {");
  assertStringIncludes(css, "color-mix(in srgb, #00ff00 70%, white)");
});

// --- Background + surface ---

Deno.test("generateThemeCSS - background and surface-overlay", () => {
  const css = generateThemeCSS(
    cfg({ colors: { primary: "#000", background: "#fef3c7" } }),
  );
  assertStringIncludes(css, "--denote-bg: #fef3c7;");
  assertStringIncludes(
    css,
    "--denote-surface-overlay: color-mix(in srgb, #fef3c7 80%, transparent);",
  );
});

Deno.test("generateThemeCSS - surface tertiary derived from background", () => {
  const css = generateThemeCSS(
    cfg({
      colors: { primary: "#000", background: "#fef3c7", surface: "#fde68a" },
    }),
  );
  assertStringIncludes(css, "--denote-bg-secondary: #fde68a;");
  assertStringIncludes(
    css,
    "--denote-bg-tertiary: color-mix(in srgb, #fde68a 80%, #fef3c7);",
  );
});

Deno.test("generateThemeCSS - surface falls back to white without background", () => {
  const css = generateThemeCSS(
    cfg({ colors: { primary: "#000", surface: "#fde68a" } }),
  );
  assertStringIncludes(
    css,
    "--denote-bg-tertiary: color-mix(in srgb, #fde68a 80%, white);",
  );
});

// --- Text ---

Deno.test("generateThemeCSS - text and derived secondary/muted", () => {
  const css = generateThemeCSS(
    cfg({
      colors: { primary: "#000", text: "#451a03", background: "#fef3c7" },
    }),
  );
  assertStringIncludes(css, "--denote-text: #451a03;");
  assertStringIncludes(
    css,
    "--denote-text-secondary: color-mix(in srgb, #451a03 70%, #fef3c7);",
  );
  assertStringIncludes(
    css,
    "--denote-text-muted: color-mix(in srgb, #451a03 45%, #fef3c7);",
  );
});

// --- Border ---

Deno.test("generateThemeCSS - border and derived border-strong", () => {
  const css = generateThemeCSS(
    cfg({ colors: { primary: "#000", border: "#d97706", text: "#451a03" } }),
  );
  assertStringIncludes(css, "--denote-border: #d97706;");
  assertStringIncludes(
    css,
    "--denote-border-strong: color-mix(in srgb, #d97706 80%, #451a03);",
  );
});

// --- Fonts ---

Deno.test("generateThemeCSS - font families", () => {
  const css = generateThemeCSS(cfg({
    fonts: {
      body: '"Source Sans 3", sans-serif',
      heading: '"Newsreader", serif',
      mono: '"JetBrains Mono", monospace',
    },
  }));
  assertStringIncludes(css, '--denote-font-body: "Source Sans 3", sans-serif;');
  assertStringIncludes(css, '--denote-font-heading: "Newsreader", serif;');
  assertStringIncludes(
    css,
    '--denote-font-mono: "JetBrains Mono", monospace;',
  );
});

Deno.test("generateThemeCSS - fonts alone trigger CSS generation", () => {
  const css = generateThemeCSS(cfg({ fonts: { body: "Inter, sans-serif" } }));
  assertStringIncludes(css, "html:root {");
  assertStringIncludes(css, "--denote-font-body: Inter, sans-serif;");
});

Deno.test("generateThemeCSS - fonts without colors produce no dark block", () => {
  const css = generateThemeCSS(cfg({ fonts: { body: "Inter, sans-serif" } }));
  assertEquals(css.includes("html:root.dark"), false);
});

// --- Explicit dark overrides ---

Deno.test("generateThemeCSS - explicit dark overrides", () => {
  const css = generateThemeCSS(cfg({
    colors: {
      primary: "#b45309",
      dark: {
        primary: "#f59e0b",
        background: "#042f2e",
        surface: "#0f766e",
        text: "#ccfbf1",
        border: "#115e59",
      },
    },
  }));
  assertStringIncludes(css, "--denote-primary: #b45309;");
  const darkBlock = css.split("html:root.dark {")[1];
  assertStringIncludes(darkBlock, "--denote-primary: #f59e0b;");
  assertStringIncludes(darkBlock, "--denote-bg: #042f2e;");
  assertStringIncludes(darkBlock, "--denote-bg-secondary: #0f766e;");
  assertStringIncludes(darkBlock, "--denote-text: #ccfbf1;");
  assertStringIncludes(darkBlock, "--denote-border: #115e59;");
});

// --- Full integration ---

Deno.test("generateThemeCSS - full config produces light and dark blocks", () => {
  const css = generateThemeCSS(cfg({
    colors: {
      primary: "#b45309",
      accent: "#059669",
      background: "#fef3c7",
      surface: "#fde68a",
      text: "#451a03",
      border: "#d97706",
      dark: {
        primary: "#f59e0b",
        accent: "#34d399",
        background: "#042f2e",
        surface: "#0f766e",
        text: "#ccfbf1",
        border: "#115e59",
      },
    },
    fonts: { body: "Inter, sans-serif", heading: "Newsreader, serif" },
  }));

  assertEquals(css.includes("html:root {"), true);
  assertEquals(css.includes("html:root.dark {"), true);
  assertStringIncludes(css, "--denote-primary: #b45309;");
  assertStringIncludes(css, "--denote-accent: #059669;");
  assertStringIncludes(css, "--denote-bg: #fef3c7;");
  assertStringIncludes(css, "--denote-text: #451a03;");
  assertStringIncludes(css, "--denote-border: #d97706;");
  assertStringIncludes(css, "--denote-font-body: Inter, sans-serif;");
});

// --- Selector specificity ---

Deno.test("generateThemeCSS - uses html:root for specificity", () => {
  const css = generateThemeCSS(cfg({ colors: { primary: "#000" } }));
  assertEquals(css.startsWith("html:root {"), true);
  assertEquals(css.startsWith(":root {"), false);
});

Deno.test("generateThemeCSS - dark uses html:root.dark", () => {
  const css = generateThemeCSS(cfg({ colors: { primary: "#000" } }));
  assertStringIncludes(css, "html:root.dark {");
  assertEquals(css.includes("\n.dark {"), false);
});

// --- Layout dimensions ---

Deno.test("generateThemeCSS - layout dimensions as CSS vars", () => {
  const css = generateThemeCSS(cfg({
    layout: {
      sidebarWidth: 300,
      maxContentWidth: 900,
      headerHeight: 80,
      tocWidth: 200,
    },
  }));
  assertStringIncludes(css, "html:root {");
  assertStringIncludes(css, "--denote-sidebar-width: 300px;");
  assertStringIncludes(css, "--denote-content-max-width: 900px;");
  assertStringIncludes(css, "--denote-header-height: 80px;");
  assertStringIncludes(css, "--denote-toc-width: 200px;");
});

Deno.test("generateThemeCSS - layout alone triggers CSS generation", () => {
  const css = generateThemeCSS(cfg({ layout: { sidebarWidth: 280 } }));
  assertStringIncludes(css, "html:root {");
  assertStringIncludes(css, "--denote-sidebar-width: 280px;");
});

Deno.test("generateThemeCSS - layout without colors produces no dark block", () => {
  const css = generateThemeCSS(cfg({ layout: { sidebarWidth: 280 } }));
  assertEquals(css.includes("html:root.dark"), false);
});

Deno.test("generateThemeCSS - partial layout only emits set values", () => {
  const css = generateThemeCSS(cfg({ layout: { headerHeight: 48 } }));
  assertStringIncludes(css, "--denote-header-height: 48px;");
  assertEquals(css.includes("--denote-sidebar-width"), false);
  assertEquals(css.includes("--denote-toc-width"), false);
  assertEquals(css.includes("--denote-content-max-width"), false);
});

// --- Roundedness ---

Deno.test("generateThemeCSS - roundedness none", () => {
  const css = generateThemeCSS(cfg({ style: { roundedness: "none" } }));
  assertStringIncludes(css, "--denote-radius: 0;");
  assertStringIncludes(css, "--denote-radius-lg: 0;");
  assertStringIncludes(css, "--denote-radius-xl: 0;");
});

Deno.test("generateThemeCSS - roundedness sm", () => {
  const css = generateThemeCSS(cfg({ style: { roundedness: "sm" } }));
  assertStringIncludes(css, "--denote-radius: 0.25rem;");
  assertStringIncludes(css, "--denote-radius-lg: 0.375rem;");
  assertStringIncludes(css, "--denote-radius-xl: 0.5rem;");
});

Deno.test("generateThemeCSS - roundedness md", () => {
  const css = generateThemeCSS(cfg({ style: { roundedness: "md" } }));
  assertStringIncludes(css, "--denote-radius: 0.5rem;");
  assertStringIncludes(css, "--denote-radius-lg: 0.75rem;");
  assertStringIncludes(css, "--denote-radius-xl: 1rem;");
});

Deno.test("generateThemeCSS - roundedness lg", () => {
  const css = generateThemeCSS(cfg({ style: { roundedness: "lg" } }));
  assertStringIncludes(css, "--denote-radius: 0.75rem;");
});

Deno.test("generateThemeCSS - roundedness xl", () => {
  const css = generateThemeCSS(cfg({ style: { roundedness: "xl" } }));
  assertStringIncludes(css, "--denote-radius: 1rem;");
  assertStringIncludes(css, "--denote-radius-lg: 1.25rem;");
  assertStringIncludes(css, "--denote-radius-xl: 1.5rem;");
});

Deno.test("generateThemeCSS - roundedness alone triggers CSS generation", () => {
  const css = generateThemeCSS(cfg({ style: { roundedness: "lg" } }));
  assertStringIncludes(css, "html:root {");
  assertEquals(css.includes("html:root.dark"), false);
});

// --- Layout + colors combined ---

Deno.test("generateThemeCSS - layout and colors together", () => {
  const css = generateThemeCSS(cfg({
    layout: { sidebarWidth: 320 },
    colors: { primary: "#ff0000" },
  }));
  assertStringIncludes(css, "--denote-sidebar-width: 320px;");
  assertStringIncludes(css, "--denote-primary: #ff0000;");
});

// --- No spurious dark block ---

Deno.test("generateThemeCSS - no dark block without primary/accent/dark", () => {
  const css = generateThemeCSS(cfg({
    colors: { primary: "#000", background: "#fff", text: "#111" },
  }));
  // primary IS set so dark block IS generated (auto-derived)
  assertStringIncludes(css, "html:root.dark {");
});
