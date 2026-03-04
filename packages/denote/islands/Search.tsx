/**
 * Search Island
 *
 * @module
 *
 * Signal-driven search modal activated by the Cmd+K / Ctrl+K keyboard
 * shortcut. Lazily fetches the search index from `/api/search` on first open,
 * then performs client-side full-text search with keyboard navigation.
 */
import { computed, effect, signal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import MiniSearch from "minisearch";
import { SEARCH_OPTIONS } from "../lib/search-options.ts";

const isOpen = signal(false);
const query = signal("");
const selectedIndex = signal(0);
const searchIndex = signal<MiniSearch | null>(null);
const isLoading = signal(false);
const fetchError = signal(false);

// Reset selection when query changes
effect(() => {
  query.value; // subscribe
  selectedIndex.value = 0;
});

/** Full-text search modal activated by Cmd+K / Ctrl+K. */
export function Search(): preact.JSX.Element | null {
  const results = computed(() => {
    const q = query.value.trim();
    if (!q || !searchIndex.value) return [];
    return searchIndex.value.search(q).slice(0, 10);
  });

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // ⌘K / Ctrl+K to open
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        isOpen.value = true;
        return;
      }

      if (!isOpen.value) return;

      // Escape to close
      if (e.key === "Escape") {
        isOpen.value = false;
        return;
      }

      // Arrow navigation
      if (e.key === "ArrowDown") {
        e.preventDefault();
        selectedIndex.value = Math.min(
          selectedIndex.value + 1,
          results.value.length - 1,
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        selectedIndex.value = Math.max(selectedIndex.value - 1, 0);
      } else if (e.key === "Enter" && results.value.length > 0) {
        e.preventDefault();
        const item = results.value[selectedIndex.value];
        if (item) {
          globalThis.location.href = `/docs/${item.id}`;
          isOpen.value = false;
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // Listen for search trigger buttons
  useEffect(() => {
    const triggers = document.querySelectorAll("[data-search-trigger]");
    const open = () => (isOpen.value = true);
    triggers.forEach((el) => el.addEventListener("click", open));
    return () =>
      triggers.forEach((el) => el.removeEventListener("click", open));
  }, []);

  // Fetch search index on first open
  useEffect(() => {
    if (!isOpen.value || searchIndex.value !== null || isLoading.value) return;
    isLoading.value = true;
    fetchError.value = false;
    fetch("/api/search")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then((json) =>
        searchIndex.value = MiniSearch.loadJSON(json, SEARCH_OPTIONS)
      )
      .catch(() => (fetchError.value = true))
      .finally(() => (isLoading.value = false));
  }, [isOpen.value]);

  if (!isOpen.value) return null;

  return (
    <div class="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        class="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => (isOpen.value = false)}
      />

      {/* Modal */}
      <div class="relative min-h-screen flex items-start justify-center p-4 pt-[10vh]">
        <div class="relative w-full max-w-2xl bg-[var(--denote-bg)] rounded-xl shadow-2xl">
          {/* Search input */}
          <div class="flex items-center border-b border-[var(--denote-border)] px-4">
            <svg
              class="w-5 h-5 text-[var(--denote-text-muted)]"
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
            <input
              type="text"
              placeholder="Search documentation..."
              class="flex-1 px-4 py-4 bg-transparent text-[var(--denote-text)] placeholder-[var(--denote-text-muted)] focus:outline-none"
              value={query.value}
              onInput={(e) => (query.value = e.currentTarget.value)}
              autofocus
            />
            <kbd class="hidden sm:inline-flex items-center px-2 py-1 text-xs font-medium text-[var(--denote-text-muted)] bg-[var(--denote-bg-tertiary)] rounded border border-[var(--denote-border)]">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div class="max-h-[60vh] overflow-y-auto p-2">
            {isLoading.value && (
              <div class="py-8 text-center text-[var(--denote-text-muted)]">
                Loading...
              </div>
            )}

            {fetchError.value && (
              <div class="py-8 text-center text-[var(--denote-text-muted)]">
                Search unavailable
              </div>
            )}

            {!isLoading.value && !fetchError.value && query.value.trim() &&
              results.value.length === 0 && (
              <div class="py-8 text-center text-[var(--denote-text-muted)]">
                No results found for "{query.value}"
              </div>
            )}

            {results.value.map((item, i) => (
              <a
                href={`/docs/${item.id}`}
                class={`block px-4 py-3 rounded-lg transition-colors ${
                  i === selectedIndex.value
                    ? "bg-[var(--denote-primary-subtle)]"
                    : "hover:bg-[var(--denote-bg-tertiary)]"
                }`}
                onClick={() => (isOpen.value = false)}
              >
                <div class="font-medium text-[var(--denote-text)]">
                  {item.title}
                </div>
                {item.description && (
                  <div class="text-sm text-[var(--denote-text-muted)] line-clamp-1">
                    {item.description}
                  </div>
                )}
              </a>
            ))}

            {!isLoading.value && !fetchError.value && !query.value.trim() && (
              <div class="py-8 text-center text-[var(--denote-text-muted)]">
                Start typing to search...
              </div>
            )}
          </div>

          {/* Footer */}
          <div class="flex items-center justify-between px-4 py-3 border-t border-[var(--denote-border)] text-xs text-[var(--denote-text-muted)]">
            <div class="flex items-center gap-4">
              <span class="flex items-center gap-1">
                <kbd class="px-1.5 py-0.5 bg-[var(--denote-bg-tertiary)] rounded">
                  ↑
                </kbd>
                <kbd class="px-1.5 py-0.5 bg-[var(--denote-bg-tertiary)] rounded">
                  ↓
                </kbd>
                to navigate
              </span>
              <span class="flex items-center gap-1">
                <kbd class="px-1.5 py-0.5 bg-[var(--denote-bg-tertiary)] rounded">
                  ↵
                </kbd>
                to select
              </span>
            </div>
            <span>
              Powered by <strong>Denote</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
