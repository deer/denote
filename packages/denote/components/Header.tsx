/**
 * Site Header Component
 */
import type { DenoteConfig } from "../denote.config.ts";
import { ThemeToggle } from "../islands/ThemeToggle.tsx";
import { MobileMenu } from "../islands/MobileMenu.tsx";

interface HeaderProps {
  config: DenoteConfig;
  showSearch?: boolean;
  currentPath?: string;
}

export function Header(
  { config, showSearch = true, currentPath }: HeaderProps,
) {
  return (
    <header
      class="sticky top-0 z-50 w-full border-b border-[var(--denote-border)] backdrop-blur-sm"
      style={{ backgroundColor: "var(--denote-surface-overlay)" }}
    >
      <div class="container mx-auto px-4">
        <div
          class="flex items-center justify-between"
          style={{ height: "var(--denote-header-height)" }}
        >
          {/* Logo */}
          <a href="/" class="flex items-center gap-2 font-semibold text-lg">
            {config.logo?.light
              ? (
                <img
                  src={config.logo.light}
                  alt={config.name}
                  class="h-8 w-auto"
                />
              )
              : (
                <span
                  class="text-xl font-extrabold tracking-tight text-[var(--denote-text)]"
                  style={{ fontFamily: "var(--denote-font-heading)" }}
                >
                  {config.logo?.text || config.name}
                  {config.logo?.suffix && (
                    <span class="text-[var(--denote-primary)]">
                      {config.logo.suffix}
                    </span>
                  )}
                </span>
              )}
          </a>

          {/* Navigation */}
          <nav class="hidden md:flex items-center gap-6">
            {config.topNav?.map((item) => (
              <a
                href={item.href}
                class="text-sm text-[var(--denote-text-secondary)] hover:text-[var(--denote-text)] transition-colors"
              >
                {item.title}
              </a>
            ))}
          </nav>

          {/* Right side */}
          <div class="flex items-center gap-4">
            {showSearch && (
              <button
                type="button"
                class="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--denote-text-muted)] bg-[var(--denote-bg-tertiary)] rounded-lg hover:bg-[var(--denote-border)] transition-colors"
                data-search-trigger
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
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <span>Search...</span>
                <kbd class="hidden lg:inline-flex items-center px-1.5 py-0.5 text-xs font-medium bg-[var(--denote-bg)] rounded border border-[var(--denote-border-strong)]">
                  ⌘K
                </kbd>
              </button>
            )}

            {/* Theme toggle island */}
            <ThemeToggle
              darkMode={config.style?.darkMode}
            />

            {/* GitHub link */}
            {config.social?.github && (
              <a
                href={config.social.github}
                class="p-2 text-[var(--denote-text-muted)] hover:text-[var(--denote-text)] transition-colors"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    fill-rule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clip-rule="evenodd"
                  />
                </svg>
              </a>
            )}

            {/* Mobile menu toggle island */}
            <MobileMenu
              currentPath={currentPath}
              siteName={config.logo?.text || config.name}
              logoSuffix={config.logo?.suffix}
              navigation={config.navigation}
              topNav={config.topNav}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
