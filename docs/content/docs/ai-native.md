---
title: AI Native
description: How Denote makes your documentation a first-class data source for AI agents
ai-summary: Denote serves docs to both humans and AI agents. Three layers of AI access - llms.txt for discovery, JSON API for structured data and RAG pipelines, and MCP server for live tool integration with Cursor, Claude, and ChatGPT. All auto-generated from markdown, zero config.
ai-keywords:
  - ai
  - llms.txt
  - mcp
  - json-api
  - rag
  - embeddings
  - cursor
  - claude
  - chatgpt
---

# AI Native

> **See also:** The [API Reference](/docs/api) documents the specific endpoints
> (JSON API, llms.txt) mentioned on this page.

Every Denote site is designed to serve two audiences: humans browsing your docs,
and AI agents consuming your knowledge programmatically.

## Why it matters

AI coding assistants like Cursor, Claude, and ChatGPT are now the primary way
many developers interact with documentation. When someone asks "how do I
configure X?", the AI needs to find and read your docs — fast, accurately, and
in a format it understands.

Most documentation platforms treat AI access as an afterthought. Denote builds
it in from day one.

## Three layers of AI access

### 1. llms.txt — AI Discovery

Every Denote site auto-generates `/llms.txt` following the
[llms.txt standard](https://llmstxt.org/). This is a curated index of your
documentation that tells AI agents what's available and where to find it.

```text
# My Project

> Project documentation

## Docs

- [Introduction](https://docs.example.com/docs/introduction): Getting started guide
- [API Reference](https://docs.example.com/docs/api): Complete API documentation
```

There's also `/llms-full.txt` — your entire documentation concatenated into a
single file, optimized for context windows.

### 2. JSON API — Structured Data

The `/api/docs` endpoint serves your documentation as structured JSON, ready for
RAG pipelines, embedding generation, or direct context injection:

```json
{
  "name": "My Project",
  "pages": [
    {
      "slug": "introduction",
      "title": "Introduction",
      "description": "Getting started guide",
      "content": "# Introduction\n\nWelcome to...",
      "headings": [
        { "level": 1, "title": "Introduction", "id": "introduction" }
      ]
    }
  ]
}
```

### 3. MCP Server — Live Tool Access

The built-in [MCP](https://modelcontextprotocol.io/) server turns your docs into
tools that AI agents can search and read on demand.

Enable it in your config:

```typescript
// denote.config.ts
export const config = {
  // ... other config
  ai: {
    mcp: true,
  },
};
```

## MCP on your deployed site

When `mcp: true` is set, your **deployed docs site itself becomes an MCP
endpoint** at `/mcp`. No local setup needed — AI agents connect directly to your
live docs URL.

This is the key differentiator: your documentation site isn't just web pages,
it's a live API that any MCP-compatible tool can query.

Point any MCP client to your site's `/mcp` endpoint:

```json
{
  "mcpServers": {
    "my-docs": {
      "url": "https://docs.example.com/mcp"
    }
  }
}
```

The endpoint supports Streamable HTTP with full CORS, so it works from any
origin.

## Local MCP (stdio)

For local development, you can also run the MCP server via stdio transport. This
is useful for tools like Cursor and Claude Desktop that connect to local MCP
servers.

### Cursor

Add to your `.cursor/mcp.json`:

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

### Claude Desktop

Add to your Claude Desktop config:

```json
{
  "mcpServers": {
    "my-docs": {
      "command": "deno",
      "args": ["run", "-A", "/path/to/your/project/mcp.ts"]
    }
  }
}
```

## Available tools and resources

The MCP server exposes:

- **Tools**: `search_docs` (find pages by keyword), `get_doc` (read a single
  page), `get_all_docs` (full documentation dump)
- **Resources**: `docs://index` (page listing), `docs://{slug}` (individual
  pages)

All responses include canonical web URLs back to your docs site, so AI agents
can link users to the source.

## AI Chatbot Widget

Denote includes a built-in "Ask AI" chat widget that appears on every doc page.
Enable it in your config:

```typescript
// denote.config.ts
export const config = {
  // ... other config
  ai: {
    chatbot: true,
  },
};
```

By default, the chatbot uses keyword search to find relevant doc pages. For
LLM-powered answers, configure an OpenAI-compatible API provider:

```typescript
ai: {
  chatbot: true,
  provider: {
    apiUrl: "https://api.openai.com/v1/chat/completions",
    model: "gpt-4o-mini",
    apiKey: "sk-...", // or set DENOTE_AI_API_KEY env var
  },
},
```

The provider uses your full documentation (`llms-full.txt`) as context, so the
AI answers are grounded in your actual docs.

## Content Tags

Use frontmatter fields to improve AI understanding of your pages:

```yaml
---
title: Authentication
ai-summary: OAuth2 and API key auth with JWT tokens, refresh flows, and scoped permissions.
ai-keywords:
  - authentication
  - oauth2
  - jwt
---
```

See [Writing Content](/docs/content) for full details on AI content tags.

## Zero configuration

All AI endpoints are generated automatically from your Markdown files. No
plugins, no API keys, no indexing pipeline. Write your docs, and the AI layer
just works.
