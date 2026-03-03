/**
 * Active Table of Contents Island
 *
 * @module
 *
 * Highlights the current section in the right-hand table of contents sidebar
 * as the user scrolls through the page. Uses an IntersectionObserver to
 * track which heading is in view.
 */
import { useEffect } from "preact/hooks";
import { signal } from "@preact/signals";
import type { TocItem } from "../lib/markdown.ts";

/** Props for the {@linkcode ActiveToc} island. */
export interface ActiveTocProps {
  /** Heading entries to render in the sidebar. */
  items: TocItem[];
}

const activeId = signal("");

/** Right-hand table of contents that highlights the current section on scroll. */
export function ActiveToc(
  { items }: ActiveTocProps,
): preact.JSX.Element | null {
  useEffect(() => {
    if (items.length === 0) return;

    const headingIds = items.map((item) => item.id);

    // Default to first heading
    activeId.value = headingIds[0];

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            activeId.value = entry.target.id;
          }
        }
      },
      {
        rootMargin: `-${
          Number.parseInt(
            getComputedStyle(document.documentElement)
              .getPropertyValue("--denote-header-height") || "64",
          ) + 36
        }px 0px -66% 0px`,
      },
    );

    for (const id of headingIds) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <aside
      class="hidden xl:block fixed right-0 overflow-y-auto p-6"
      style={{
        top: "var(--denote-header-height)",
        width: "var(--denote-toc-width)",
        height: "calc(100vh - var(--denote-header-height))",
      }}
    >
      <div class="text-sm">
        <h4 class="font-semibold text-[var(--denote-text)] mb-4">
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
                    ? "text-[var(--denote-primary-text)] font-medium"
                    : "text-[var(--denote-text-secondary)] hover:text-[var(--denote-text)]"
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
