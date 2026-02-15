---
title: Theming
description: Customize colors, fonts, and dark mode through config alone
---

# Theming

Denote's theming system lets you fully customize the look and feel of your
documentation site through `docs.config.ts` — no component edits, no CSS
overrides, no `!important` hacks.

## How It Works

Denote uses **CSS custom properties** (design tokens) for all visual
customization. Every surface, text color, border, and shadow references a
`--denote-*` variable. When you set colors in your config, Denote generates
overrides that cascade correctly over the defaults.

## Colors

Set your brand colors in `docs.config.ts`:

```typescript
export const config: DocsConfig = {
  colors: {
    primary: "#6366f1", // Links, buttons, accents
    accent: "#22c55e", // Secondary accent color
  },
};
```

For full control, you can customize every surface:

```typescript
export const config: DocsConfig = {
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
export const config: DocsConfig = {
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

## Fonts

Customize the font families used across your site:

```typescript
export const config: DocsConfig = {
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

## Design Tokens Reference

These are the CSS custom properties that control the theme. All components
reference these tokens — you never need to edit component files.

| Token                      | Purpose                                 |
| -------------------------- | --------------------------------------- |
| `--denote-primary`         | Brand color for links, buttons, accents |
| `--denote-primary-hover`   | Hover state of primary color            |
| `--denote-primary-subtle`  | Light tint for backgrounds              |
| `--denote-primary-text`    | Primary color used for text             |
| `--denote-accent`          | Secondary accent color                  |
| `--denote-bg`              | Page background                         |
| `--denote-bg-secondary`    | Sidebar, card backgrounds               |
| `--denote-bg-tertiary`     | Code block backgrounds, subtle surfaces |
| `--denote-surface-overlay` | Modal/overlay backdrop                  |
| `--denote-text`            | Primary body text                       |
| `--denote-text-secondary`  | Secondary/subdued text                  |
| `--denote-text-muted`      | Muted text (timestamps, hints)          |
| `--denote-text-inverse`    | Text on dark backgrounds                |
| `--denote-border`          | Default border color                    |
| `--denote-border-strong`   | Emphasized borders                      |
| `--denote-shadow-color`    | Box shadow color                        |
| `--denote-shadow-primary`  | Primary-tinted shadow                   |
| `--denote-font-body`       | Body text font family                   |
| `--denote-font-heading`    | Heading font family                     |
| `--denote-font-mono`       | Monospace font family                   |

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

## Advanced: Custom CSS

For customizations beyond what the config supports, you can add a custom
stylesheet. Create a CSS file and include it in your app:

```css
/* Override specific tokens */
:root {
  --denote-primary: #e11d48;
}

/* Add custom markdown styles */
.markdown-body blockquote {
  border-left-width: 4px;
}
```

Note: config-driven overrides use `html:root` (higher specificity) to ensure
they always win. If you need to override config values with custom CSS, use
`html:root` as well.
