# 🦕 Denote

[![JSR Score](https://jsr.io/badges/@denote/core/score)](https://jsr.io/@denote/core)
[![JSR](https://jsr.io/badges/@denote/core)](https://jsr.io/@denote/core)
[![CI](https://github.com/deer/denote/actions/workflows/deploy.yml/badge.svg)](https://github.com/deer/denote/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Documentation that speaks to machines and humans.**

**Live demo:** [denote.sh](https://denote.sh)

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
- ⚡ **Lightning Fast** — Minimal client JavaScript. Fast page loads, no bloat.
- 🚀 **Deploy Anywhere** — Docker, Deno Deploy, or any server. One-click cloud
  or self-host.

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

Enable MCP in your config, then point any MCP client at your site:

```json
{
  "mcpServers": {
    "my-docs": {
      "url": "https://docs.example.com/mcp"
    }
  }
}
```

## Features

- 🔍 **⌘K Search** — Ranked full-text search powered by MiniSearch with fuzzy
  and prefix matching. Lazily loaded, no external service needed.
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
import type { DenoteConfig } from "@denote/core";

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

Connect your GitHub repo to [Deno Deploy](https://deno.com/deploy) for automatic
deployments on every push. See the
[Fresh deployment guide](https://fresh.deno.dev/docs/deployment).

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
│   │   ├── components/   # Server-rendered Preact components
│   │   ├── islands/      # Client-side interactive components
│   │   ├── lib/          # Core utilities (markdown, docs, AI)
│   │   ├── routes/       # Fresh file-based routes
│   │   ├── denote.config.ts  # Config type definitions
│   │   └── mod.ts        # Library entry point
│   └── denote-init/      # Scaffolding CLI (@denote/init)
├── docs/                 # Documentation site (denote.sh)
│   ├── content/docs/     # Markdown documentation files
│   ├── denote.config.ts  # Site configuration
│   └── vite.config.ts    # Vite build configuration
├── deno.json             # Workspace root config
└── Dockerfile
```

## Tech Stack

- [Deno](https://deno.com) — Runtime
- [Fresh](https://fresh.deno.dev) — Web framework
- [Preact](https://preactjs.com) — UI rendering
- [Tailwind CSS v4](https://tailwindcss.com) — Styling
- [Vite](https://vite.dev) — Dev server & bundler

## License

MIT
