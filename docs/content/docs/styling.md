---
title: Styling
description: CSS and Tailwind styling options for your documentation
---

# Styling

Denote uses Tailwind CSS v4 for styling, giving you full control over your
documentation's appearance.

## Tailwind CSS

Tailwind is included by default. Use CSS custom properties from the
[Theming system](/docs/theming) to keep your components theme-aware:

```typescript
function Card({ title, children }) {
  return (
    <div class="p-6 rounded-xl bg-[var(--denote-bg-secondary)] border border-[var(--denote-border)] shadow-sm">
      <h3 class="text-lg font-semibold text-[var(--denote-text)] mb-2">
        {title}
      </h3>
      <p class="text-[var(--denote-text-secondary)]">{children}</p>
    </div>
  );
}
```

This approach ensures your components automatically adapt to light mode, dark
mode, and any custom theme — without needing `dark:` prefixes.

## When to Use `dark:` Prefixes

For **semantic colors** that don't map to theme tokens (e.g., status badges,
alerts), Tailwind's `dark:` prefix is still appropriate:

```typescript
// Semantic: always green for success, not theme-dependent
<span class="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
  Active
</span>;
```

For **everything else** (backgrounds, text, borders, surfaces), use CSS vars.

## Markdown Content Styling

Documentation content is rendered by `@deer/gfm` and styled via the
`.markdown-body` class. Denote bridges its theme tokens to GFM variables
automatically, so markdown content follows your theme.

Custom overrides go in `assets/styles.css`:

```css
/* Example: customizing heading sizes */
.markdown-body h1 {
  font-size: 2.25rem;
  font-weight: 700;
}

/* Example: styled blockquotes */
.markdown-body blockquote {
  border-left-color: var(--gfm-accent-color);
  background: var(--gfm-inline-code-bg);
  border-radius: 0 0.5rem 0.5rem 0;
}
```

## Code Block Styling

Code blocks use the `.highlight` wrapper and `.code-header` from `@deer/gfm`,
with syntax highlighting via lowlight:

```css
/* Code block container */
.markdown-body .highlight {
  border-radius: 0.75rem;
  border: 1px solid var(--gfm-border-color);
  overflow: hidden;
}

/* Language label + copy button header */
.markdown-body .code-header {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.75rem;
  text-transform: uppercase;
}
```

## Responsive Design

Denote is fully responsive:

| Breakpoint         | Layout                                |
| ------------------ | ------------------------------------- |
| **xl+** (1280px)   | Sidebar + content + table of contents |
| **lg–xl** (1024px) | Sidebar + content                     |
| **< lg**           | Collapsible mobile menu               |

## Custom Components

Create styled components using theme tokens for automatic dark mode support:

```typescript
// components/Button.tsx
interface ButtonProps {
  variant?: "primary" | "secondary";
  children: ComponentChildren;
}

export function Button({ variant = "primary", children }: ButtonProps) {
  const base = "px-4 py-2 rounded-lg font-medium transition-colors";
  const variants = {
    primary:
      "bg-[var(--denote-primary)] hover:bg-[var(--denote-primary-hover)] text-[var(--denote-text-inverse)]",
    secondary:
      "bg-[var(--denote-bg-secondary)] hover:bg-[var(--denote-bg-tertiary)] text-[var(--denote-text)] border border-[var(--denote-border)]",
  };

  return <button class={`${base} ${variants[variant]}`}>{children}</button>;
}
```

## Best Practices

1. **Use CSS vars for theme colors** — `bg-[var(--denote-bg)]` adapts to any
   theme automatically
2. **Reserve `dark:` for semantics** — status colors, badges, alerts
3. **Test both modes** — toggle dark mode to verify contrast and readability
4. **Use the config first** — most customizations belong in `docs.config.ts`,
   not custom CSS
