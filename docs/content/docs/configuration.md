---
title: Configuration
description: Configure your Denote documentation site
---

# Configuration

Denote is configured through the `denote.config.ts` file in your project root.

## Basic Configuration

```typescript
import type { DenoteConfig } from "@denote/core";

export const config: DenoteConfig = {
  name: "My Documentation",
  logo: {
    light: "/logo.svg", // Image logo
    dark: "/logo-dark.svg", // Dark mode variant
    text: "mysite", // Text logo (overrides name in header)
    suffix: ".dev", // Styled suffix in primary color
  },
  favicon: "/favicon.ico",
};
```

## Navigation

The navigation structure defines your sidebar and breadcrumbs:

```typescript
export const config: DenoteConfig = {
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
export const config: DenoteConfig = {
  colors: {
    primary: "#6366f1", // Links, buttons, accents
    accent: "#22c55e", // Secondary accent
  },
};
```

For full control over surfaces, text, and borders:

```typescript
export const config: DenoteConfig = {
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
export const config: DenoteConfig = {
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
export const config: DenoteConfig = {
  landing: {
    enabled: false, // Redirect "/" to first doc page
    redirectTo: "/docs/quickstart", // Optional custom target
  },
};
```

## Style

Control border radius, dark mode behavior, and custom CSS:

```typescript
export const config: DenoteConfig = {
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
export const config: DenoteConfig = {
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
export const config: DenoteConfig = {
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
export const config: DenoteConfig = {
  footer: {
    copyright: "© 2026 Your Organization",
    links: [
      { title: "Terms", href: "/terms" },
      { title: "Privacy", href: "/privacy" },
    ],
  },
};
```

## Edit Link

Show an "Edit this page" link at the bottom of each doc page:

```typescript
export const config: DenoteConfig = {
  editUrl: "https://github.com/your-org/your-repo/edit/main/docs/content/docs",
};
```

Denote appends `/<slug>.md` automatically. If `editUrl` is not set, no link
appears.

## SEO

Denote includes several built-in SEO features that work automatically, plus an
optional `seo` config block for production sites that need full control.

### SEO Configuration

For production sites with a custom domain, add the `seo` block:

```typescript
export const config: DenoteConfig = {
  seo: {
    url: "https://denote.sh",
    ogImage: "https://denote.sh/og.png",
    ogImageWidth: 1200,
    ogImageHeight: 630,
    locale: "en",
    jsonLdType: "WebSite",
    jsonLdExtra: {
      author: { "@type": "Organization", name: "Denote" },
    },
  },
};
```

| Property        | Description                                                                    |
| --------------- | ------------------------------------------------------------------------------ |
| `url`           | Canonical base URL — unlocks proper canonical URLs, hreflang, and sitemap URLs |
| `ogImage`       | Default OG image for social sharing (1200x630 recommended)                     |
| `ogImageWidth`  | OG image width in pixels (default: 1200 when ogImage is set)                   |
| `ogImageHeight` | OG image height in pixels (default: 630 when ogImage is set)                   |
| `locale`        | Language code for `<html lang>` and hreflang tags (default: "en")              |
| `jsonLdType`    | JSON-LD `@type` (default: "WebSite", or "SoftwareApplication", etc.)           |
| `jsonLdExtra`   | Additional properties merged into the JSON-LD structured data object           |

All fields are optional. Without `seo`, Denote still generates correct meta tags
using the request origin as the base URL.

### Per-Page Meta Tags

Each page's `title` and `description` from frontmatter are used for the HTML
`<title>` tag and `<meta name="description">`. Always add descriptive
frontmatter to your pages for better search engine visibility.

### OpenGraph & Twitter Cards

Denote automatically generates OpenGraph (`og:title`, `og:description`,
`og:url`, `og:image`, `og:image:width`, `og:image:height`) and Twitter Card meta
tags for every page. When `seo.ogImage` is configured, it's used as the default
for all pages. Individual pages can override it with the `image` frontmatter
field.

### Sitemap

A `sitemap.xml` is automatically generated at `/sitemap.xml` and includes all
documentation pages with `<changefreq>` and `<priority>` elements (home=1.0,
docs index=0.8, pages=0.6). When `seo.url` is set, sitemap URLs use your
canonical domain instead of the request origin.

### Robots.txt

A `robots.txt` file is served at `/robots.txt` with an `Allow: /` directive and
a reference to the sitemap. When `seo.url` is set, the sitemap URL uses your
canonical domain.

### Canonical URLs

Each page includes a `<link rel="canonical">` tag and `og:url` meta tag. When
`seo.url` is configured, these use your canonical domain, helping search engines
avoid duplicate content issues across preview deployments.

### Structured Data (JSON-LD)

Denote auto-generates JSON-LD structured data on every page. By default it uses
`"WebSite"` as the `@type`. Customize it via the `seo` config:

```typescript
seo: {
  jsonLdType: "SoftwareApplication",
  jsonLdExtra: {
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  },
}
```

The `jsonLdExtra` properties are merged into the generated object alongside the
auto-populated `name`, `url`, and `description` fields.

## Analytics

Denote has built-in server-side analytics that works with privacy-friendly
providers. No client-side JavaScript, no cookies, fully GDPR-compliant.

### Built-in Providers

- **Umami** — Free cloud tier (100K events/mo), open source, EU-friendly
- **Plausible** — EU-hosted, starts at $9/mo
- **Custom** — Any endpoint that accepts JSON POST requests

### Setup

1. Add an `analytics` block to your config:

```typescript
export const config: DenoteConfig = {
  name: "My Docs",
  analytics: { provider: "umami" },
  // ...
};
```

2. Set the `ANALYTICS_SITE_ID` environment variable to your website ID:

```bash
export ANALYTICS_SITE_ID="your-website-id"
```

That's it. The endpoint defaults to the provider's cloud API (`cloud.umami.is`
for Umami, `plausible.io` for Plausible). Override with `endpoint` if you
self-host.

For **Plausible**:

```typescript
analytics: { provider: "plausible" },
// ANALYTICS_SITE_ID="your-domain.com"
```

For a **custom** provider, both `endpoint` and `siteId` (or the env var) are
required:

```typescript
analytics: {
  provider: "custom",
  endpoint: "https://my-analytics.example.com/collect",
},
// ANALYTICS_SITE_ID="my-site"
```

> **Why an env var?** Your site ID is the key that authorizes writes to your
> analytics account. If it's in your source code, anyone can read it and send
> bogus pageviews. Keeping it in an environment variable means it never leaks
> into your repo or client-side bundle.

### How It Works

- **Server-side only** — no tracking scripts are injected into your pages
- **No cookies** — visitor privacy is preserved by default
- **Non-blocking** — analytics are sent asynchronously after the response
- **Selective** — only GET requests returning HTML documents are tracked; static
  assets, API routes, and internal paths are automatically skipped

### Deployment

Set `ANALYTICS_SITE_ID` in your hosting platform's environment variables (Deno
Deploy, Docker, etc.). If the env var is missing, analytics are silently
disabled — your site still works fine.

## Full Example

Here's a complete configuration example:

```typescript
import type { DenoteConfig } from "@denote/core";

export const config: DenoteConfig = {
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
  analytics: {
    provider: "umami",
  },
  // Set ANALYTICS_SITE_ID env var in your hosting platform
  editUrl: "https://github.com/acme/docs/edit/main/docs/content/docs",
};
```
