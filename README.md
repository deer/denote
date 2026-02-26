# 🦕 Denote

[![JSR Score](https://jsr.io/badges/@denote/core/score)](https://jsr.io/@denote/core)
[![JSR](https://jsr.io/badges/@denote/core)](https://jsr.io/@denote/core)
[![CI](https://github.com/deer/denote/actions/workflows/deploy.yml/badge.svg)](https://github.com/deer/denote/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Documentation that speaks to machines and humans.**

The open-source docs framework with llms.txt, MCP server, and structured JSON
API built in. Every AI feature free.

Open Source · AI-Native · Self-Hostable

## Why Denote?

Traditional docs tools weren't built for a world where AI agents read your
documentation too. Denote is:

- 🤖 **AI-Native** — Built-in MCP server, llms.txt, and JSON API. Your docs are
  a first-class data source for AI agents — not an afterthought.
- 📝 **Markdown First** — Write docs in Markdown with frontmatter. No MDX
  compilation step. Just files.
- ⚡ **Lightning Fast** — Server-rendered with Fresh's island architecture.
  Minimal client JavaScript.
- 🦕 **Deno Native** — Built on Deno's secure runtime. TypeScript-first.
- 🚀 **Deploy Anywhere** — One-click Deno Deploy, or self-host on anything that
  runs Deno. Docker support included.

## Quick Start

```bash
deno run -Ar jsr:@denote/init
```

That's it. You'll have a docs site running locally in under a minute.

## AI Features

Every Denote site ships with these endpoints out of the box — zero config:

| Endpoint             | What it does                                               |
| -------------------- | ---------------------------------------------------------- |
| `GET /llms.txt`      | AI discovery file following the open standard              |
| `GET /llms-full.txt` | Full documentation context for LLMs                        |
| `GET /api/docs`      | Structured JSON API for RAG, embeddings, or direct context |
| MCP server           | Expose docs as tools/resources for Cursor, Claude, ChatGPT |

### MCP Setup

```json
{
  "mcpServers": {
    "my-docs": {
      "command": "deno",
      "args": ["run", "-A", "mcp.ts"]
    }
  }
}
```

## Features

- 🔍 **⌘K Search** — Instant full-text search with keyboard navigation. No
  external service needed.
- 📱 **Mobile Responsive** — Collapsible sidebar, touch-friendly navigation.
- 📑 **Table of Contents** — Auto-generated from headings.
- 🧭 **Config-driven Navigation** — Define your sidebar in TypeScript.

## Writing Docs

Create `.md` files in `content/docs/`:

```markdown
---
title: My Page
description: A brief description for search and SEO
---

# My Page

Write your documentation here with full Markdown support.
```

## Configuration

Edit `denote.config.ts` to customize navigation, branding, and more:

```typescript
export const config: DenoteConfig = {
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
    github: "https://github.com/your-org/your-docs",
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

## Project Structure

```
denote/
├── packages/
│   ├── denote/           # Core library (@denote/core)
│   │   ├── components/   # Server-rendered components
│   │   ├── islands/      # Interactive client components
│   │   ├── lib/          # Utilities (markdown, search, AI)
│   │   ├── routes/       # Fresh file-based routes
│   │   └── mod.ts        # Library entry point
│   └── denote-init/      # Scaffolding CLI (@denote/init)
├── docs/                 # Documentation site (denote.sh)
│   ├── content/docs/     # Markdown documentation files
│   ├── denote.config.ts  # Site configuration
│   └── .denote/           # Generated build files (gitignored)
├── deno.json             # Workspace root config
└── Dockerfile
```

## Tech Stack

- [Deno](https://deno.land) — Runtime
- [Fresh](https://fresh.deno.dev) — Web framework
- [Preact](https://preactjs.com) — UI rendering
- [Tailwind CSS v4](https://tailwindcss.com) — Styling
- [Vite](https://vite.dev) — Dev server & bundler

## License

MIT
