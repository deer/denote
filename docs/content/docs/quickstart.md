---
title: Quick Start
description: Get your first documentation page up in 5 minutes
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

## Code Example

Here's some code:

\`\`\`typescript const greeting = "Hello, World!"; console.log(greeting); \`\`\`

Pretty simple, right?
```

## Step 2: Add to Navigation

Update your `denote.config.ts` to include the new page:

```typescript
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

## Step 3: View Your Page

Start the dev server and navigate to `/docs/hello`:

```bash
deno task dev
```

Your new page is now live! 🎉

## What's Next?

- Learn about [frontmatter options](/docs/content#frontmatter)
- Explore [built-in components](/docs/components)
- Customize your [theme](/docs/theming)
