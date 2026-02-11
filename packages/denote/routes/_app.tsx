import type { PageProps } from "fresh";
import { define, type State } from "../utils.ts";
import { getConfig } from "../lib/config.ts";
import { COMBINED_CSS } from "@deer/gfm/style";

/** App wrapper component — exported for programmatic routing */
export function App({ Component, state }: PageProps<unknown, State>) {
  const config = getConfig();
  const pageTitle = state.pageTitle
    ? `${state.pageTitle} — ${config.name}`
    : config.name;
  const pageDescription = state.pageDescription ||
    "Documentation powered by Denote";
  const pageUrl = state.pageUrl;
  const pageImage = state.pageImage;

  // Build custom color overrides from config
  const colorOverrides = config.colors?.primary
    ? `:root {
  --gfm-accent-color: ${config.colors.primary};
  --gfm-accent-hover: color-mix(in srgb, ${config.colors.primary} 85%, black);
  --gfm-accent-subtle: color-mix(in srgb, ${config.colors.primary} 40%, white);
}
.dark {
  --gfm-accent-subtle: color-mix(in srgb, ${config.colors.primary} 60%, black);
}`
    : "";

  return (
    <html lang="en" class="scroll-smooth">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />

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
              const stored = localStorage.getItem('theme');
              const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              if (stored === 'dark' || (!stored && prefersDark)) {
                document.documentElement.classList.add('dark');
              }
            })();
          `,
          }}
        />
      </head>
      <body class="antialiased text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-950">
        <Component />
      </body>
    </html>
  );
}

/** Default export for fsRoutes compatibility */
export default define.page(App);
