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
    primary: "#6366f1", // Indigo
    accent: "#22c55e", // Green
  },
};
```

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
};
```
