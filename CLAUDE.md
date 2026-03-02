# Denote

AI-native documentation framework built on Deno and Fresh v2. Renders markdown
docs with built-in AI access (llms.txt, MCP, JSON API), server-side analytics,
theming via CSS custom properties, and full SEO.

**Stack**: Deno, Fresh v2, Preact, Vite, Tailwind CSS v4, `@deer/gfm`,
`@modelcontextprotocol/sdk`, Zod

**Structure**: Deno workspace monorepo with three members:

- `packages/denote/` — `@denote/core`: the framework library (factory function,
  middleware pipeline, components, islands, lib modules)
- `packages/denote-init/` — `@denote/init`: CLI scaffolder that generates
  ready-to-run projects
- `docs/` — production docs site at denote.sh (dogfoods core)

For detailed architecture, module guide, data flows, and navigation guide, see
[docs/CODEBASE_MAP.md](docs/CODEBASE_MAP.md).

## Quick Reference

```bash
deno task dev       # Start docs dev server (delegates to docs/)
deno task test      # Run all tests across workspace
deno task ok        # Full CI gate: fmt + lint + check + test
deno task build     # Production build (delegates to docs/)
deno task validate  # Validate config + content + nav links
```

## Key Entry Points

| What              | Where                                                 |
| ----------------- | ----------------------------------------------------- |
| Framework factory | `packages/denote/mod.ts` → `denote()`                 |
| Config types      | `packages/denote/denote.config.ts` → `DenoteConfig`   |
| Runtime context   | `packages/denote/utils.ts` → `DenoteContext`, `State` |
| Scaffolder        | `packages/denote-init/mod.ts` → `initProject()`       |
| Docs site config  | `docs/denote.config.ts`                               |

## Conventions

- Tests co-located: `lib/foo.ts` → `lib/foo_test.ts`
- CSS tokens: `--denote-*` namespace
- Islands: `@preact/signals` with module-level signals
- Lib functions: receive `ctx: DenoteContext` (not singletons)
- Heavy modules (MCP, AI): lazy-imported in route handlers
- Content: single-line paragraphs (regex-based parser)
