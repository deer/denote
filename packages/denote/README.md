# @denote/core

[![JSR Score](https://jsr.io/badges/@denote/core/score)](https://jsr.io/@denote/core)
[![JSR](https://jsr.io/badges/@denote/core)](https://jsr.io/@denote/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/deer/denote/blob/main/LICENSE)

**AI-native documentation framework for Deno and Fresh v2.**

Denote provides a complete docs platform with server-rendered pages, interactive
islands (search, AI chat, theme toggle), and AI-native endpoints (llms.txt, JSON
API, MCP server) — all generated from markdown content and a single TypeScript
config file.

## Quick Start

```bash
deno run -Ar jsr:@denote/init
```

## Usage

```ts
import { denote } from "@denote/core";

const app = denote({
  config: {
    name: "My Docs",
    navigation: [
      {
        title: "Guide",
        children: [
          { title: "Introduction", href: "/docs/introduction" },
        ],
      },
    ],
  },
});

app.listen();
```

## Features

- Server-rendered with Fresh v2's island architecture
- Built-in MCP server, llms.txt, and JSON API
- Full-text search with keyboard navigation
- Config-driven navigation, theming, and layout
- Google Analytics 4 integration (opt-in)
- Content Security Policy headers

## Documentation

Full documentation at [denote.sh](https://denote.sh).

## License

MIT
