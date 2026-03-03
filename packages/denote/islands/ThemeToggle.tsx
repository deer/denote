/**
 * Theme Toggle Island
 *
 * @module
 *
 * Signal-driven dark/light mode switching button. Renders a sun/moon icon
 * that toggles between light and dark themes, persisting the choice to
 * localStorage.
 */
import { effect, signal } from "@preact/signals";

// Module-level signals — persist across renders, no hooks needed
const isDark = signal(false);
const mounted = signal(false);

// Sync the signal to the DOM class (runs whenever isDark changes)
effect(() => {
  if (!mounted.value) return;
  if (isDark.value) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
  localStorage.setItem("theme", isDark.value ? "dark" : "light");
});

/** Props for the {@linkcode ThemeToggle} island. */
export interface ThemeToggleProps {
  /** Dark mode behavior. Default: "toggle". */
  darkMode?: "auto" | "light" | "dark" | "toggle";
}

/** Dark/light mode toggle button. Hidden when `darkMode` is forced to "light" or "dark". */
export function ThemeToggle(
  { darkMode }: ThemeToggleProps,
): preact.JSX.Element | null {
  // Hide toggle when theme is forced or fully automatic
  if (darkMode === "light" || darkMode === "dark" || darkMode === "auto") {
    return null;
  }

  // Initialize once on first client render
  if (typeof document !== "undefined" && !mounted.value) {
    const stored = localStorage.getItem("theme");
    const prefersDark =
      globalThis.matchMedia("(prefers-color-scheme: dark)").matches;
    isDark.value = stored === "dark" || (!stored && prefersDark);
    mounted.value = true;
  }

  return (
    <button
      type="button"
      onClick={() => (isDark.value = !isDark.value)}
      class="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      aria-label="Toggle theme"
    >
      {
        /* Sun icon (shown in dark mode)
         Before hydration: CSS dark: variant handles visibility (IIFE sets .dark before paint)
         After hydration: signals take over */
      }
      <svg
        class={`w-5 h-5 ${
          mounted.value
            ? (isDark.value ? "block" : "hidden")
            : "hidden dark:block"
        }`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
      {/* Moon icon (shown in light mode) */}
      <svg
        class={`w-5 h-5 ${
          mounted.value
            ? (isDark.value ? "hidden" : "block")
            : "block dark:hidden"
        }`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
        />
      </svg>
    </button>
  );
}
