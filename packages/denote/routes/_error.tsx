import type { PageProps } from "fresh";
import { define, type State } from "../utils.ts";
import { Header } from "../components/Header.tsx";

/** Error page component — exported for programmatic routing */
export function ErrorPage(ctx: PageProps<unknown, State>) {
  const error = ctx.error;
  const message = error instanceof Error ? error.message : "An error occurred";
  const isDev = Deno.env.get("DENO_ENV") !== "production";

  return (
    <div class="min-h-screen bg-white dark:bg-gray-950">
      <Header />

      <main class="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div class="text-center px-4 py-16 max-w-lg">
          <div class="text-6xl mb-4">⚠️</div>

          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
            Something went wrong
          </h1>

          <p class="text-gray-600 dark:text-gray-400 mb-6">
            {message}
          </p>

          {isDev && error instanceof Error && error.stack && (
            <pre class="text-left text-xs text-gray-500 dark:text-gray-500 bg-gray-100 dark:bg-gray-900 rounded-lg p-4 mb-8 overflow-x-auto">
              {error.stack}
            </pre>
          )}

          <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="/docs/introduction"
              class="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              Browse Documentation
            </a>
            <a
              href="/"
              class="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-sm font-medium"
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
