import { define } from "../utils.ts";
import { Header } from "../components/Header.tsx";
import { getConfig } from "../lib/config.ts";

/** 404 page component — exported for programmatic routing */
export function NotFoundPage() {
  const config = getConfig();
  // Popular pages to suggest
  const suggestions = config.navigation
    .flatMap((section) =>
      section.children?.filter((child) => child.href).slice(0, 2) || []
    )
    .slice(0, 4);

  return (
    <div class="min-h-screen bg-[var(--denote-bg)]">
      <Header />

      <main class="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div class="text-center px-4 py-16 max-w-lg">
          {/* Big 404 */}
          <div class="text-8xl font-bold text-[var(--denote-border)] mb-4">
            404
          </div>

          <h1 class="text-2xl font-semibold text-[var(--denote-text)] mb-3">
            Page not found
          </h1>

          <p class="text-[var(--denote-text-secondary)] mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>

          {/* Actions */}
          <div class="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
            <a
              href="/docs/introduction"
              class="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--denote-primary)] hover:bg-[var(--denote-primary-hover)] text-[var(--denote-text-inverse)] rounded-lg transition-colors text-sm font-medium"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              Browse Documentation
            </a>
            <a
              href="/"
              class="inline-flex items-center gap-2 px-5 py-2.5 border border-[var(--denote-border-strong)] text-[var(--denote-text-secondary)] hover:bg-[var(--denote-bg-tertiary)] rounded-lg transition-colors text-sm font-medium"
            >
              Go Home
            </a>
          </div>

          {/* Suggested pages */}
          {suggestions.length > 0 && (
            <div>
              <h2 class="text-sm font-medium text-[var(--denote-text-muted)] uppercase tracking-wide mb-4">
                Popular pages
              </h2>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {suggestions.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    class="flex items-center gap-2 px-4 py-3 rounded-lg border border-[var(--denote-border)] hover:border-[var(--denote-primary-text)] hover:bg-[var(--denote-primary-subtle)] transition-colors text-sm"
                  >
                    <svg
                      class="w-4 h-4 text-[var(--denote-text-muted)]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <span class="text-[var(--denote-text-secondary)]">
                      {item.title}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/** Default export for fsRoutes compatibility */
export default define.page(NotFoundPage);
