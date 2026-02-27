import type { PageProps } from "fresh";
import type { State } from "../utils.ts";
import { Header } from "./Header.tsx";

/**
 * Layout component for user-defined file-system routes.
 *
 * Automatically applied by {@linkcode denote} to routes in the project's
 * `routes/` directory. Wraps the page with the site {@link Header} and
 * an optional footer (using `footer.links` from config). User route
 * components only need to render their own content.
 *
 * Not applied to documentation routes — those use {@link DocsLayout}.
 *
 * @example A user route that gets this layout automatically:
 * ```tsx
 * // routes/about.tsx
 * export default function AboutPage() {
 *   return <h1>About</h1>;
 * }
 * ```
 */
export function PageLayout(ctx: PageProps<unknown, State>) {
  const config = ctx.state.denote.config;
  const currentPath = new URL(ctx.req.url).pathname;

  return (
    <div class="min-h-screen bg-[var(--denote-bg)]">
      <Header config={config} currentPath={currentPath} />
      <main class="container mx-auto px-4 py-16 max-w-3xl">
        <ctx.Component />
      </main>
      {config.footer && (
        <footer class="py-12 bg-[var(--denote-bg)] border-t border-[var(--denote-border)]">
          <div class="container mx-auto px-4 text-center text-sm text-[var(--denote-text-muted)]">
            <p>
              {config.footer.copyright ||
                `© ${new Date().getFullYear()} ${config.name}`}
            </p>
            {config.footer.links && (
              <div class="mt-4 space-x-4">
                {config.footer.links.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    class="text-[var(--denote-text-secondary)] hover:text-[var(--denote-primary-text)]"
                  >
                    {link.title}
                  </a>
                ))}
              </div>
            )}
          </div>
        </footer>
      )}
    </div>
  );
}
