import { testContext } from "./test_config.ts";
import {
  assert,
  assertEquals,
  assertNotEquals,
  assertStringIncludes,
} from "jsr:@std/assert@1";
import {
  buildMiniSearchJSON,
  buildSearchIndex,
  clearAllCaches,
  clearSearchIndexCache,
  getAllDocs,
  getBreadcrumbs,
  getDoc,
  getMiniSearchWithItems,
  getPrevNext,
  getRenderedDoc,
  onContentInvalidated,
  stopWatcher,
  stripMarkdown,
} from "./docs.ts";

Deno.test("getDoc - returns introduction page", async () => {
  const doc = await getDoc("introduction", testContext);
  assertNotEquals(doc, null);
  assertEquals(doc!.frontmatter.title, "Fixture Introduction");
  assertEquals(doc!.slug, "introduction");
});

Deno.test("getDoc - returns null for missing page", async () => {
  const doc = await getDoc("nonexistent-page-that-doesnt-exist", testContext);
  assertEquals(doc, null);
});

Deno.test("getDoc - rejects path traversal with ../", async () => {
  const doc = await getDoc("../../etc/passwd", testContext);
  assertEquals(doc, null);
});

Deno.test("getDoc - rejects nested path traversal", async () => {
  const doc = await getDoc("foo/../../etc/passwd", testContext);
  assertEquals(doc, null);
});

// ---------------------------------------------------------------------------
// getRenderedDoc
// ---------------------------------------------------------------------------

Deno.test("getRenderedDoc - returns rendered HTML and TOC for existing page", async () => {
  const result = await getRenderedDoc("introduction", testContext);
  assertNotEquals(result, null);
  assertEquals(result!.doc.slug, "introduction");
  assert(result!.html.includes("<"), "Expected HTML output");
  assert(Array.isArray(result!.toc));
});

Deno.test("getRenderedDoc - returns null for missing page", async () => {
  const result = await getRenderedDoc("nonexistent-page-xyz", testContext);
  assertEquals(result, null);
});

Deno.test("getRenderedDoc - cache hit returns same reference", async () => {
  const first = await getRenderedDoc("introduction", testContext);
  const second = await getRenderedDoc("introduction", testContext);
  assertEquals(first === second, true);
});

Deno.test("getAllDocs - returns all doc pages", async () => {
  const docs = await getAllDocs(testContext);
  assertEquals(docs.length > 0, true);

  const slugs = docs.map((d) => d.slug);
  assertEquals(slugs.includes("introduction"), true);
  assertEquals(slugs.includes("installation"), true);
});

Deno.test("getPrevNext - returns neighbors for middle page", () => {
  const { prev, next } = getPrevNext("/docs/installation", testContext);
  assertNotEquals(prev, null);
  assertEquals(prev!.title, "Introduction");
  assertNotEquals(next, null);
  assertEquals(next!.title, "Quick Start");
});

Deno.test("getPrevNext - last nav page has no next", () => {
  const { prev, next } = getPrevNext("/docs/styling", testContext);
  assertNotEquals(prev, null);
  assertEquals(next, null);
});

Deno.test("getPrevNext - first page has no prev", () => {
  const { prev, next } = getPrevNext("/docs/introduction", testContext);
  assertEquals(prev, null);
  assertNotEquals(next, null);
});

Deno.test("getPrevNext - unknown path returns nulls", () => {
  const { prev, next } = getPrevNext("/docs/nonexistent", testContext);
  assertEquals(prev, null);
  assertEquals(next, null);
});

Deno.test("getBreadcrumbs - returns section and page", () => {
  const crumbs = getBreadcrumbs("/docs/installation", testContext);
  assertEquals(crumbs.length, 2);
  assertEquals(crumbs[0].title, "Getting Started");
  assertEquals(crumbs[0].href, undefined);
  assertEquals(crumbs[1].title, "Installation");
  assertEquals(crumbs[1].href, "/docs/installation");
});

Deno.test("getBreadcrumbs - unknown path returns empty", () => {
  const crumbs = getBreadcrumbs("/docs/nonexistent", testContext);
  assertEquals(crumbs.length, 0);
});

Deno.test("buildSearchIndex - returns indexed items", async () => {
  clearSearchIndexCache();
  const index = await buildSearchIndex(testContext);
  assertEquals(index.length > 0, true);
  assertEquals(typeof index[0].title, "string");
  assertEquals(typeof index[0].slug, "string");
  assertEquals(typeof index[0].content, "string");
});

Deno.test("buildSearchIndex - returns cached result on second call", async () => {
  clearSearchIndexCache();
  const first = await buildSearchIndex(testContext);
  const second = await buildSearchIndex(testContext);
  // Should be the exact same object reference (cached)
  assertEquals(first === second, true);
});

Deno.test("buildMiniSearchJSON - returns valid JSON string", async () => {
  clearSearchIndexCache();
  const json = await buildMiniSearchJSON(testContext);
  assert(typeof json === "string");
  const parsed = JSON.parse(json);
  assert(typeof parsed === "object" && !Array.isArray(parsed));
});

Deno.test("buildMiniSearchJSON - returns cached result on second call", async () => {
  clearSearchIndexCache();
  const first = await buildMiniSearchJSON(testContext);
  const second = await buildMiniSearchJSON(testContext);
  assertEquals(first === second, true);
});

// ---------------------------------------------------------------------------
// stripMarkdown
// ---------------------------------------------------------------------------

