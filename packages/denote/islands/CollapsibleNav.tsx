/**
 * Collapsible Navigation Island
 *
 * @module
 *
 * Sidebar sections that expand and collapse with state persisted to
 * localStorage. Highlights the currently active page in the navigation tree.
 */
import { useEffect } from "preact/hooks";
import { signal } from "@preact/signals";
import type { NavItem } from "../denote.config.ts";

/** Props for the {@linkcode CollapsibleNav} island. */
export interface CollapsibleNavProps {
  /** Navigation tree to render. */
  navigation: NavItem[];
  /** Current page path for active-state highlighting. */
  currentPath?: string;
}

const STORAGE_KEY = "denote-nav-collapsed";

// Track which section indices are collapsed
const collapsed = signal<Set<string>>(new Set());

function loadCollapsed(): Set<string> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return new Set(JSON.parse(stored));
  } catch {
    // ignore
  }
  return new Set();
}

function saveCollapsed(set: Set<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch {
    // ignore
  }
}

function toggleSection(key: string): void {
  const next = new Set(collapsed.value);
  if (next.has(key)) {
    next.delete(key);
  } else {
    next.add(key);
  }
  collapsed.value = next;
  saveCollapsed(next);
}

/** Sidebar navigation with collapsible sections. State persisted to localStorage. */
export function CollapsibleNav(
  { navigation, currentPath }: CollapsibleNavProps,
): preact.JSX.Element {
  useEffect(() => {
    collapsed.value = loadCollapsed();
  }, []);

  return (
    <nav class="p-4 space-y-6">
      {navigation.map((section) => (
        <NavSection
          key={section.title}
          section={section}
          currentPath={currentPath}
          sectionKey={section.title}
        />
      ))}
    </nav>
  );
}

function NavSection(
  { section, currentPath, sectionKey }: {
    section: NavItem;
    currentPath?: string;
    sectionKey: string;
  },
) {
  if (!section.children?.length) {
    const isActive = section.href === currentPath;
    return (
      <a
        href={section.href}
        class={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors ${
          isActive
            ? "bg-[var(--denote-primary-subtle)] text-[var(--denote-primary-text)] font-medium"
            : "text-[var(--denote-text-secondary)] hover:text-[var(--denote-text)] hover:bg-[var(--denote-bg-tertiary)]"
        }`}
      >
        {section.icon && <span>{section.icon}</span>}
        <span>{section.title}</span>
      </a>
    );
  }

  const isCollapsed = collapsed.value.has(sectionKey);

  return (
    <div class="space-y-2">
      <button
        type="button"
        onClick={() => toggleSection(sectionKey)}
        class="flex items-center gap-2 px-2 py-1 text-sm font-semibold text-[var(--denote-text)] w-full text-left group"
      >
        <svg
          class={`w-3 h-3 text-[var(--denote-text-muted)] transition-transform ${
            isCollapsed ? "" : "rotate-90"
          }`}
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
        {section.icon && <span>{section.icon}</span>}
        <span>{section.title}</span>
      </button>
      {!isCollapsed && (
        <ul class="space-y-1 ml-2 border-l border-[var(--denote-border)]">
          {section.children!.map((child) => (
            <li key={child.href || child.title}>
              <NavSection
                section={child}
                currentPath={currentPath}
                sectionKey={`${sectionKey}-${child.title}`}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
