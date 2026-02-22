---
title: Introduction
description: Denote — the open-source, AI-native documentation platform built on Deno and Fresh v2
ai-summary: Denote is an open-source, AI-native documentation platform built on Deno and Fresh v2. It auto-generates llms.txt, JSON API, and MCP server endpoints so AI agents can consume your docs as structured data. Zero config, server-rendered, markdown-first.
ai-keywords:
  - documentation
  - deno
  - fresh
  - ai-native
  - open-source
  - llms.txt
  - mcp
---

# Welcome to Denote

Denote is an open-source documentation platform built on **Deno** and **Fresh
v2** — designed for a world where AI agents read your docs too.

Write Markdown. Get a site that humans love and AI agents can query. Every AI
feature is built in and free.

## Why Denote?

Traditional documentation tools weren't built for the era of AI agents. They
require complex build steps, heavy dependencies, and bolted-on AI integrations.
Denote takes a different approach:

- **AI-Native**: Built-in MCP server, llms.txt, and structured JSON API — every
  site is a first-class data source for AI agents, out of the box.
- **Zero Config**: Works immediately with sensible defaults. No plugins, no
  setup.
- **Deno Native**: Built on Deno's secure runtime. TypeScript-first.
- **Markdown First**: Write your docs in Markdown with frontmatter. No MDX
  compilation step. Just files.
- **Lightning Fast**: Server-rendered with Fresh v2's island architecture.
  Minimal client JavaScript.

## AI Features

Every Denote site ships with these endpoints automatically:

- **`/llms.txt`** and **`/llms-full.txt`** — AI discovery files following the
  [llms.txt standard](https://llmstxt.org) for AI-readable documentation.
- **`/api/docs`** — Structured JSON API serving your entire knowledge base,
  ready for RAG pipelines, embeddings, or direct context injection.
- **MCP server** — Expose your docs as tools and resources for Cursor, Claude
  Desktop, ChatGPT, and any MCP-compatible client.

No extra config required. Just write Markdown.

## Quick Example

Here's a simple documentation file:

```markdown
---
title: My Page
description: A simple documentation page
---

# Hello World

Welcome to my documentation!
```

## Features at a Glance

- 🤖 AI-native: MCP server, llms.txt, JSON API
- 📝 Markdown with frontmatter support
- 🎨 Beautiful, responsive design with dark mode
- 🔍 Full-text search (⌘K)
- 📱 Mobile-friendly navigation
- ⚡ Lightning fast, server-rendered
- 🚀 Deploy anywhere — Deno Deploy, Docker, or self-host

## Getting Started

Ready to build your docs? Install in one command:

```bash
deno run -Ar jsr:@denote/init
```

Or head to the [Installation guide](/docs/installation) for more options.
