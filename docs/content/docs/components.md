---
title: Components
description: Built-in UI components and interactive islands in Denote
---

# Components

Denote includes several built-in components that enhance the documentation
experience. These are a mix of server-rendered components and interactive
islands (client-side JavaScript).

## Navigation Components

### Breadcrumbs

Breadcrumbs appear automatically above each page title, showing the navigation
path (e.g., **Getting Started > Installation**). They're generated from your
`docs.config.ts` navigation structure.

### Collapsible Sidebar

The sidebar navigation supports collapsible sections. Click the chevron arrow
next to any section title to expand or collapse it. Your preferences are saved
in `localStorage` and persist across page loads.

### Previous / Next Navigation

Links to the previous and next pages appear at the bottom of each doc page. The
order is determined by your navigation configuration in `docs.config.ts`.

## Interactive Islands

Denote uses Fresh's island architecture to ship JavaScript only where needed:

### Search (⌘K)

Press `⌘K` (or `Ctrl+K`) to open the search modal. It searches across all doc
page titles, descriptions, and content. Navigate results with arrow keys and
press Enter to select.

### Active Table of Contents

The right sidebar shows the current page's headings and highlights the active
section as you scroll. This uses client-side scroll tracking to update in real
time.

### Copy Button on Code Blocks

Every code block has a copy button that appears on hover. Click the clipboard
icon to copy the code to your clipboard. A checkmark confirms the copy was
successful.

### Theme Toggle

Toggle between light and dark mode using the sun/moon icon in the header. Your
preference is saved in `localStorage`.

### Mobile Menu

On smaller screens, the sidebar collapses into a hamburger menu accessible from
the header.

## Custom Components

You can create your own components in the `components/` directory:

```typescript
// components/MyComponent.tsx
export function MyComponent({ children }) {
  return (
    <div class="my-custom-component">
      {children}
    </div>
  );
}
```

For interactive components, create them as islands:

```typescript
// islands/Counter.tsx
import { useSignal } from "@preact/signals";

export function Counter() {
  const count = useSignal(0);

  return (
    <button onClick={() => count.value++}>
      Count: {count.value}
    </button>
  );
}
```

Islands are automatically discovered by Fresh and only ship JavaScript for the
interactive parts of the page.
