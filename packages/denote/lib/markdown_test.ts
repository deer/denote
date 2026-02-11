/**
 * Markdown parsing tests
 *
 * Tests for frontmatter parsing and @deer/gfm rendering via renderDoc.
 */
import { assertEquals } from "jsr:@std/assert@1";
import { parseFrontmatter, renderDoc } from "./markdown.ts";

// ---------------------------------------------------------------------------
// parseFrontmatter tests
// ---------------------------------------------------------------------------

Deno.test("parseFrontmatter - valid YAML", () => {
  const raw = `---
title: Test Page
description: A test
---

# Hello`;

  const result = parseFrontmatter(raw);
  assertEquals(result.frontmatter.title, "Test Page");
  assertEquals(result.frontmatter.description, "A test");
  assertEquals(result.content.trim(), "# Hello");
});

Deno.test("parseFrontmatter - no frontmatter", () => {
  const raw = "# Just a heading\n\nSome content.";
  const result = parseFrontmatter(raw);
  assertEquals(result.frontmatter.title, "Untitled");
  assertEquals(result.content, raw);
});

Deno.test("parseFrontmatter - ai fields", () => {
  const raw = `---
title: AI Page
ai-summary: A brief summary for LLMs
ai-keywords:
  - keyword1
  - keyword2
---

Content here.`;

  const result = parseFrontmatter(raw);
  assertEquals(result.frontmatter.title, "AI Page");
  assertEquals(result.frontmatter["ai-summary"], "A brief summary for LLMs");
  assertEquals(result.frontmatter["ai-keywords"], ["keyword1", "keyword2"]);
});

// ---------------------------------------------------------------------------
// renderDoc tests (@deer/gfm output format)
// ---------------------------------------------------------------------------

Deno.test("renderDoc - headings have ids", async () => {
  const { html } = await renderDoc("## Hello World");
  assertEquals(html.includes('id="hello-world"'), true);
  assertEquals(html.includes("<h2"), true);
});

Deno.test("renderDoc - extracts toc", async () => {
  const md = "## Heading 2\n\n### Heading 3\n\n## Another H2\n";
  const { toc } = await renderDoc(md);
  assertEquals(toc.length, 3);
  assertEquals(toc[0], { id: "heading-2", title: "Heading 2", level: 2 });
  assertEquals(toc[1], { id: "heading-3", title: "Heading 3", level: 3 });
  assertEquals(toc[2], { id: "another-h2", title: "Another H2", level: 2 });
});

Deno.test("renderDoc - code blocks with syntax highlighting", async () => {
  const { html } = await renderDoc("```typescript\nconst x = 1;\n```");
  assertEquals(html.includes("language-typescript"), true);
  assertEquals(html.includes("<pre>"), true);
  assertEquals(html.includes("const"), true);
});

Deno.test("renderDoc - inline code", async () => {
  const { html } = await renderDoc("Use `deno run` to start");
  assertEquals(html.includes("<code>"), true);
  assertEquals(html.includes("deno run"), true);
});

Deno.test("renderDoc - links", async () => {
  const { html } = await renderDoc("[click here](https://example.com)");
  assertEquals(html.includes('href="https://example.com"'), true);
  assertEquals(html.includes("click here"), true);
});

Deno.test("renderDoc - tables", async () => {
  const md = `| Name | Status |
|------|--------|
| Foo | ✅ |
| Bar | ❌ |`;
  const { html } = await renderDoc(md);
  assertEquals(html.includes("<table"), true);
  assertEquals(html.includes("<thead>"), true);
  assertEquals(html.includes("<tbody>"), true);
  assertEquals(html.includes("Foo"), true);
  assertEquals(html.includes("Bar"), true);
});

Deno.test("renderDoc - images", async () => {
  const { html } = await renderDoc("![Alt text](/images/screenshot.png)");
  assertEquals(html.includes('<img src="/images/screenshot.png"'), true);
  assertEquals(html.includes('alt="Alt text"'), true);
});

Deno.test("renderDoc - unordered lists", async () => {
  const { html } = await renderDoc("- Item 1\n- Item 2\n- Item 3");
  assertEquals(html.includes("<ul>"), true);
  assertEquals(html.includes("<li>Item 1</li>"), true);
  assertEquals(html.includes("<li>Item 2</li>"), true);
});

Deno.test("renderDoc - ordered lists", async () => {
  const { html } = await renderDoc("1. First\n2. Second\n3. Third");
  assertEquals(html.includes("<ol>"), true);
  assertEquals(html.includes("<li>First</li>"), true);
  assertEquals(html.includes("<li>Second</li>"), true);
});

Deno.test("renderDoc - bold and italic", async () => {
  const { html } = await renderDoc("**bold** and *italic*");
  assertEquals(html.includes("<strong>bold</strong>"), true);
  assertEquals(html.includes("<em>italic</em>"), true);
});

Deno.test("renderDoc - strikethrough", async () => {
  const { html } = await renderDoc("~~deleted text~~");
  assertEquals(html.includes("<del>deleted text</del>"), true);
});

Deno.test("renderDoc - blockquotes", async () => {
  const { html } = await renderDoc("> This is a quote");
  assertEquals(html.includes("<blockquote>"), true);
  assertEquals(html.includes("This is a quote"), true);
});

Deno.test("renderDoc - task lists", async () => {
  const { html } = await renderDoc("- [x] Done\n- [ ] Todo");
  assertEquals(html.includes("Done"), true);
  assertEquals(html.includes("Todo"), true);
  assertEquals(html.includes('type="checkbox"'), true);
});

Deno.test("renderDoc - nested lists", async () => {
  const md = "- Parent\n  - Child 1\n  - Child 2";
  const { html } = await renderDoc(md);
  assertEquals(html.includes("Parent"), true);
  assertEquals(html.includes("Child 1"), true);
  assertEquals((html.match(/<ul>/g) || []).length >= 1, true);
});
