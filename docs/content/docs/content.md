---
title: Writing Content
description: Learn how to write documentation with Denote's markdown syntax
ai-summary: Write documentation in Markdown with YAML frontmatter (title, description, ai-summary, ai-keywords). Supports GFM syntax, code highlighting, tables, task lists, and single-line paragraph convention.
ai-keywords: [
  markdown,
  frontmatter,
  GFM,
  content,
  syntax highlighting,
  tables,
  ai-summary,
  ai-keywords,
  writing,
]
---

# Writing Content

Denote uses Markdown for documentation with frontmatter support for metadata.

## Frontmatter

Every documentation page starts with frontmatter:

```yaml
---
title: Page Title
description: A brief description of this page
icon: 📚
sidebarTitle: Short Title
order: 1
---
```

### Frontmatter Options

| Property       | Description                                              |
| -------------- | -------------------------------------------------------- |
| `title`        | The page title (required)                                |
| `description`  | A brief description for SEO and previews                 |
| `icon`         | An emoji or icon for the sidebar                         |
| `sidebarTitle` | A shorter title for the sidebar                          |
| `order`        | Sort order within the section                            |
| `image`        | OG image URL for social sharing (overrides site default) |
| `ai-summary`   | AI-optimized summary for LLM context/embeddings          |
| `ai-keywords`  | Keywords for AI retrieval and classification             |

### AI Content Tags

Denote's AI features use optional frontmatter fields to improve how AI agents
understand and retrieve your documentation:

```yaml
---
title: Authentication
description: How to authenticate with the API
ai-summary: OAuth2 and API key authentication. Supports JWT tokens, refresh flows, and scoped permissions. Rate limits apply per-key.
ai-keywords:
  - authentication
  - oauth2
  - api-keys
  - jwt
  - security
---
```

**`ai-summary`** — A concise, LLM-optimized summary of the page. Unlike
`description` (which targets humans and SEO), `ai-summary` should be dense with
technical details that help AI agents understand the page's content without
reading it. Used in llms.txt, the JSON API, and MCP tool responses.

**`ai-keywords`** — A list of keywords for AI retrieval. These are indexed in
the search API and MCP search tool, making pages discoverable by semantic
concepts that might not appear literally in the content.

Both fields are optional. When `ai-summary` is absent, Denote falls back to
`description`. When `ai-keywords` is absent, search relies on content matching.

## Markdown Syntax

### Headings

```markdown
# Heading 1

## Heading 2

### Heading 3

#### Heading 4
```

Headings automatically generate anchor links and appear in the table of
contents.

### Text Formatting

```markdown
**Bold text** _Italic text_ `inline code` ~~Strikethrough~~
```

**Bold text** renders as strong, _italic text_ as emphasis, `inline code` with a
highlighted background, and ~~strikethrough~~ with a line through it.

### Links

```markdown
[External Link](https://example.com) [Internal Link](/docs/other-page)
```

### Images

```markdown
![Alt text](/images/screenshot.png)
```

Images are rendered with lazy loading enabled. Place image files in the
`static/` directory and reference them with absolute paths.

### Lists

Denote supports both flat and nested lists:

```markdown
- Unordered item 1
- Unordered item 2
  - Nested child item
  - Another nested item
    - Deeply nested
- Back to top level

1. Ordered item 1
2. Ordered item 2
   1. Nested ordered
   2. Another nested
3. Back to top level
```

Nesting is controlled by indentation — use 2 or more spaces to create sub-lists.
You can mix ordered and unordered lists at different levels.

### Code Blocks

Use triple backticks with a language hint:

```typescript
function greet(name: string): string {
  return `Hello, ${name}!`;
}
```

Supported languages include: typescript, javascript, python, bash, json, yaml,
markdown, css, html, rust, go, sql, diff, toml, xml, and more.

Code blocks include a **copy button** that appears on hover — click the
clipboard icon to copy the code content.

### Tables

```markdown
| Feature | Status |
| ------- | ------ |
| Tables  | ✅     |
| Lists   | ✅     |
```

Tables support left, center, and right alignment using colons in the separator
row (`:---`, `:---:`, `---:`).

### Blockquotes

```markdown
> This is a blockquote. Use it for important notes or quotes.
```

> This is a blockquote. Use it for important notes or quotes.

### Horizontal Rules

Use three or more dashes to create a horizontal rule:

```markdown
---
```

---

## File Organization

Organize your docs in the `content/docs/` directory:

```
content/docs/
├── introduction.md       # /docs/introduction
├── installation.md       # /docs/installation
├── guides/
│   ├── index.md         # /docs/guides
│   ├── basics.md        # /docs/guides/basics
│   └── advanced.md      # /docs/guides/advanced
└── api/
    └── reference.md     # /docs/api/reference
```

## Extended Markdown Features

Denote uses `@deer/gfm` which supports GitHub Flavored Markdown extensions.

### Task Lists

```markdown
- [x] Completed task
- [ ] Incomplete task
- [ ] Another todo
```

- [x] Completed task
- [ ] Incomplete task
- [ ] Another todo

### GitHub Alerts

GitHub-style alerts using blockquote syntax:

```markdown
> [!NOTE]
> Useful information that users should know.

> [!TIP]
> Helpful advice for doing things better.

> [!IMPORTANT]
> Key information users need to know.

> [!WARNING]
> Urgent info that needs immediate attention.

> [!CAUTION]
> Advises about risks or negative outcomes.
```

> [!NOTE]
> Useful information that users should know.

> [!TIP]
> Helpful advice for doing things better.

> [!IMPORTANT]
> Key information users need to know.

> [!WARNING]
> Urgent info that needs immediate attention.

> [!CAUTION]
> Advises about risks or negative outcomes.

### Footnotes

```markdown
Here is a sentence with a footnote[^1].

[^1]: This is the footnote content.
```

Here is a sentence with a footnote[^1].

[^1]: This is the footnote content.

### Autolinks

URLs and email addresses are automatically linked:

- https://example.com
- contact@example.com

---

## Best Practices

1. **Use descriptive titles** — help users understand what the page covers
2. **Add descriptions** — improve SEO and search results
3. **Link related pages** — help users discover more content
4. **Use code examples** — show, don't just tell
5. **Keep pages focused** — one topic per page
6. **Use nested lists** — organize complex information hierarchically
