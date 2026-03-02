---
title: Installation
description: How to install and set up Denote for your project
ai-summary: Install Denote via deno init with the @denote/init scaffolder. Requires Deno 2.x. Creates a ready-to-run project with config, content directory, routes, and dev server.
ai-keywords: [
  install,
  deno,
  scaffold,
  init,
  setup,
  prerequisites,
  project structure,
  dev server,
]
---

# Installation

Get up and running with Denote in minutes.

## Prerequisites

Before you begin, make sure you have [Deno](https://deno.com) installed on your
system:

```bash
# Install Deno (macOS/Linux)
curl -fsSL https://deno.com/install.sh | sh

# Or with Homebrew
brew install deno
```

## Create a New Project

The easiest way to get started is using our init command:

```bash
deno run -Ar jsr:@denote/init my-docs
cd my-docs
```

This will create a new Denote project with the following structure:

```
my-docs/
├── content/
│   └── docs/
│       ├── introduction.md
│       └── installation.md
├── static/
├── denote.config.ts
├── deno.json
└── .gitignore
```

## Start the Development Server

Run the development server to see your docs:

```bash
deno task dev
```

Open [http://localhost:8000](http://localhost:8000) to view your documentation
site.

## Project Structure

- `content/docs/` - Your documentation markdown files
- `denote.config.ts` - Site configuration (navigation, branding, etc.)
- `static/` - Static assets (images, fonts, etc.)

## Next Steps

- [Quick Start](/docs/quickstart) - Build your first doc page
- [Configuration](/docs/configuration) - Customize your site
- [Writing Content](/docs/content) - Learn the markdown syntax
