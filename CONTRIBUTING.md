# Contributing to Denote

Thanks for your interest in contributing! This guide will help you get started.

## Development Setup

### Prerequisites

- [Deno](https://deno.com) v2.x or later

### Getting Started

```bash
# Clone the repo
git clone https://github.com/deer/denote.git
cd denote

# Install dependencies
deno install

# Start the dev server
deno task dev
```

Open [http://localhost:8000](http://localhost:8000) to see the site.

### Available Tasks

| Command           | Description                                |
| ----------------- | ------------------------------------------ |
| `deno task dev`   | Start the Vite dev server                  |
| `deno task build` | Build for production                       |
| `deno task start` | Serve the production build                 |
| `deno task test`  | Run tests                                  |
| `deno task ok`    | Run fmt check, lint, type check, and tests |

## Making Changes

### Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b my-feature`
3. Make your changes
4. Run `deno task ok` to verify everything passes
5. Commit with a descriptive message
6. Push and open a pull request

### Code Style

- Run `deno fmt` before committing — the CI checks formatting
- Run `deno lint` to catch issues early
- TypeScript strict mode is enabled

### Project Structure

```
denote/
├── packages/
│   ├── denote/           # Core library (@denote/core)
│   │   ├── components/   # Server-rendered Preact components
│   │   ├── islands/      # Client-side interactive components
│   │   ├── lib/          # Core utilities (markdown, docs, AI)
│   │   ├── routes/       # Fresh file-based routes
│   │   └── denote.config.ts  # Config type definitions
│   └── denote-init/      # Scaffolding CLI (@denote/init)
└── docs/                 # Documentation site (denote.sh)
    ├── content/docs/     # Markdown documentation files
    └── denote.config.ts  # Docs site configuration
```

### Writing Documentation

- Place `.md` files in `docs/content/docs/`
- Use YAML frontmatter for `title` and `description`
- Add new pages to the `navigation` array in `docs/denote.config.ts`
- Keep paragraphs on single lines (the markdown parser is regex-based)

### Tests

- Tests live next to their source files (`packages/denote/lib/foo.ts` →
  `packages/denote/lib/foo_test.ts`)
- Run tests with `deno task test`
- Add tests for new functionality where practical

## Reporting Issues

- Use GitHub Issues for bugs and feature requests
- Include steps to reproduce for bugs
- Check existing issues before creating a new one

## License

By contributing, you agree that your contributions will be licensed under the
[MIT License](./LICENSE).
