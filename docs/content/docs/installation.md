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
├── client.ts
├── denote.config.ts
├── deno.json
├── Dockerfile
├── main.ts
├── README.md
├── styles.css
├── vite.config.ts
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
- `main.ts` - Fresh app entry point
- `vite.config.ts` - Vite build configuration
- `client.ts` - Client-side entry for CSS
- `styles.css` - Tailwind CSS imports
- `static/` - Static assets (images, fonts, etc.)
- `Dockerfile` - Production Docker image

## Validate Your Project

Run the built-in validation to catch common issues:

```bash
deno task validate
```

This checks your project for:

- **Config errors** — missing `name`, invalid hex colors, malformed URLs,
  unrecognized keys
- **Content issues** — missing `content/docs/` directory, files without a
  `title` in frontmatter
- **Broken navigation links** — any `href` in your `navigation` config that
  doesn't match an existing markdown file

If your project uses custom paths, pass `--content-dir` and `--docs-base-path`:

```bash
deno run -A jsr:@denote/core/validate --content-dir=./my-content --docs-base-path=/reference
```

Fix any errors before deploying to avoid broken links or missing pages.

## Next Steps

- [Quick Start](/docs/quickstart) — Build your first doc page
- [Configuration](/docs/configuration) — Customize your site
- [Writing Content](/docs/content) — Learn the markdown syntax
