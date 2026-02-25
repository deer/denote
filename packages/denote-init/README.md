# @denote/init

[![JSR](https://jsr.io/badges/@denote/init)](https://jsr.io/@denote/init)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/deer/denote/blob/main/LICENSE)

Scaffold a new [Denote](https://denote.sh) documentation project.

## Usage

```bash
deno run -Ar jsr:@denote/init
```

This will prompt for a project name and create a ready-to-run docs site with:

- `denote.config.ts` — site configuration
- `content/docs/` — starter markdown pages
- `deno.json` — tasks for dev, build, validate, and MCP

## Options

```bash
deno run -Ar jsr:@denote/init my-docs   # Create "my-docs" directory
deno run -Ar jsr:@denote/init .         # Initialize in current directory
```

## Programmatic API

```ts
import { initProject } from "@denote/init";

await initProject({ dir: "./my-docs", name: "my-docs" });
```

## License

MIT
