---
title: Theming & Styling
description: Customize colors, fonts, layout, and CSS through config alone
---

# Theming & Styling

Denote's theming system lets you fully customize the look and feel of your
documentation site through `denote.config.ts` — no component edits, no CSS
overrides, no `!important` hacks.

## How It Works

Denote uses **CSS custom properties** (design tokens) for all visual
customization. Every surface, text color, border, and shadow references a
`--denote-*` variable. When you set colors in your config, Denote generates
overrides that cascade correctly over the defaults.

Components use Tailwind CSS v4 with these CSS variables, so they automatically
adapt to light mode, dark mode, and any custom theme:

```tsx
<div class="p-6 rounded-xl bg-[var(--denote-bg-secondary)] border border-[var(--denote-border)]">
  <h3 class="text-lg font-semibold text-[var(--denote-text)]">{title}</h3>
  <p class="text-[var(--denote-text-secondary)]">{children}</p>
</div>;
```

## Colors

Set your brand colors in `denote.config.ts`:

```typescript
export const config: DenoteConfig = {
  colors: {
    primary: "#6366f1", // Links, buttons, accents
    accent: "#22c55e", // Secondary accent color
  },
};
```

For full control, you can customize every surface:

```typescript
export const config: DenoteConfig = {
  colors: {
    primary: "#b45309", // Brand color
    accent: "#059669", // Secondary accent
    background: "#fef3c7", // Page background
    surface: "#fde68a", // Cards, sidebar, code blocks
    text: "#451a03", // Body text
    border: "#d97706", // Borders and dividers
  },
};
```

When you set `primary`, Denote automatically derives hover, subtle, and shadow
variants using `color-mix()`. You only need to set the base color.

## Dark Mode

Dark mode works out of the box with sensible defaults. To customize dark mode
colors independently, add a `dark` object:

```typescript
export const config: DenoteConfig = {
  colors: {
    primary: "#b45309",
    accent: "#059669",
    background: "#fef3c7",
    surface: "#fde68a",
    text: "#451a03",
    border: "#d97706",
    dark: {
      primary: "#f59e0b",
      accent: "#34d399",
      background: "#042f2e",
      surface: "#0f766e",
      text: "#ccfbf1",
      border: "#115e59",
    },
  },
};
```

If you set `colors.primary` but no `dark.primary`, Denote auto-derives a lighter
variant for dark mode. If you don't set any dark overrides, the built-in dark
palette (indigo on near-black) is used.

### Dark Mode Toggle

Users can toggle between light and dark mode using the moon/sun icon in the
header. The preference is saved to `localStorage` and respected on subsequent
visits. If no preference is saved, Denote follows the system preference
(`prefers-color-scheme`).

### Dark Mode Behavior

Control how dark mode works via the `style` config:

```typescript
export const config: DenoteConfig = {
  style: {
    darkMode: "auto", // "auto" | "light" | "dark" | "toggle"
  },
};
```

| Mode     | Behavior                                         |
| -------- | ------------------------------------------------ |
| `auto`   | Follow system preference, show toggle (default)  |
| `light`  | Force light mode, hide toggle                    |
| `dark`   | Force dark mode, hide toggle                     |
| `toggle` | Default to dark, show toggle for users to switch |

### When to Use `dark:` Prefixes

For **semantic colors** that don't map to theme tokens (e.g., status badges,
alerts), Tailwind's `dark:` prefix is still appropriate:

```tsx
// Semantic: always green for success, not theme-dependent
<span class="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
  Active
</span>;
```

For **everything else** (backgrounds, text, borders, surfaces), use CSS
variables. They adapt to any theme automatically — no `dark:` needed.

## Fonts

Customize the font families used across your site:

```typescript
export const config: DenoteConfig = {
  fonts: {
    body: '"Source Sans 3", system-ui, sans-serif',
    heading: '"Newsreader", Georgia, serif',
    mono: '"JetBrains Mono", ui-monospace, monospace',
    imports: [
      "https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700&display=swap",
      "https://fonts.googleapis.com/css2?family=Newsreader:wght@400;700&display=swap",
    ],
  },
};
```

