---
title: Theming
description: Customize the look and feel of your documentation
---

# Theming

Denote comes with a beautiful default theme that supports both light and dark
modes.

## Color Scheme

The default color scheme uses indigo as the primary color. You can customize
this in your `docs.config.ts`:

```typescript
export const config: DocsConfig = {
  colors: {
    primary: "#6366f1", // Your primary brand color
  },
};
```

Setting `colors.primary` overrides the accent color used for links, focus rings,
heading anchors, blockquote borders, and checkboxes — in both light and dark
modes.

### CSS Variables

Denote uses CSS custom properties (via `@deer/gfm`) for theming. The defaults
ship with an indigo palette:

```css
:root {
  --gfm-fg-default: #374151;
  --gfm-fg-heading: #111827;
  --gfm-fg-muted: #6b7280;
  --gfm-accent-color: #6366f1;
  --gfm-accent-hover: #4f46e5;
  --gfm-accent-subtle: #a5b4fc;
  --gfm-border-color: #e5e7eb;
  --gfm-bg-subtle: #f8fafc;
  --gfm-bg-surface: #f1f5f9;
  --gfm-inline-code-color: #dc2626;
  --gfm-inline-code-bg: #f3f4f6;
}

.dark {
  --gfm-fg-default: #d1d5db;
  --gfm-fg-heading: #f9fafb;
  --gfm-fg-muted: #9ca3af;
  --gfm-accent-color: #a5b4fc;
  --gfm-accent-hover: #c7d2fe;
  --gfm-accent-subtle: #6366f1;
  --gfm-border-color: #374151;
  --gfm-bg-subtle: #0f172a;
  --gfm-bg-surface: #0b1120;
  --gfm-inline-code-color: #f87171;
  --gfm-inline-code-bg: #1f2937;
}
```

You can override any of these in your project's `styles.css` to fully customize
the theme beyond just the primary color.

## Dark Mode

Dark mode is enabled by default and respects the user's system preference. Users
can also toggle between modes using the theme button in the header.

## Typography

Denote uses a modern font stack optimized for readability:

- **Headings**: System UI font stack with bold weight
- **Body**: System UI font stack for optimal performance
- **Code**: Monospace font stack for code blocks

## Layout

The layout uses fixed widths via Tailwind utility classes:

- **Sidebar**: `w-64` (16rem), visible at the `lg` breakpoint (1024px+)
- **Content area**: `max-w-3xl` (48rem) centered in the main column
- **Table of contents**: `w-64` (16rem) on the right, visible at `xl` (1280px+)

## Custom CSS

Add custom styles by creating a `static/custom.css` file:

```css
/* Override theme variables */
:root {
  --gfm-accent-color: #e11d48;
  --gfm-accent-hover: #be123c;
  --gfm-accent-subtle: #fda4af;
}

/* Custom markdown styles */
.markdown-body h1 {
  color: var(--gfm-fg-heading);
}

.markdown-body .highlight {
  border-radius: 0.75rem;
  border: 1px solid var(--gfm-border-color);
}
```

Then include it in your `routes/_app.tsx`:

```typescript
<link rel="stylesheet" href="/custom.css" />;
```
