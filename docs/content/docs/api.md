---
title: API Reference
description: REST API endpoints for programmatic access to your documentation
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

Returns the search index — all pages with truncated content for
search/filtering.

```bash
curl https://your-docs.com/api/search
```

**Response:**

```json
[
  {
    "title": "Introduction",
    "description": "Welcome to the project",
    "slug": "introduction",
    "content": "First 500 characters of content..."
  }
]
```

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

You can add custom API routes in the `routes/` directory using Fresh v2's
routing:

```typescript
// routes/api/custom.ts
export const handler = {
  GET: async () => {
    const data = { message: "Custom API endpoint" };
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  },
};
```

Or register them directly in `main.ts`:

```typescript
app.get("/api/custom", (ctx) => {
  return new Response(JSON.stringify({ hello: "world" }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

## Fresh v2

Denote is built on [Fresh v2](https://fresh.deno.dev/docs/). For details on
routing, middleware, and app configuration, see the
[Fresh v2 documentation](https://fresh.deno.dev/docs/).
