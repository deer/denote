import type { PageProps } from "fresh";
import { define, type State } from "../utils.ts";
import { getConfig } from "../lib/config.ts";
import { buildJsonLd } from "../lib/seo.ts";

/** App wrapper component — exported for programmatic routing */
export function App({ Component, state }: PageProps<unknown, State>) {
  const config = getConfig();
  const pageTitle = state.pageTitle
    ? `${state.pageTitle} | ${config.name}`
    : `${config.name} — Docs for humans and machines`;
  const pageDescription = state.pageDescription ||
    "Documentation powered by Denote";
  const pageUrl = state.pageUrl;
  const pageImage = state.pageImage || config.seo?.ogImage;

  const jsonLd = JSON.stringify(
    buildJsonLd(config, pageDescription, pageUrl),
  );

  const fontImports = config.fonts?.imports || [];
  const locale = config.seo?.locale || "en";
  const seoUrl = config.seo?.url?.replace(/\/$/, "");

  // Preconnect to Google Fonts when font imports reference it
  const hasGoogleFonts = fontImports.some((url) =>
    url.includes("fonts.googleapis.com")
  );

  // OG image dimensions: use configured values, or defaults when an image exists
  const ogImageWidth = pageImage
    ? (config.seo?.ogImageWidth ?? 1200)
    : undefined;
  const ogImageHeight = pageImage
    ? (config.seo?.ogImageHeight ?? 630)
    : undefined;

  return (
    <html lang={locale} class="scroll-smooth">
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

        {/* Font preconnect for Google Fonts */}
        {hasGoogleFonts && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link
              rel="preconnect"
              href="https://fonts.gstatic.com"
              crossOrigin="anonymous"
            />
          </>
        )}

        {fontImports.map((url) => (
          <link
            key={url}
            rel="stylesheet"
            href={url}
          />
        ))}
        {pageUrl && <link rel="canonical" href={pageUrl} />}

        {/* hreflang tags when seo.url is configured */}
        {seoUrl && pageUrl && (
          <>
            <link rel="alternate" hreflang={locale} href={pageUrl} />
            <link rel="alternate" hreflang="x-default" href={pageUrl} />
          </>
        )}

        {/* JSON-LD structured data (application/ld+json is not executable — CSP safe) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd }}
        />

        {/* OpenGraph meta tags */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        {pageUrl && <meta property="og:url" content={pageUrl} />}
        {pageImage && <meta property="og:image" content={pageImage} />}
        {pageImage && ogImageWidth && (
          <meta
            property="og:image:width"
            content={String(ogImageWidth)}
          />
        )}
        {pageImage && ogImageHeight && (
          <meta
            property="og:image:height"
            content={String(ogImageHeight)}
          />
        )}
        <meta property="og:site_name" content={config.name} />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        {pageImage && <meta name="twitter:image" content={pageImage} />}

        {/* GFM syntax highlighting styles — served from /gfm.css route */}
        <link rel="stylesheet" href="/gfm.css" />

        {/* Config-driven theme overrides — served from /theme-vars.css route */}
        <link rel="stylesheet" href="/theme-vars.css" />

        {/* Custom CSS escape hatch */}
        {config.style?.customCss && (
          <link rel="stylesheet" href={config.style.customCss} />
        )}

        {/* Theme detection — external script to prevent FOUC (render-blocking) */}
        <script src="/theme-init.js" />
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
