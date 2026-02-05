/**
 * Markdown parsing tests
 *
 * Tests for frontmatter parsing, TOC extraction, and @deno/gfm rendering.
 */
import { assertEquals } from "jsr:@std/assert@1";
import {
  extractToc,
  markdownToHtml,
  parseFrontmatter,
  slugify,
} from "./markdown.ts";

// ---------------------------------------------------------------------------
// slugify tests
// ---------------------------------------------------------------------------

Deno.test("slugify - basic text", () => {
  assertEquals(slugify("Hello World"), "hello-world");
});

Deno.test("slugify - punctuation removed", () => {
  assertEquals(slugify("What's New?"), "whats-new");
});

Deno.test("slugify - special chars", () => {
  assertEquals(slugify("Getting Started!"), "getting-started");
});

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
// extractToc tests
// ---------------------------------------------------------------------------

Deno.test("extractToc - multiple headings", () => {
  const content = `# Heading 1
## Heading 2
### Heading 3
## Another H2`;

  const toc = extractToc(content);
  assertEquals(toc.length, 4);
  assertEquals(toc[0], { id: "heading-1", title: "Heading 1", level: 1 });
  assertEquals(toc[1], { id: "heading-2", title: "Heading 2", level: 2 });
  assertEquals(toc[2], { id: "heading-3", title: "Heading 3", level: 3 });
  assertEquals(toc[3], { id: "another-h2", title: "Another H2", level: 2 });
});

Deno.test("extractToc - empty content", () => {
  const toc = extractToc("Just some text without headings.");
  assertEquals(toc.length, 0);
});

// ---------------------------------------------------------------------------
// markdownToHtml tests (@deno/gfm output format)
// ---------------------------------------------------------------------------

Deno.test("markdownToHtml - headings have ids", () => {
  const html = markdownToHtml("## Hello World");
  assertEquals(html.includes('id="hello-world"'), true);
  assertEquals(html.includes("<h2"), true);
});

Deno.test("markdownToHtml - code blocks with syntax highlighting", () => {
  const html = markdownToHtml("```typescript\nconst x = 1;\n```");
  // @deno/gfm with Prism wraps in highlight div
  assertEquals(html.includes("highlight"), true);
  assertEquals(html.includes("<pre>"), true);
  assertEquals(html.includes("const"), true);
});

Deno.test("markdownToHtml - inline code", () => {
  const html = markdownToHtml("Use `deno run` to start");
  assertEquals(html.includes("<code>"), true);
  assertEquals(html.includes("deno run"), true);
});

Deno.test("markdownToHtml - links", () => {
  const html = markdownToHtml("[click here](https://example.com)");
  assertEquals(html.includes('href="https://example.com"'), true);
  assertEquals(html.includes("click here"), true);
});

Deno.test("markdownToHtml - tables", () => {
  const md = `| Name | Status |
|------|--------|
| Foo | ✅ |
| Bar | ❌ |`;
  const html = markdownToHtml(md);
  assertEquals(html.includes("<table"), true);
  assertEquals(html.includes("<thead>"), true);
  assertEquals(html.includes("<tbody>"), true);
  assertEquals(html.includes("Foo"), true);
  assertEquals(html.includes("Bar"), true);
});

Deno.test("markdownToHtml - images", () => {
  const html = markdownToHtml("![Alt text](/images/screenshot.png)");
  assertEquals(html.includes('<img src="/images/screenshot.png"'), true);
  assertEquals(html.includes('alt="Alt text"'), true);
});

Deno.test("markdownToHtml - unordered lists", () => {
  const html = markdownToHtml("- Item 1\n- Item 2\n- Item 3");
  assertEquals(html.includes("<ul>"), true);
  assertEquals(html.includes("<li>Item 1</li>"), true);
  assertEquals(html.includes("<li>Item 2</li>"), true);
});

Deno.test("markdownToHtml - ordered lists", () => {
  const html = markdownToHtml("1. First\n2. Second\n3. Third");
  assertEquals(html.includes("<ol>"), true);
  assertEquals(html.includes("<li>First</li>"), true);
  assertEquals(html.includes("<li>Second</li>"), true);
});

Deno.test("markdownToHtml - bold and italic", () => {
  const html = markdownToHtml("**bold** and *italic*");
  assertEquals(html.includes("<strong>bold</strong>"), true);
  assertEquals(html.includes("<em>italic</em>"), true);
});

Deno.test("markdownToHtml - strikethrough", () => {
  const html = markdownToHtml("~~deleted text~~");
  assertEquals(html.includes("<del>deleted text</del>"), true);
});

Deno.test("markdownToHtml - blockquotes", () => {
  const html = markdownToHtml("> This is a quote");
  assertEquals(html.includes("<blockquote>"), true);
  assertEquals(html.includes("This is a quote"), true);
});

Deno.test("markdownToHtml - task lists", () => {
  const html = markdownToHtml("- [x] Done\n- [ ] Todo");
  assertEquals(html.includes("Done"), true);
  assertEquals(html.includes("Todo"), true);
  // GFM renders task list checkboxes
  assertEquals(html.includes('type="checkbox"'), true);
});

Deno.test("markdownToHtml - nested lists", () => {
  const md = "- Parent\n  - Child 1\n  - Child 2";
  const html = markdownToHtml(md);
  assertEquals(html.includes("Parent"), true);
  assertEquals(html.includes("Child 1"), true);
  // Should have nested structure
  assertEquals((html.match(/<ul>/g) || []).length >= 1, true);
});
