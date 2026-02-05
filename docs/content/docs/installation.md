---
title: Installation
description: How to install and set up Denote for your project
---

# Installation

Get up and running with Denote in minutes.

## Prerequisites

Before you begin, make sure you have [Deno](https://deno.land) installed on your
system:

```bash
# Install Deno (macOS/Linux)
curl -fsSL https://deno.land/install.sh | sh

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
│       └── introduction.md
├── docs.config.ts
├── deno.json
├── main.ts
└── routes/
    └── ...
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
- `docs.config.ts` - Site configuration (navigation, branding, etc.)
- `routes/` - Fresh routes for custom pages
- `static/` - Static assets (images, fonts, etc.)

## Next Steps

- [Quick Start](/docs/quickstart) - Build your first doc page
- [Configuration](/docs/configuration) - Customize your site
- [Writing Content](/docs/content) - Learn the markdown syntax
