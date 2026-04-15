---
name: documenting-with-denote
description: Use when asked to document a project with Denote, create a Denote docs site, or set up denote.sh-style AI-native documentation for a codebase. Covers scaffolding, config customization, content conventions, AI-frontmatter, and verification.
---

# Documenting with Denote

## Overview

Denote (https://denote.sh) is an AI-native documentation framework built on
Deno + Fresh v2. A Denote site is created by scaffolding with
`jsr:@denote/init`, editing `denote.config.ts`, and writing markdown pages under
`content/docs/`. It ships with `/llms.txt`, `/llms-full.txt`, an MCP server, a
per-page JSON API, and SEO — these exist automatically once the site runs.

## When to use

- User asks to document a project "with Denote" or create a denote.sh-style docs
  site
- Project needs AI-accessible docs (llms.txt, MCP) alongside human-facing pages
- Code project wants a quickstart + reference site without standing up
  Docusaurus/Astro

## When not to use

- Project already has working MDX/Docusaurus/Astro docs — don't migrate
  unnecessarily
- Single-README docs that don't need their own site
- Auto-generated API refs from source comments (Denote doesn't generate — you
  write)

## Workflow

### 1. Research the project first

Read the README, source entry points, public exports, tests (for realistic
usage), and `package.json` / `deno.json`. **Do not start writing docs until you
understand what the project does and who its users are.** Grep for exports,
check bin scripts, read tests. If the project has a one-liner identity (e.g.
"Denote is an AI-native documentation framework"), find it or draft it now —
everything else downstream depends on it.

### 2. Decide where the site lives

Two shapes:

- **`docs/` subdirectory inside the project** — most common. Docs live with
  code, simpler hosting.
- **Sibling directory or separate repo** — if the parent is a Deno workspace you
  don't want to modify, or docs are maintained independently.

**Gotcha:** if the parent project's `deno.json` has a `workspace` field,
scaffolding inside it throws `Config file must be a member of the workspace`.
Either add the docs dir to the parent's `workspace[]`, or scaffold outside the
workspace entirely.

### 3. Scaffold

```sh
deno run -Ar jsr:@denote/init my-docs
cd my-docs
deno task dev
```

Open http://localhost:8000, confirm the default landing page loads, then Ctrl+C.
If the dev server fails here, stop and debug before writing content — almost
always a Deno version or workspace conflict.

### 4. Customize `denote.config.ts`

The config is the primary customization surface. Never edit `styles.css` or
component code in the scaffold.

- **`name`, `logo.text`, `logo.suffix`** — project branding. The suffix renders
  in the primary color (e.g. `denote` + `.sh`).
- **`colors`** — set `primary` at minimum; hover/subtle/shadow variants
  auto-derive via `color-mix()`. For a custom palette set `background`,
  `surface`, `text`, `border`, and optionally a `dark` override block. If you
  don't set `dark.*`, Denote auto-derives dark variants.
- **`fonts`** — only if the project has distinctive typography. Self-host: drop
  `.woff2` files in `static/fonts/`, create `static/fonts.css` with
  `@font-face`, list it in `fonts.imports`. Never use Google Fonts (leaks
  visitor IPs).
- **`landing`** — hero (badge/title/titleHighlight/description),
  primary+secondary CTAs, install snippet, `features[]` for the feature grid.
  For docs-first sites (typical for developer tools), set
  `landing.enabled: false` and `landing.redirectTo: "/docs/introduction"`.
- **`navigation`** — ordered array of doc pages (field is `navigation`, not
  `nav`); entries must match file paths under `content/docs/`. Files not listed
  in `navigation` are silently omitted from the sidebar (still reachable by
  URL).
- **`topNav`** — links shown in the top navigation bar; typically
  `Documentation` + `GitHub`.
- **`social.github`** — GitHub repo URL; renders a GitHub icon in the header.
- **`style.roundedness`** — `"none" | "sm" | "md" | "lg" | "xl"`.
- **`style.darkMode`** — `"auto"` (follows system), `"toggle"` (user can
  switch), `"dark"` (dark only), `"light"` (light only). Use `"dark"` to commit
  to a dark theme and remove the toggle entirely.
- **`style.customCss`** — path to an escape-hatch CSS file for anything tokens
  can't express.

### 5. Write content

Pages live in `content/docs/*.md` with YAML frontmatter:

```markdown
---
title: Introduction
description: One-sentence page description for SEO
ai-summary: Paragraph-length summary for LLM consumers. Describes what this page teaches and when a reader would need it.
ai-keywords: [keyword, concept, api-name]
---

# Introduction

Denote is an AI-native documentation framework...
```

**Single-line paragraphs only.** Denote's markdown parser treats any newline as
a paragraph break. Soft-wrap in your editor, do not hard-wrap in the file.
Bullet lists and code fences work normally.

**YAML quoting:** If an `ai-summary` or `description` value contains a colon
followed by a space (e.g. `modules: logging`), wrap the entire value in double
quotes or the YAML parser will silently drop the field.

### Content philosophy: usage over configuration

**Document what users build, not what they configure.** The most common failure
mode in framework documentation is drowning the reader in configuration options
before they've seen a single working example. Avoid it:

- **Show the happy path first.** Every page should open with a realistic,
  runnable code example. Config tables and option lists come after, if at all.
- **Omit exhaustive option listings.** Don't enumerate every function, method,
  or setting. Show the common case; trust the reader to find advanced options in
  source or IDE autocomplete.
- **Prefer narrative over tables.** A sentence explaining _why_ you'd use
  something beats a two-column table of option names.
- **Write from the reader's task, not the API's structure.** The reader isn't
  thinking "what does `setupCors()` accept?" — they're thinking "how do I allow
  my frontend to call my API?" Write to that.

The test: if a page reads like auto-generated API reference, rewrite it. If
someone could copy-paste the first code block and have something working, you're
on track.

### 6. Typical page set for a code project

- `introduction.md` — what it is, why it exists, core concepts
- `quickstart.md` — shortest path from zero to working
- `installation.md` — if non-trivial
- `configuration.md` — config reference
- `api.md` or `reference.md` — public API surface
- `deployment.md` — how to ship it
- Project-specific sections (e.g. `plugins.md`, `security.md`)

Match `navigation` in `denote.config.ts` to this ordering.

### 7. Populate AI frontmatter deliberately

`ai-summary` and `ai-keywords` feed `/llms.txt`, `/llms-full.txt`, and the MCP
server. They are not redundant with `description`. Write them to answer **"what
does an LLM need to know about this page to help its user?"** — not just a
restatement of the title.

Good `ai-summary` example:

> Covers theming via CSS custom properties (--denote-* tokens) driven by config.
> Explains color palette with auto-derived dark mode, font self-hosting, layout
> dimensions, roundedness presets, and the customCss escape hatch.

Bad `ai-summary` example:

> This is the theming page.

### 8. Verify before handing off

```sh
deno task validate   # broken links, nav mismatches, config errors
deno task build      # production build must succeed
deno task dev        # manual visual check
```

`validate` catches the vast majority of authoring mistakes. Don't skip it.

## Gotchas

| Symptom                                                        | Cause                               | Fix                                                                                    |
| -------------------------------------------------------------- | ----------------------------------- | -------------------------------------------------------------------------------------- |
| `Config file must be a member of the workspace`                | Scaffolding inside a Deno workspace | Add docs dir to parent `workspace[]` or scaffold outside                               |
| Paragraphs visually running together                           | Hard-wrapped markdown lines         | One paragraph = one line, soft-wrap in editor                                          |
| Page exists but not in sidebar                                 | Not listed in `navigation[]`        | Add it to `navigation` in the config                                                   |
| Broken internal links at build time                            | File renamed, link not updated      | `deno task validate`                                                                   |
| Dark mode doesn't match brand                                  | Auto-derived from primary looks off | Set explicit `colors.dark.*` block                                                     |
| CSS custom class doesn't apply                                 | Tailwind not scanning that file     | `@source "./"` in styles.css covers it; framework classes are pre-compiled and shipped |
| `validate` reports missing title / failed to parse frontmatter | Unquoted colon-space in YAML value  | Wrap the offending field value in double quotes                                        |

## AI-native features (zero author config)

Once your site runs, these exist automatically:

- `/llms.txt` — index of pages for LLM consumers, uses `ai-summary` /
  `ai-keywords`
- `/llms-full.txt` — full-text concatenation of all pages
- `/api/docs/<slug>` — JSON API per page (frontmatter + HTML + raw markdown)
- `/docs/<slug>.md` — raw markdown URL for any page
- MCP server with `get_doc`, `list_docs`, `search_docs` tools (full-text search
  via MiniSearch)

The only author input these need is the `ai-summary` and `ai-keywords`
frontmatter on each page.

## Reference

- Live docs: https://denote.sh
- Init CLI help: `deno run -Ar jsr:@denote/init --help`
- JSR packages: `@denote/core`, `@denote/init`
