import type { PageProps } from "fresh";
import { define, type State } from "../utils.ts";
import { Header } from "../components/Header.tsx";

/** Error page component — exported for programmatic routing */
export function ErrorPage(ctx: PageProps<unknown, State>) {
  const config = ctx.state.denote.config;
  const error = ctx.error;
  const message = error instanceof Error ? error.message : "An error occurred";
  const isDev = Deno.env.get("DENO_ENV") !== "production";

  return (
    <div class="min-h-screen bg-[var(--denote-bg)]">
      <Header config={config} />

      <main class="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div class="text-center px-4 py-16 max-w-lg">
          <div class="text-6xl mb-4">⚠️</div>

          <h1 class="text-2xl font-semibold text-[var(--denote-text)] mb-3">
            Something went wrong
          </h1>

          <p class="text-[var(--denote-text-secondary)] mb-6">
            {message}
          </p>

          {isDev && error instanceof Error && error.stack && (
            <pre class="text-left text-xs text-[var(--denote-text-muted)] bg-[var(--denote-bg-tertiary)] rounded-lg p-4 mb-8 overflow-x-auto">
              {error.stack}
            </pre>
          )}

          <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="/docs/introduction"
              class="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--denote-primary)] hover:bg-[var(--denote-primary-hover)] text-[var(--denote-text-inverse)] rounded-lg transition-colors text-sm font-medium"
            >
              Browse Documentation
            </a>
            <a
              href="/"
              class="inline-flex items-center gap-2 px-5 py-2.5 border border-[var(--denote-border-strong)] text-[var(--denote-text-secondary)] hover:bg-[var(--denote-bg-tertiary)] rounded-lg transition-colors text-sm font-medium"
            >
              Go Home
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}

/** Default export for fsRoutes compatibility */
export default define.page(ErrorPage);
