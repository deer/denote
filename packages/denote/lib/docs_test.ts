import { testContext } from "./test_config.ts";
import { assertEquals, assertNotEquals } from "jsr:@std/assert@1";
import {
  buildSearchIndex,
  clearSearchIndexCache,
  getAllDocs,
  getBreadcrumbs,
  getDoc,
  getPrevNext,
} from "./docs.ts";

Deno.test("getDoc - returns introduction page", async () => {
  const doc = await getDoc("introduction", testContext);
  assertNotEquals(doc, null);
  assertEquals(doc!.frontmatter.title, "Introduction");
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
