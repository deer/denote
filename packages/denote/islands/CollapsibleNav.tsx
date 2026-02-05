/**
 * Collapsible Navigation Island
 * Sidebar sections that expand/collapse with persisted state.
 */
import { useEffect } from "preact/hooks";
import { signal } from "@preact/signals";

interface NavItem {
  title: string;
  href?: string;
  icon?: string;
  children?: NavItem[];
}

interface CollapsibleNavProps {
  navigation: NavItem[];
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

export function CollapsibleNav(
  { navigation, currentPath }: CollapsibleNavProps,
) {
  useEffect(() => {
    collapsed.value = loadCollapsed();
  }, []);

  return (
    <nav class="p-4 space-y-6">
      {navigation.map((section, i) => (
        <NavSection
          key={section.title}
          section={section}
          currentPath={currentPath}
          sectionKey={String(i)}
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
            ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-medium"
            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
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
        class="flex items-center gap-2 px-2 py-1 text-sm font-semibold text-gray-900 dark:text-white w-full text-left group"
      >
        <svg
          class={`w-3 h-3 text-gray-400 transition-transform ${
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
        <ul class="space-y-1 ml-2 border-l border-gray-200 dark:border-gray-800">
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
