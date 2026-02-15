/**
 * Theme Toggle Island
 * Signal-driven dark/light mode switching
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

interface ThemeToggleProps {
  darkMode?: "auto" | "light" | "dark" | "toggle";
}

export function ThemeToggle({ darkMode }: ThemeToggleProps) {
  // Hide toggle when theme is forced
  if (darkMode === "light" || darkMode === "dark") {
    return null;
  }

  // Initialize once on first client render
  if (typeof document !== "undefined" && !mounted.value) {
    const stored = localStorage.getItem("theme");
    const prefersDark =
      globalThis.matchMedia("(prefers-color-scheme: dark)").matches;
    isDark.value = stored === "dark" ||
      (!stored && (prefersDark || darkMode === "toggle"));
    mounted.value = true;
  }

  return (
    <button
      type="button"
      onClick={() => (isDark.value = !isDark.value)}
      class="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      aria-label="Toggle theme"
    >
      {/* Sun icon (shown in dark mode) */}
      <svg
        class={`w-5 h-5 ${isDark.value && mounted.value ? "block" : "hidden"}`}
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
          !isDark.value || !mounted.value ? "block" : "hidden"
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