Deno.test("stripMarkdown - strips headings", () => {
  assertEquals(stripMarkdown("## Hello world"), "Hello world");
  assertEquals(stripMarkdown("# H1\n## H2\n### H3"), "H1\nH2\nH3");
});

Deno.test("stripMarkdown - strips bold and italic", () => {
  assertEquals(stripMarkdown("**bold**"), "bold");
  assertEquals(stripMarkdown("__bold__"), "bold");
  assertEquals(stripMarkdown("*italic*"), "italic");
  assertEquals(stripMarkdown("_italic_"), "italic");
  assertEquals(stripMarkdown("***both***"), "both");
});

Deno.test("stripMarkdown - strips links, keeps text", () => {
  assertEquals(
    stripMarkdown("[click here](https://example.com)"),
    "click here",
  );
});

Deno.test("stripMarkdown - strips images, keeps alt", () => {
  assertEquals(stripMarkdown("![alt text](image.png)"), "alt text");
});

Deno.test("stripMarkdown - strips inline code backticks", () => {
  assertEquals(stripMarkdown("use `deno run`"), "use deno run");
});

Deno.test("stripMarkdown - strips fenced code block markers", () => {
  const input = "```ts\nconst x = 1;\n```";
  const result = stripMarkdown(input);
  assert(!result.includes("```"));
  assertStringIncludes(result, "const x = 1;");
});

Deno.test("stripMarkdown - strips horizontal rules", () => {
  assertEquals(stripMarkdown("above\n---\nbelow"), "above\n\nbelow");
});

Deno.test("stripMarkdown - strips HTML tags", () => {
  assertEquals(stripMarkdown("<div>content</div>"), "content");
});

Deno.test("stripMarkdown - collapses excessive newlines", () => {
  const result = stripMarkdown("a\n\n\n\n\nb");
  assertEquals(result, "a\n\nb");
});

// ---------------------------------------------------------------------------
// Search index strips markdown
// ---------------------------------------------------------------------------

Deno.test("buildSearchIndex - content has markdown stripped", async () => {
  clearSearchIndexCache();
  const items = await buildSearchIndex(testContext);
  for (const item of items) {
    assertEquals(
      item.content.includes("##"),
      false,
      `"##" found in ${item.slug}`,
    );
  }
  clearSearchIndexCache();
});

// ---------------------------------------------------------------------------
// Promise dedup: concurrent calls share one build
// ---------------------------------------------------------------------------

Deno.test("getAllDocs - concurrent calls return same result", async () => {
  clearSearchIndexCache();
  const [a, b, c] = await Promise.all([
    getAllDocs(testContext),
    getAllDocs(testContext),
    getAllDocs(testContext),
  ]);
  assertEquals(a, b);
  assertEquals(b, c);
});

Deno.test("buildSearchIndex - concurrent calls return same reference", async () => {
  clearSearchIndexCache();
  const [a, b] = await Promise.all([
    buildSearchIndex(testContext),
    buildSearchIndex(testContext),
  ]);
  assertEquals(a === b, true);
  clearSearchIndexCache();
});

// ---------------------------------------------------------------------------
// onContentInvalidated / clearAllCaches
// ---------------------------------------------------------------------------

Deno.test("onContentInvalidated - callback fires on clearAllCaches", async () => {
  // Ensure doc cache is populated first
  await getAllDocs(testContext);
  let called = false;
  onContentInvalidated(() => {
    called = true;
  });
  clearAllCaches();
  assertEquals(called, true);
});

// ---------------------------------------------------------------------------
// getMiniSearchWithItems
// ---------------------------------------------------------------------------

Deno.test("getMiniSearchWithItems - returns ms and items with correct shape", async () => {
  clearSearchIndexCache();
  const { ms, items } = await getMiniSearchWithItems(testContext);
  assert(typeof ms.search === "function", "ms should have a search method");
  assert(items.length > 0, "items should be non-empty");
  assertEquals(typeof items[0].title, "string");
  assertEquals(typeof items[0].slug, "string");
  clearSearchIndexCache();
});

// ---------------------------------------------------------------------------
// stopWatcher
// ---------------------------------------------------------------------------

Deno.test("stopWatcher - does not throw when no watcher running", () => {
  stopWatcher();
});

// ---------------------------------------------------------------------------
// Nav caching (getPrevNext / getBreadcrumbs)
// ---------------------------------------------------------------------------

Deno.test("getPrevNext - repeated calls return consistent results", () => {
  const first = getPrevNext("/docs/installation", testContext);
  const second = getPrevNext("/docs/installation", testContext);
  assertEquals(first.prev?.href, second.prev?.href);
  assertEquals(first.next?.href, second.next?.href);
});

Deno.test("getBreadcrumbs - repeated calls return cached result", () => {
  const first = getBreadcrumbs("/docs/installation", testContext);
  const second = getBreadcrumbs("/docs/installation", testContext);
  assertEquals(first === second, true);
});

Deno.test("getBreadcrumbs - cache clears on content invalidation", async () => {
  const first = getBreadcrumbs("/docs/installation", testContext);
  // Populate doc cache so clearAllCaches has something to clear
  await getAllDocs(testContext);
  clearAllCaches();
  const second = getBreadcrumbs("/docs/installation", testContext);
  assertEquals(first !== second, true);
  assertEquals(first.length, second.length);
});
