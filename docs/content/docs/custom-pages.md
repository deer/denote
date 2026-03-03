---
title: Custom Pages
description: Add standalone pages like legal notices, about pages, or anything outside the docs layout
ai-summary: Add standalone routes (legal, about, landing pages) outside the docs layout. Fresh file-system routing with automatic PageLayout wrapping. Supports typed state via createDefine and access to DenoteContext.
ai-keywords: [
  custom pages,
  routes,
  Fresh,
  file-system routing,
  PageLayout,
  standalone,
  legal pages,
  createDefine,
]
---

# Custom Pages

Denote sites aren't limited to documentation pages. You can add standalone
routes — legal pages, landing pages, about pages — that get the site header and
footer automatically without the docs sidebar and table of contents.

## Creating a Page

Add a `.tsx` file to your project's `routes/` directory. Denote wraps it in a
`PageLayout` that provides the site header and a footer with your configured
links. Your component only needs to render its own content.

```tsx
// routes/about.tsx
export default function AboutPage() {
  return (
    <>
      <h1 class="text-3xl font-bold text-[var(--denote-text)] mb-8">
        About
      </h1>
      <p class="text-[var(--denote-text-secondary)]">
        This is a standalone page with the site header and footer.
      </p>
    </>
  );
}
```

This page is now available at `/about`.

## What You Get

The `PageLayout` wrapper provides:

- **Site header** — logo, top navigation, theme toggle, search, mobile menu
- **Footer** — copyright notice and any links from your `footer` config
- **Consistent styling** — centered content area with site background color

You don't need to import or render any of these — they're automatic.

## Footer Configuration

Footer links appear on all pages wrapped by `PageLayout`. Configure them in your
`denote.config.ts`:

```typescript
export const config: DenoteConfig = {
  // ...
  footer: {
    copyright: "© 2026 My Project",
    links: [
      { title: "GitHub", href: "https://github.com/my/project" },
      { title: "Privacy", href: "/privacy" },
    ],
  },
};
```

## How It Works

Denote uses Fresh's file-system routing. When you call `denote()` in your
`main.ts`, it registers the documentation routes first (with their own
`DocsLayout`), then applies `PageLayout` to any routes in your `routes/`
directory. This means:

- **Docs pages** (`/docs/*`) use the docs layout with sidebar and TOC
- **Your pages** (`routes/*.tsx`) use the simpler `PageLayout` with header and
  footer
- **No double-wrapping** — each route type gets exactly one layout

## Styling

Custom pages have access to all Denote CSS variables. Use them to stay
consistent with the site theme:

```tsx
<div class="text-[var(--denote-text)]">          {/* Primary text */}
<p class="text-[var(--denote-text-secondary)]">   {/* Secondary text */}
<a class="text-[var(--denote-primary-text)]">      {/* Link color */}
<hr class="border-[var(--denote-border)]" />        {/* Border color */}
```

See the [Theming & Styling](/docs/theming) page for all available tokens.

## Next Steps

- [Theming & Styling](/docs/theming) — All available CSS variables and dark mode
- [Deployment](/docs/deployment) — Deploy to Deno Deploy or Docker
