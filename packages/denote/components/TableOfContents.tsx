/**
 * Table of Contents Component
 */
import type { TocItem } from "../lib/markdown.ts";

interface TableOfContentsProps {
  items: TocItem[];
}

export function TableOfContents({ items }: TableOfContentsProps) {
  if (items.length === 0) return null;

  return (
    <aside class="hidden xl:block fixed top-16 right-0 w-64 h-[calc(100vh-4rem)] overflow-y-auto p-6">
      <div class="text-sm">
        <h4 class="font-semibold text-gray-900 dark:text-white mb-4">
          On this page
        </h4>
        <nav class="space-y-2">
          {items.map((item) => <TocLink key={item.id} item={item} />)}
        </nav>
      </div>
    </aside>
  );
}

interface TocLinkProps {
  item: TocItem;
}

function TocLink({ item }: TocLinkProps) {
  const indent = (item.level - 1) * 12;

  return (
    <a
      href={`#${item.id}`}
      class="block text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      style={{ paddingLeft: `${indent}px` }}
    >
      {item.title}
    </a>
  );
}
