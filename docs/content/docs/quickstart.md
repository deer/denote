---
title: Quick Start
description: Get your first documentation page up in 5 minutes
ai-summary: Step-by-step guide to create your first Denote documentation page. Covers creating markdown files with frontmatter, adding navigation entries, and running the dev server.
ai-keywords: [
  quickstart,
  tutorial,
  markdown,
  frontmatter,
  navigation,
  dev server,
  first page,
]
---

# Quick Start

Let's create your first documentation page!

## Step 1: Create a Markdown File

Create a new file in `content/docs/` called `hello.md`:

```markdown
---
title: Hello World
description: My first documentation page
---

# Hello World

Welcome to my documentation!

## Getting Started

This is a simple example of a documentation page.

- Item one
- Item two
- Item three
```

Pretty simple, right?

## Step 2: Add to Navigation

Update your `denote.config.ts` to include the new page:

```typescript
import type { DenoteConfig } from "@denote/core";

export const config: DenoteConfig = {
  name: "My Docs",
  navigation: [
    {
      title: "Getting Started",
      children: [
        { title: "Introduction", href: "/docs/introduction" },
        { title: "Hello World", href: "/docs/hello" }, // Add this
      ],
    },
  ],
};
```

> [!NOTE]
> Pages must be added to `navigation` in `denote.config.ts` to appear in the
> sidebar. Files in `content/docs/` are accessible by URL but won't show in
> navigation until configured.

## Step 3: View Your Page

Start the dev server and navigate to `/docs/hello`:

```bash
deno task dev
```

Your new page is now live! 🎉

## Next Steps

- [Writing Content](/docs/content) — Frontmatter options and markdown syntax
- [Configuration](/docs/configuration) — Customize navigation, branding, and
  more
- [Components](/docs/components) — Built-in UI components and islands
