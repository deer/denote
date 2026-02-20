import { define } from "../utils.ts";
import { getConfig } from "../lib/config.ts";
import type { NavItem } from "../denote.config.ts";
import { Header } from "../components/Header.tsx";

/** Find the first href in a navigation tree */
function firstNavHref(items: NavItem[]): string | undefined {
  for (const item of items) {
    if (item.href) return item.href;
    if (item.children) {
      const found = firstNavHref(item.children);
      if (found) return found;
    }
  }
  return undefined;
}

/** Handler to support landing page redirect */
export const handler = define.handlers({
  GET(ctx) {
    const config = getConfig();
    if (config.landing?.enabled === false) {
      const target = config.landing?.redirectTo ||
        firstNavHref(config.navigation) || "/docs";
      return new Response(null, {
        status: 302,
        headers: { Location: target },
      });
    }
    return ctx.render(<Home />);
  },
});

// ---------------------------------------------------------------------------
// Default content (used when no landing config is provided)
// ---------------------------------------------------------------------------

const defaultFeatures = [
  {
    icon: "📝",
    title: "Markdown First",
    description:
      "Write docs in Markdown with frontmatter. No MDX compilation step, no build pipeline. Just files.",
  },
  {
    icon: "⚡",
    title: "Lightning Fast",
    description:
      "Server-rendered with island architecture. Ship minimal JavaScript — only where it's needed.",
  },
  {
    icon: "🎨",
    title: "Beautiful Defaults",
    description:
      "Looks great out of the box with dark mode support. Fully customizable via config.",
  },
  {
    icon: "🔍",
    title: "Built-in Search",
    description:
      "Instant full-text search with keyboard navigation. No external service required.",
  },
  {
    icon: "🤖",
    title: "AI Native",
    description:
      "Built-in MCP server, llms.txt, and JSON API. Your docs are a first-class data source for AI.",
  },
  {
    icon: "🚀",
    title: "Deploy Anywhere",
    description:
      "One-click Deno Deploy, or self-host on anything that runs Deno.",
  },
];