The `imports` array adds `<link rel="stylesheet">` tags for web font loading.
Font families are applied via CSS custom properties, so they affect the entire
site including markdown content.

## Layout

Control the dimensions of major layout sections:

```typescript
export const config: DenoteConfig = {
  layout: {
    sidebarWidth: 280, // px (default: 256)
    maxContentWidth: 900, // px (default: 768)
    headerHeight: 56, // px (default: 64)
    tocWidth: 240, // px (default: 256)
  },
};
```

These become CSS custom properties (`--denote-sidebar-width`, etc.) consumed by
all layout components. You can also toggle visibility of layout elements:

```typescript
export const config: DenoteConfig = {
  layout: {
    toc: false, // Hide table of contents sidebar
    breadcrumbs: false, // Hide breadcrumb navigation
    footer: false, // Hide prev/next footer navigation
  },
};
```

### Responsive Breakpoints

Denote is fully responsive:

| Breakpoint         | Layout                                |
| ------------------ | ------------------------------------- |
| **xl+** (1280px)   | Sidebar + content + table of contents |
| **lg–xl** (1024px) | Sidebar + content                     |
| **< lg**           | Collapsible mobile menu               |

## Landing Page

By default, Denote shows a landing page at `/`. To skip it and redirect straight
to your first documentation page:

```typescript
export const config: DenoteConfig = {
  landing: {
    enabled: false, // Redirect "/" to first doc page
  },
};
```

You can also specify a custom redirect path:

```typescript
export const config: DenoteConfig = {
  landing: {
    enabled: false,
    redirectTo: "/docs/quickstart", // Custom target
  },
};
```

## Roundedness

Control the border radius scale across the entire site:

```typescript
export const config: DenoteConfig = {
  style: {
    roundedness: "lg", // "none" | "sm" | "md" | "lg" | "xl"
  },
};
```

| Scale  | `--denote-radius` | `--denote-radius-lg` | `--denote-radius-xl` |
| ------ | ----------------- | -------------------- | -------------------- |
| `none` | 0                 | 0                    | 0                    |
| `sm`   | 0.25rem           | 0.375rem             | 0.5rem               |
| `md`   | 0.5rem            | 0.75rem              | 1rem                 |
| `lg`   | 0.75rem           | 1rem                 | 1.25rem              |
| `xl`   | 1rem              | 1.25rem              | 1.5rem               |

## Custom CSS

For an escape hatch beyond what the config supports, point to a custom CSS file:

```typescript
export const config: DenoteConfig = {
  style: {
    customCss: "/custom.css", // Loaded after all theme tokens
  },
};
```

The file is loaded via a `<link>` tag after all theme styles, so it can override
any token. Use `html:root` for specificity parity with config-driven overrides.

### Markdown Content

