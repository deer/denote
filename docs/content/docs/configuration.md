---
title: Configuration
description: Configure your Denote documentation site
---

# Configuration

Denote is configured through the `docs.config.ts` file in your project root.

## Basic Configuration

```typescript
import type { DocsConfig } from "./types.ts";

export const config: DocsConfig = {
  name: "My Documentation",
  logo: {
    light: "/logo.svg",
    dark: "/logo-dark.svg",
  },
  favicon: "/favicon.ico",
};
```

## Navigation

The navigation structure defines your sidebar and breadcrumbs:

```typescript
export const config: DocsConfig = {
  navigation: [
    {
      title: "Getting Started",
      children: [
        { title: "Introduction", href: "/docs/introduction" },
        { title: "Installation", href: "/docs/installation" },
      ],
    },
    {
      title: "Guides",
      children: [
        { title: "Writing Content", href: "/docs/content" },
        { title: "Components", href: "/docs/components" },
      ],
    },
  ],
};
```

Navigation sections are collapsible in the sidebar — users can click the chevron
to expand or collapse them. Their preferences persist across page loads.

The navigation order also determines the **previous/next** page links at the
bottom of each doc page and the **breadcrumb trail** shown above the title.

## Colors

Customize your brand colors:

```typescript
export const config: DocsConfig = {
  colors: {
    primary: "#6366f1", // Links, buttons, accents
    accent: "#22c55e", // Secondary accent
  },
};
```

For full control over surfaces, text, and borders:

```typescript
export const config: DocsConfig = {
  colors: {
    primary: "#6366f1",
    accent: "#22c55e",
    background: "#ffffff", // Page background
    surface: "#f9fafb", // Cards, sidebar
    text: "#111827", // Body text
    border: "#e5e7eb", // Borders
    dark: {
      primary: "#818cf8",
      background: "#030712",
      surface: "#0a0a0a",
      text: "#f9fafb",
      border: "#1f2937",
    },
  },
};
```

See the [Theming guide](/docs/theming) for the full list of design tokens and
how auto-derivation works.

## Layout

Control dimensions and visibility of layout elements:

```typescript
export const config: DocsConfig = {
  layout: {
    sidebarWidth: 280, // Sidebar width in px
    maxContentWidth: 900, // Content area max width in px
    headerHeight: 56, // Header height in px
    tocWidth: 240, // Table of contents width in px
    toc: false, // Hide table of contents
    breadcrumbs: false, // Hide breadcrumbs
    footer: false, // Hide prev/next footer
  },
};
```

## Landing Page

Skip the landing page and redirect to docs:

```typescript
export const config: DocsConfig = {
  landing: {
    enabled: false, // Redirect "/" to first doc page
    redirectTo: "/docs/quickstart", // Optional custom target
  },
};
```

## Style

Control border radius, dark mode behavior, and custom CSS:

```typescript
export const config: DocsConfig = {
  style: {
    roundedness: "lg", // "none" | "sm" | "md" | "lg" | "xl"
    darkMode: "auto", // "auto" | "light" | "dark" | "toggle"
    customCss: "/custom.css", // Custom CSS file loaded after theme tokens
  },
};
```

See the [Theming guide](/docs/theming) for details on each option.

## Top Navigation

Add links to your header:

```typescript
export const config: DocsConfig = {
  topNav: [
    { title: "Documentation", href: "/docs" },
    { title: "Blog", href: "/blog" },
    { title: "GitHub", href: "https://github.com/<your-org>/<your-repo>" },
  ],
};
```

## Social Links

Add social media links:

```typescript
export const config: DocsConfig = {
  social: {
    github: "https://github.com/<your-org>/<your-repo>",
    twitter: "https://twitter.com/<your-handle>",
    discord: "https://discord.gg/<your-invite-code>",
  },
};
```

## Footer

Configure your footer:

```typescript
export const config: DocsConfig = {
  footer: {
    copyright: "© 2026 Your Organization",
    links: [
      { title: "Terms", href: "/terms" },
      { title: "Privacy", href: "/privacy" },
    ],
  },
};
```

## SEO

Denote includes several built-in SEO features that work automatically:

### Per-Page Meta Tags

Each page's `title` and `description` from frontmatter are used for the HTML
`<title>` tag and `<meta name="description">`. Always add descriptive
frontmatter to your pages for better search engine visibility.

### OpenGraph & Twitter Cards

Denote automatically generates OpenGraph (`og:title`, `og:description`,
`og:url`, `og:image`) and Twitter Card meta tags for every page. This ensures
your documentation looks great when shared on social media.

### Sitemap

A `sitemap.xml` is automatically generated at `/sitemap.xml` and includes all
documentation pages. Search engines use this to discover and index your content.

### Robots.txt

A `robots.txt` file is served at `/robots.txt` with an `Allow: /` directive and
a reference to the sitemap. No configuration needed.

### Canonical URLs

Each page includes an `og:url` tag with its canonical URL, helping search
engines avoid duplicate content issues.

## Analytics

Denote has built-in support for Google Analytics 4 (GA4). When enabled, it
automatically tracks page views and exceptions server-side — no client-side
script needed.

### Setup

1. Set `ga4: true` in your config:

```typescript
export const config: DocsConfig = {
  name: "My Docs",
  ga4: true,
  // ...
};
```

2. Set the `GA4_MEASUREMENT_ID` environment variable with your GA4 measurement
   ID (e.g. `G-XXXXXXXXXX`).

That's it. Denote will send `page_view` events for HTML responses and
`exception` events when errors occur. If the environment variable isn't set,
you'll see a warning in the console and analytics will be silently disabled.

### How It Works

- **Server-side only** — no tracking scripts are injected into your pages
- **Non-blocking** — analytics are sent asynchronously after the response
- **Selective** — only GET/POST requests that serve HTML documents are tracked;
  static assets (CSS, JS, images, fonts) are automatically skipped
- **Error tracking** — unhandled errors are reported as GA4 `exception` events
  with severity info

### Deployment

On **Deno Deploy**, add `GA4_MEASUREMENT_ID` in your project's environment
variables settings. For **Docker** or **VPS** deployments, set it in your
environment or `.env` file.

## Full Example

Here's a complete configuration example:

```typescript
import type { DocsConfig } from "./types.ts";

export const config: DocsConfig = {
  name: "Acme Docs",
  logo: {
    light: "/logo.svg",
    dark: "/logo-dark.svg",
  },
  favicon: "/favicon.ico",
  colors: {
    primary: "#0066cc",
    accent: "#00cc66",
    // background, surface, text, border, dark are also available
    // See "Theming" docs for full options
  },
  navigation: [
    {
      title: "Getting Started",
      children: [
        { title: "Introduction", href: "/docs/introduction" },
        { title: "Installation", href: "/docs/installation" },
      ],
    },
  ],
  topNav: [
    { title: "Docs", href: "/docs" },
    { title: "API", href: "/api" },
  ],
  social: {
    github: "https://github.com/acme/docs",
  },
  footer: {
    copyright: "© 2026 Acme Inc.",
  },
  search: {
    enabled: true,
  },
  layout: {
    toc: true,
    breadcrumbs: true,
    footer: true,
  },
  style: {
    roundedness: "md",
    darkMode: "auto",
  },
  ga4: true,
};
```
