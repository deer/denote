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
    accent: "#22c55e", // Accent color for highlights
  },
};
```

### Color Variables

Denote uses CSS custom properties for theming:

```css
:root {
  --color-primary: #6366f1;
  --color-accent: #22c55e;
  --color-text: #1f2937;
  --color-text-muted: #6b7280;
  --color-background: #ffffff;
  --color-surface: #f9fafb;
  --color-border: #e5e7eb;
}

.dark {
  --color-text: #f9fafb;
  --color-text-muted: #9ca3af;
  --color-background: #030712;
  --color-surface: #111827;
  --color-border: #1f2937;
}
```

## Dark Mode

Dark mode is enabled by default and respects the user's system preference. Users
can also toggle between modes using the theme button in the header.

### Forcing a Theme

To force a specific theme, you can set the `theme` property:

```typescript
export const config: DocsConfig = {
  theme: "dark", // or "light" or "system"
};
```

## Typography

Denote uses a modern font stack optimized for readability:

- **Headings**: System UI font stack with bold weight
- **Body**: System UI font stack for optimal performance
- **Code**: Monospace font stack for code blocks

## Layout

### Sidebar Width

Customize the sidebar width in your CSS:

```css
:root {
  --sidebar-width: 16rem;
}
```

### Content Width

The main content area has a max-width for optimal readability:

```css
:root {
  --content-max-width: 48rem;
}
```

## Custom CSS

Add custom styles by creating a `static/custom.css` file:

```css
/* Custom styles */
.doc-content h1 {
  color: var(--color-primary);
}

.code-block {
  border-radius: 0.75rem;
  border: 1px solid var(--color-border);
}
```

Then include it in your `routes/_app.tsx`:

```typescript
<link rel="stylesheet" href="/custom.css" />;
```
