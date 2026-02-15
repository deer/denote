/**
 * Documentation Sidebar Component (desktop only)
 * Uses CollapsibleNav island for expand/collapse with persisted state.
 */
import { getConfig } from "../lib/config.ts";
import { CollapsibleNav } from "../islands/CollapsibleNav.tsx";

interface SidebarProps {
  currentPath?: string;
}

export function Sidebar({ currentPath }: SidebarProps) {
  const config = getConfig();
  return (
    <aside class="fixed top-16 left-0 z-40 w-64 h-[calc(100vh-4rem)] overflow-y-auto border-r border-[var(--denote-border)] bg-[var(--denote-bg)] hidden lg:block">
      <CollapsibleNav
        navigation={config.navigation}
        currentPath={currentPath}
      />
    </aside>
  );
}
