# 🦕 Denote

A Mintlify-inspired documentation platform built on **Deno** and **Fresh v2**.

Write Markdown. Get beautiful docs. Zero build step.

## Features

- 📝 **Markdown with Frontmatter** — Write docs in plain Markdown with YAML
  frontmatter
- 🎨 **Beautiful Design** — Mintlify-inspired UI with Tailwind CSS
- 🌙 **Dark Mode** — System-aware with manual toggle
- 🔍 **Built-in Search** — Instant full-text search (⌘K)
- 📱 **Mobile Responsive** — Collapsible sidebar, touch-friendly
- ⚡ **Lightning Fast** — Server-rendered with Fresh v2's island architecture
- 📑 **Table of Contents** — Auto-generated from headings
- 🧭 **Config-driven Navigation** — Define your sidebar in TypeScript
- 🦕 **Deno Native** — No node_modules, no npm, just Deno

## Quick Start

```bash
# Clone and enter the project
git clone https://github.com/<your-org>/denote.git
cd denote

# Start the dev server
deno task dev
```

Open [http://localhost:8000](http://localhost:8000).

## Project Structure

```
denote/
├── content/docs/         # Your Markdown documentation files
│   ├── introduction.md
│   ├── installation.md
│   └── ...
├── docs.config.ts        # Navigation, branding, colors
├── components/           # Server-rendered components
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   ├── DocsLayout.tsx
│   └── TableOfContents.tsx
├── islands/              # Interactive (client-side) components
│   ├── Search.tsx        # ⌘K search modal
│   ├── ThemeToggle.tsx   # Dark/light mode
│   └── MobileMenu.tsx    # Mobile sidebar
├── lib/                  # Utilities
│   ├── markdown.ts       # Markdown parsing + frontmatter
│   ├── highlight.ts      # Shiki syntax highlighting
│   ├── ai.ts             # AI/MCP utilities
│   └── docs.ts           # Document loader
├── routes/               # Fresh file-based routes
│   ├── _app.tsx          # HTML shell
│   ├── index.tsx         # Landing page
│   └── docs/
│       ├── index.tsx     # Docs index redirect
│       └── [...slug].tsx # Dynamic doc pages
├── static/               # Static assets (favicon, logos)
├── assets/styles.css     # Tailwind + custom styles
├── main.ts               # Fresh app entry
├── client.ts             # Client-side entry
├── mcp.ts                # MCP server entry
├── vite.config.ts        # Vite configuration
└── deno.json             # Deno config + tasks
```

## Writing Docs

Create `.md` files in `content/docs/`:

```markdown
---
title: My Page
description: A brief description for search and SEO
---

# My Page

Write your documentation here with full Markdown support.

## Code Blocks

\`\`\`typescript const hello = "world"; \`\`\`

## Links

[Link to another page](/docs/other-page)
```

## Configuration

Edit `docs.config.ts` to customize navigation, branding, and more:

```typescript
export const config: DocsConfig = {
  name: "My Docs",
  colors: {
    primary: "#6366f1",
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
  social: {
    github: "https://github.com/<your-org>/denote",
  },
};
```

## Deploy

### Deno Deploy

```bash
deno task build
deployctl deploy --project=my-docs _fresh/server.js
```

### Docker

```bash
docker build -t my-docs .
docker run -p 8000:8000 my-docs
```

## Tech Stack

- [Deno](https://deno.land) — Runtime
- [Fresh v2](https://fresh.deno.dev) — Web framework
- [Preact](https://preactjs.com) — UI rendering
- [Tailwind CSS v4](https://tailwindcss.com) — Styling
- [Vite](https://vite.dev) — Dev server & bundler

## License

MIT
