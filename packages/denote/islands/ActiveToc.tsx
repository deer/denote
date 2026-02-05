/**
 * Active Table of Contents Island
 * Highlights the current section in the right sidebar as user scrolls.
 */
import { useEffect } from "preact/hooks";
import { signal } from "@preact/signals";

interface TocItem {
  id: string;
  title: string;
  level: number;
}

interface ActiveTocProps {
  items: TocItem[];
}

const activeId = signal("");

export function ActiveToc({ items }: ActiveTocProps) {
  useEffect(() => {
    if (items.length === 0) return;

    const headingIds = items.map((item) => item.id);

    function updateActive() {
      const scrollY = globalThis.scrollY;
      const offset = 100; // Account for sticky header

      let current = "";
      for (const id of headingIds) {
        const el = document.getElementById(id);
        if (el && el.offsetTop - offset <= scrollY) {
          current = id;
        }
      }

      // If we're at the top, highlight the first item
      if (!current && headingIds.length > 0) {
        current = headingIds[0];
      }

      activeId.value = current;
    }

    updateActive();
    globalThis.addEventListener("scroll", updateActive, { passive: true });
    return () => globalThis.removeEventListener("scroll", updateActive);
  }, [items]);

  if (items.length === 0) return null;

  return (
    <aside class="hidden xl:block fixed top-16 right-0 w-64 h-[calc(100vh-4rem)] overflow-y-auto p-6">
      <div class="text-sm">
        <h4 class="font-semibold text-gray-900 dark:text-white mb-4">
          On this page
        </h4>
        <nav class="space-y-2">
          {items.map((item) => {
            const indent = (item.level - 1) * 12;
            const isActive = activeId.value === item.id;

            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                class={`block transition-colors ${
                  isActive
                    ? "text-indigo-600 dark:text-indigo-400 font-medium"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
                style={{ paddingLeft: `${indent}px` }}
              >
                {item.title}
              </a>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
