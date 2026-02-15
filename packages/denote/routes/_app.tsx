import type { PageProps } from "fresh";
import { define, type State } from "../utils.ts";
import { getConfig } from "../lib/config.ts";
import { COMBINED_CSS } from "@deer/gfm/style";
import { generateThemeCSS } from "../lib/theme.ts";

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