/** Home page component — exported for programmatic routing */
export function Home() {
  const config = getConfig();
  const l = config.landing ?? {};

  // Hero
  const badge = l.hero?.badge ?? null;
  const title = l.hero?.title ?? "Your documentation,";
  const titleHighlight = l.hero?.titleHighlight ?? "beautifully delivered";
  const subtitle = l.hero?.subtitle ?? null;
  const description = l.hero?.description ??
    "Write Markdown, get a fast and beautiful documentation site with search, dark mode, and AI integration built in.";

  // CTAs
  const primaryCta = l.cta?.primary ??
    { text: "Get Started", href: firstNavHref(config.navigation) || "/docs" };
  const secondaryCta = l.cta?.secondary ??
    (config.social?.github
      ? { text: "View on GitHub", href: config.social.github }
      : null);

  // Install command
  const install = l.install ?? null;

  // Features
  const featureItems = l.features ?? defaultFeatures;

  return (
    <div
      class="min-h-screen"
      style={{
        background:
          `linear-gradient(to bottom, var(--denote-bg), var(--denote-bg-secondary))`,
      }}
    >
      <Header showSearch={false} />

      {/* Hero Section */}
      <section class="relative overflow-hidden">
        <div
          class="absolute inset-0"
          style={{
            background:
              `linear-gradient(to right, color-mix(in srgb, var(--denote-primary) 10%, transparent), color-mix(in srgb, var(--denote-accent) 10%, transparent), color-mix(in srgb, var(--denote-accent) 8%, transparent))`,
          }}
        />

        <div class="relative container mx-auto px-4 py-24 sm:py-32 lg:py-40">
          <div class="max-w-4xl mx-auto text-center">
            {badge && (
              <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-8 bg-[var(--denote-primary-subtle)] text-[var(--denote-primary-text)]">
                <span>{badge}</span>
              </div>
            )}

            <h1 class="text-5xl sm:text-6xl lg:text-7xl font-bold text-[var(--denote-text)] mb-6 tracking-tight">
              {title} {titleHighlight && (
                <span
                  class="bg-clip-text text-transparent"
                  style={{
                    backgroundImage:
                      `linear-gradient(to right, var(--denote-primary), var(--denote-accent))`,
                  }}
                >
                  {titleHighlight}
                </span>
              )}
              {subtitle && (
                <>
                  {" "}
                  <em class="font-light">{subtitle}</em>
                </>
              )}
            </h1>

            <p class="text-xl sm:text-2xl text-[var(--denote-text-secondary)] mb-10 max-w-2xl mx-auto">
              {description}
            </p>

            <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={primaryCta.href}
                class="inline-flex items-center gap-2 px-8 py-4 bg-[var(--denote-primary)] hover:bg-[var(--denote-primary-hover)] text-[var(--denote-text-inverse)] font-semibold rounded-xl shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
                style={{
                  boxShadow:
                    `0 10px 25px -5px var(--denote-shadow-primary), 0 8px 10px -6px var(--denote-shadow-primary)`,
                }}
              >
                {primaryCta.text}
                <svg
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </a>
              {secondaryCta && (
                <a
                  href={secondaryCta.href}
                  class="inline-flex items-center gap-2 px-8 py-4 bg-[var(--denote-bg-tertiary)] hover:bg-[var(--denote-border)] text-[var(--denote-text)] font-semibold rounded-xl transition-all hover:-translate-y-0.5"
                >
                  {secondaryCta.href.includes("github") && (
                    <svg
                      class="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  )}
                  {secondaryCta.text}
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      {featureItems.length > 0 && (
        <section class="py-24 bg-[var(--denote-bg-secondary)]">
          <div class="container mx-auto px-4">
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {featureItems.map((feature) => (
                <div class="p-6 rounded-2xl bg-[var(--denote-bg)] border border-[var(--denote-border)] hover:border-[var(--denote-primary-text)] transition-colors">
                  {feature.icon && (
                    <div
                      class="w-12 h-12 flex items-center justify-center rounded-xl bg-[var(--denote-primary-subtle)] text-2xl mb-4"
                      aria-hidden="true"
                    >
                      {feature.icon}
                    </div>
                  )}
                  <h3 class="text-xl font-semibold text-[var(--denote-text)] mb-2">
                    {feature.title}
                  </h3>
                  <p class="text-[var(--denote-text-secondary)]">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Install / CTA Section */}
      {(install || primaryCta) && (
        <section
          class="py-24"
          style={{
            background:
              `linear-gradient(to right, var(--denote-primary), var(--denote-accent))`,
          }}
        >
          <div class="container mx-auto px-4 text-center">
            {install && (
              <div class="inline-flex items-center gap-3 px-6 py-4 bg-black/20 rounded-xl font-mono text-[var(--denote-text-inverse)] mb-8">
                <span style={{ opacity: 0.7 }}>$</span>
                <code>{install}</code>
              </div>
            )}
            <div>
              <a
                href={primaryCta.href}
                class="inline-flex items-center gap-2 px-8 py-4 bg-[var(--denote-bg)] text-[var(--denote-primary-text)] font-semibold rounded-xl shadow-lg transition-all hover:-translate-y-0.5 hover:opacity-90"
              >
                {primaryCta.text}
                <svg
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </a>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer class="py-12 bg-[var(--denote-bg)] border-t border-[var(--denote-border)]">
        <div class="container mx-auto px-4">
          <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div class="text-[var(--denote-text-secondary)]">
              <span>
                {config.footer?.copyright ||
                  `\u00A9 ${new Date().getFullYear()} ${config.name}`}
              </span>
            </div>
            <div class="flex items-center gap-6">
              {config.footer?.links?.map((link) => (
                <a
                  href={link.href}
                  class="text-sm text-[var(--denote-text-secondary)] hover:text-[var(--denote-text)] transition-colors"
                >
                  {link.title}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/** Default export for fsRoutes compatibility */
export default define.page(Home);
