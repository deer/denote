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
    <aside
      class="fixed left-0 z-40 overflow-y-auto border-r border-[var(--denote-border)] bg-[var(--denote-bg)] hidden lg:block"
      style={{
        top: "var(--denote-header-height)",
        width: "var(--denote-sidebar-width)",
        height: "calc(100vh - var(--denote-header-height))",
      }}
    >
      <CollapsibleNav
        navigation={config.navigation}
        currentPath={currentPath}
      />
    </aside>
  );
}