Documentation content is rendered by `@deer/gfm` and styled via the
`.markdown-body` class. Denote bridges its theme tokens to GFM variables
automatically (see [GFM Bridge](#gfm-bridge)), so markdown content follows your
theme. Custom overrides go in your CSS file:

```css
/* Heading sizes */
.markdown-body h1 {
  font-size: 2.25rem;
  font-weight: 700;
}

/* Styled blockquotes */
.markdown-body blockquote {
  border-left-color: var(--gfm-accent-color);
  background: var(--gfm-inline-code-bg);
  border-radius: 0 0.5rem 0.5rem 0;
}
```

### Code Blocks

Code blocks use the `.highlight` wrapper and `.code-header` from `@deer/gfm`:

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

## Custom Components

Create styled components using theme tokens for automatic dark mode support:

```tsx
interface ButtonProps {
  variant?: "primary" | "secondary";
  children: ComponentChildren;
}

function Button({ variant = "primary", children }: ButtonProps) {
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

## Design Tokens Reference

These are the CSS custom properties that control the theme. All components
reference these tokens — you never need to edit component files.

| Token                        | Purpose                                  |
| ---------------------------- | ---------------------------------------- |
| `--denote-primary`           | Brand color for links, buttons, accents  |
| `--denote-primary-hover`     | Hover state of primary color             |
| `--denote-primary-subtle`    | Light tint for backgrounds               |
| `--denote-primary-text`      | Primary color used for text              |
| `--denote-accent`            | Secondary accent color                   |
| `--denote-bg`                | Page background                          |
| `--denote-bg-secondary`      | Sidebar, card backgrounds                |
| `--denote-bg-tertiary`       | Code block backgrounds, subtle surfaces  |
| `--denote-surface-overlay`   | Modal/overlay backdrop                   |
| `--denote-text`              | Primary body text                        |
| `--denote-text-secondary`    | Secondary/subdued text                   |
| `--denote-text-muted`        | Muted text (timestamps, hints)           |
| `--denote-text-inverse`      | Text on dark backgrounds                 |
| `--denote-border`            | Default border color                     |
| `--denote-border-strong`     | Emphasized borders                       |
| `--denote-shadow-color`      | Box shadow color                         |
| `--denote-shadow-primary`    | Primary-tinted shadow                    |
| `--denote-font-body`         | Body text font family                    |
| `--denote-font-heading`      | Heading font family                      |
| `--denote-font-mono`         | Monospace font family                    |
| `--denote-sidebar-width`     | Sidebar width (default: 256px)           |
| `--denote-content-max-width` | Max content area width (default: 768px)  |
| `--denote-header-height`     | Header height (default: 64px)            |
| `--denote-toc-width`         | Table of contents width (default: 256px) |
| `--denote-radius`            | Base border radius                       |
| `--denote-radius-lg`         | Large border radius                      |
| `--denote-radius-xl`         | Extra-large border radius                |

## GFM Bridge

Denote automatically bridges its tokens to `@deer/gfm` variables, so markdown
content follows your theme without extra configuration:

| Denote Token              | GFM Variable         |
| ------------------------- | -------------------- |
| `--denote-text-secondary` | `--gfm-fg-default`   |
| `--denote-text`           | `--gfm-fg-heading`   |
| `--denote-primary`        | `--gfm-accent-color` |
| `--denote-border`         | `--gfm-border-color` |
| `--denote-bg-secondary`   | `--gfm-bg-subtle`    |
| `--denote-bg-tertiary`    | `--gfm-bg-surface`   |

## Real-World Example: denote.sh

The [denote.sh](https://denote.sh) documentation site uses the theming system to
achieve a warm, editorial look — parchment backgrounds, serif headings, and a
matching dark mode — all through config alone:

```typescript
export const config: DenoteConfig = {
  name: "Denote",
  logo: {
    text: "denote", // Lowercase in header
    suffix: ".sh", // Rendered in primary color
  },
  colors: {
    primary: "#2d5016", // forest green
    accent: "#b8860b", // dark goldenrod
    background: "#faf6f1", // parchment
    surface: "#f0ebe4", // warm linen
    text: "#2c2c2c", // charcoal
    border: "#d4cec6", // warm gray
    dark: {
      primary: "#7ec96a", // vibrant green, readable on dark
      accent: "#e9b84e", // warm gold
      background: "#0d1117", // deep dark
      surface: "#1c2333", // visible separation from bg
      text: "#e6edf3", // soft white
      border: "#30363d", // clear borders
    },
  },
  fonts: {
    heading: '"Newsreader", Georgia, serif',
    body: '"Source Sans 3", system-ui, sans-serif',
    imports: [
      "https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,400;0,700;1,400&display=swap",
      "https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700&display=swap",
    ],
  },
  style: {
    roundedness: "lg",
  },
};
```

This demonstrates how the theming system can create a dramatically different
aesthetic from the defaults — no custom CSS, no component overrides, just
config.

## Best Practices

1. **Use CSS vars for theme colors** — `bg-[var(--denote-bg)]` adapts to any
   theme automatically
2. **Reserve `dark:` for semantics** — status colors, badges, alerts that have
   fixed meaning regardless of theme
3. **Use the config first** — most customizations belong in `denote.config.ts`,
   not custom CSS
4. **Test both modes** — toggle dark mode to verify contrast and readability
