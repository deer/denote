import type { PageProps } from "fresh";
import { define, type State } from "../utils.ts";
import { getConfig } from "../lib/config.ts";
import type { DocsConfig } from "../docs.config.ts";
import { COMBINED_CSS } from "@deer/gfm/style";

/** Generate CSS custom property overrides from DocsConfig */
function generateThemeCSS(config: DocsConfig): string {
  const c = config.colors;
  const f = config.fonts;
  if (!c?.primary && !c?.accent && !c?.background && !f?.body) return "";

  const p = c?.primary;
  const a = c?.accent;
  const bg = c?.background;
  const surface = c?.surface;
  const text = c?.text;
  const border = c?.border;
  const dk = c?.dark;

  const lines: string[] = [":root {"];

  // Primary color + derived variants
  if (p) {
    lines.push(`  --denote-primary: ${p};`);
    lines.push(
      `  --denote-primary-hover: color-mix(in srgb, ${p} 85%, black);`,
    );
    lines.push(
      `  --denote-primary-subtle: color-mix(in srgb, ${p} 12%, white);`,
    );
    lines.push(`  --denote-primary-text: ${p};`);
    lines.push(
      `  --denote-shadow-primary: color-mix(in srgb, ${p} 25%, transparent);`,
    );
  }
  if (a) lines.push(`  --denote-accent: ${a};`);
  if (bg) lines.push(`  --denote-bg: ${bg};`);
  if (surface) {
    lines.push(`  --denote-bg-secondary: ${surface};`);
    lines.push(
      `  --denote-bg-tertiary: color-mix(in srgb, ${surface} 80%, ${
        bg || "white"
      });`,
    );
  }
  if (text) {
    lines.push(`  --denote-text: ${text};`);
    lines.push(
      `  --denote-text-secondary: color-mix(in srgb, ${text} 70%, ${
        bg || "white"
      });`,
    );
    lines.push(
      `  --denote-text-muted: color-mix(in srgb, ${text} 45%, ${
        bg || "white"
      });`,
    );
  }
  if (border) {
    lines.push(`  --denote-border: ${border};`);
    lines.push(
      `  --denote-border-strong: color-mix(in srgb, ${border} 80%, ${
        text || "black"
      });`,
    );
  }
  if (bg) {
    lines.push(
      `  --denote-surface-overlay: color-mix(in srgb, ${bg} 80%, transparent);`,
    );
  }

  // Font families
  if (f?.body) lines.push(`  --denote-font-body: ${f.body};`);
  if (f?.heading) lines.push(`  --denote-font-heading: ${f.heading};`);
  if (f?.mono) lines.push(`  --denote-font-mono: ${f.mono};`);

  lines.push("}");

  // Dark mode overrides
  const hasDark = dk || p || a;
  if (hasDark) {
    lines.push(".dark {");
    const dp = dk?.primary ||
      (p ? `color-mix(in srgb, ${p} 70%, white)` : undefined);
    const da = dk?.accent ||
      (a ? `color-mix(in srgb, ${a} 70%, white)` : undefined);
    const dbg = dk?.background;
    const ds = dk?.surface;
    const dt = dk?.text;
    const dborder = dk?.border;

    if (dp) {
      lines.push(`  --denote-primary: ${dp};`);
      lines.push(
        `  --denote-primary-hover: color-mix(in srgb, ${dp} 80%, white);`,
      );
      lines.push(
        `  --denote-primary-subtle: color-mix(in srgb, ${dp} 30%, black);`,
      );
      lines.push(`  --denote-primary-text: ${dp};`);
      lines.push(
        `  --denote-shadow-primary: color-mix(in srgb, ${dp} 15%, transparent);`,
      );
    }
    if (da) lines.push(`  --denote-accent: ${da};`);
    if (dbg) {
      lines.push(`  --denote-bg: ${dbg};`);
      lines.push(
        `  --denote-surface-overlay: color-mix(in srgb, ${dbg} 80%, transparent);`,
      );
    }
    if (ds) {
      lines.push(`  --denote-bg-secondary: ${ds};`);
      lines.push(
        `  --denote-bg-tertiary: color-mix(in srgb, ${ds} 70%, ${
          dbg || "black"
        });`,
      );
    }
    if (dt) {
      lines.push(`  --denote-text: ${dt};`);
      lines.push(
        `  --denote-text-secondary: color-mix(in srgb, ${dt} 65%, ${
          dbg || "black"
        });`,
      );
      lines.push(
        `  --denote-text-muted: color-mix(in srgb, ${dt} 40%, ${
          dbg || "black"
        });`,
      );
    }
    if (dborder) {
      lines.push(`  --denote-border: ${dborder};`);
      lines.push(
        `  --denote-border-strong: color-mix(in srgb, ${dborder} 70%, ${
          dt || "white"
        });`,
      );
    }
    lines.push("}");
  }

  return lines.join("\n");
}

/** App wrapper component — exported for programmatic routing */
export function App({ Component, state }: PageProps<unknown, State>) {
  const config = getConfig();
  const pageTitle = state.pageTitle
    ? `${state.pageTitle} | ${config.name}`
    : `${config.name} — Docs for humans and machines`;
  const pageDescription = state.pageDescription ||
    "Documentation powered by Denote";
  const pageUrl = state.pageUrl;
  const pageImage = state.pageImage;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: config.name,
    url: pageUrl || "/",
    description: pageDescription,
  };

  // Build full theme CSS from config
  const colorOverrides = generateThemeCSS(config);
  const fontImports = config.fonts?.imports || [];

  return (
    <html lang="en" class="scroll-smooth">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <meta
          name="theme-color"
          content="#ffffff"
          media="(prefers-color-scheme: light)"
        />
        <meta
          name="theme-color"
          content="#030712"
          media="(prefers-color-scheme: dark)"
        />
        <link rel="manifest" href="/manifest.json" />
        {fontImports.map((url) => (
          <link
            key={url}
            rel="stylesheet"
            href={url}
          />
        ))}
        {pageUrl && <link rel="canonical" href={pageUrl} />}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/* OpenGraph meta tags */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        {pageUrl && <meta property="og:url" content={pageUrl} />}
        {pageImage && <meta property="og:image" content={pageImage} />}
        <meta property="og:site_name" content={config.name} />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        {pageImage && <meta name="twitter:image" content={pageImage} />}

        {/* @deer/gfm syntax highlighting styles (CSS vars + hljs token colors) */}
        <style dangerouslySetInnerHTML={{ __html: COMBINED_CSS }} />

        {/* Config-driven color overrides */}
        {colorOverrides && (
          <style dangerouslySetInnerHTML={{ __html: colorOverrides }} />
        )}

        {/* Prevent flash of unstyled content */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
            (function() {
              let stored;
              try {
                stored = localStorage.getItem('theme');
              } catch(e) {}
              let prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              if (stored === 'dark' || (!stored && prefersDark)) {
                document.documentElement.classList.add('dark');
              }
            })();
          `,
          }}
        />
      </head>
      <body class="antialiased text-[var(--denote-text)] bg-[var(--denote-bg)]">
        <a
          href="#main-content"
          class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[var(--denote-primary)] focus:text-[var(--denote-text-inverse)] focus:rounded-lg"
        >
          Skip to content
        </a>
        <div id="main-content">
          <Component />
        </div>
      </body>
    </html>
  );
}

/** Default export for fsRoutes compatibility */
export default define.page(App);
