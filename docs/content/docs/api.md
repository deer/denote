---
title: API Reference
description: REST API endpoints for programmatic access to your documentation
ai-summary: REST API endpoints for programmatic access. GET /api/docs returns structured JSON, GET /api/search returns the search index, GET /llms.txt and /llms-full.txt provide AI-optimized markdown, POST /mcp serves MCP protocol.
ai-keywords: [
  API,
  REST,
  JSON,
  search index,
  llms.txt,
  MCP,
  endpoints,
  programmatic access,
  structured data,
]
---

# API Reference

> **See also:** [AI Native](/docs/ai-native) explains the design philosophy
> behind these endpoints and how AI agents use them.

Every Denote site exposes several API endpoints for programmatic access. These
are available automatically — no configuration required.

## Endpoints

### GET /api/docs

Returns all documentation pages as structured JSON.

```bash
curl https://your-docs.com/api/docs
```

**Response:**

```json
{
  "name": "My Project",
  "pages": [
    {
      "slug": "introduction",
      "title": "Introduction",
      "description": "Welcome to the project",
      "content": "# Introduction\n\nFull markdown content...",
      "headings": [
        { "level": 1, "title": "Introduction", "id": "introduction" },
        { "level": 2, "title": "Quick Start", "id": "quick-start" }
      ]
    }
  ]
}
```

### GET /api/search

Returns the search index — all pages with content truncated to the first 500
characters, plus AI metadata when available.

```bash
curl https://your-docs.com/api/search
```

**Response:**

```json
[
  {
    "title": "Introduction",
    "description": "Welcome to the project",
    "aiSummary": "Project overview and getting started guide.",
    "aiKeywords": ["intro", "overview"],
    "slug": "introduction",
    "content": "# Introduction\n\nWelcome to the project..."
  }
]
```

Fields `aiSummary` and `aiKeywords` are included when the page defines
`ai-summary` and `ai-keywords` frontmatter.

### GET /llms.txt

Returns an AI-readable index of your documentation following the
[llms.txt standard](https://llmstxt.org/).

```bash
curl https://your-docs.com/llms.txt
```

**Response:**

```text
# My Project

> Project documentation

## Docs

- [Introduction](https://your-docs.com/docs/introduction): Welcome to the project
- [Installation](https://your-docs.com/docs/installation): How to install

## API

- [Full docs as markdown](https://your-docs.com/llms-full.txt): Complete documentation
- [Structured JSON](https://your-docs.com/api/docs): All pages as JSON
```

### GET /llms-full.txt

Returns your entire documentation concatenated into a single markdown file.
Designed for loading into AI context windows.

```bash
curl https://your-docs.com/llms-full.txt
```

This is useful for:

- Feeding full project context to an LLM
- Building RAG pipelines
- Generating embeddings across all your docs

## MCP Server

For richer AI integration, Denote includes a built-in
[Model Context Protocol](https://modelcontextprotocol.io/) server. See the
[AI Native](/docs/ai-native) page for setup instructions.

### MCP Tools

| Tool           | Description                                |
| -------------- | ------------------------------------------ |
| `search_docs`  | Search documentation by query string       |
| `get_doc`      | Get full content of a page by slug         |
| `get_all_docs` | Get entire documentation as one text block |

### MCP Resources

| Resource        | Description                               |
| --------------- | ----------------------------------------- |
| `docs://index`  | List of all available documentation pages |
| `docs://{slug}` | Content of a specific documentation page  |

## Custom Endpoints

Register custom API routes on the Fresh app instance in your `main.ts`. The
`app` returned by `denote()` is a standard Fresh app, so you can add routes with
`app.get()`, `app.post()`, etc.:

```typescript
// main.ts
import { denote } from "@denote/core";
import { config } from "./denote.config.ts";

export const app = denote({ config });

app.get("/api/custom", (ctx) => {
  return new Response(JSON.stringify({ hello: "world" }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

## Fresh

Denote is built on [Fresh](https://fresh.deno.dev/docs/). For details on
routing, middleware, and app configuration, see the
[Fresh documentation](https://fresh.deno.dev/docs/).

## Next Steps

- [AI Native](/docs/ai-native) — Design philosophy behind these endpoints
- [Custom Pages](/docs/custom-pages) — Add standalone routes to your app
- [Deployment](/docs/deployment) — Deploy to Deno Deploy or Docker
