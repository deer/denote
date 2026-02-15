/**
 * Documentation Page Layout
 */
import type { ComponentChildren } from "preact";
import { Header } from "./Header.tsx";
import { Sidebar } from "./Sidebar.tsx";
import { ActiveToc } from "../islands/ActiveToc.tsx";
import { AiChat } from "../islands/AiChat.tsx";
import type { TocItem } from "../lib/markdown.ts";
import type { Breadcrumb, NavLink } from "../lib/docs.ts";
import { getConfig } from "../lib/config.ts";

interface DocsLayoutProps {
  title: string;
  description?: string;
  children: ComponentChildren;
  toc?: TocItem[];
  currentPath?: string;
  prev?: NavLink | null;
  next?: NavLink | null;
  breadcrumbs?: Breadcrumb[];
}

export function DocsLayout({
  title,
  description,
  children,
  toc = [],
  currentPath,
  prev,
  next,
  breadcrumbs = [],
}: DocsLayoutProps) {
  return (
    <div class="min-h-screen bg-[var(--denote-bg)]">
      <Header currentPath={currentPath} />
      <Sidebar currentPath={currentPath} />

      <main class="lg:pl-64 xl:pr-64">
        <article class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Breadcrumbs */}
          {breadcrumbs.length > 1 && (
            <nav class="flex items-center gap-1.5 text-sm text-[var(--denote-text-muted)] mb-4">
              {breadcrumbs.map((crumb, i) => (
                <>
                  {i > 0 && (
                    <svg
                      class="w-3.5 h-3.5 text-[var(--denote-text-muted)] flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  )}
                  {crumb.href && i < breadcrumbs.length - 1
                    ? (
                      <a
                        href={crumb.href}
                        class="hover:text-[var(--denote-text)] transition-colors"
                      >
                        {crumb.title}
                      </a>
                    )
                    : (
                      <span
                        class={i === breadcrumbs.length - 1
                          ? "text-[var(--denote-text)] font-medium"
                          : ""}
                      >
                        {crumb.title}
                      </span>
                    )}
                </>
              ))}
            </nav>
          )}

          {/* Page header */}
          <header class="mb-8">
            <h1 class="text-4xl font-bold text-[var(--denote-text)] mb-2">
              {title}
            </h1>
            {description && (
              <p class="text-lg text-[var(--denote-text-secondary)]">
                {description}
              </p>
            )}
          </header>

          {/* Content */}
          <div class="max-w-none">
            {children}
          </div>

          {/* Prev / Next Navigation */}
          {(prev || next) && (
            <footer class="mt-16 pt-8 border-t border-[var(--denote-border)]">
              <div class="flex justify-between">
                {prev
                  ? (
                    <a
                      href={prev.href}
                      class="group flex flex-col gap-1 text-sm hover:text-[var(--denote-primary-text)] transition-colors"
                    >
                      <span class="text-[var(--denote-text-muted)] text-xs uppercase tracking-wide">
                        Previous
                      </span>
                      <span class="font-medium text-[var(--denote-text-secondary)] group-hover:text-[var(--denote-primary-text)]">
                        ← {prev.title}
                      </span>
                    </a>
                  )
                  : <div />}
                {next
                  ? (
                    <a
                      href={next.href}
                      class="group flex flex-col gap-1 text-sm text-right hover:text-[var(--denote-primary-text)] transition-colors"
                    >
                      <span class="text-[var(--denote-text-muted)] text-xs uppercase tracking-wide">
                        Next
                      </span>
                      <span class="font-medium text-[var(--denote-text-secondary)] group-hover:text-[var(--denote-primary-text)]">
                        {next.title} →
                      </span>
                    </a>
                  )
                  : <div />}
              </div>
            </footer>
          )}
        </article>
      </main>

      <ActiveToc items={toc} />
      {getConfig().ai?.chatbot && <AiChat />}
    </div>
  );
}
