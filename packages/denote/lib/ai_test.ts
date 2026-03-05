import { testContext } from "./test_config.ts";
import { assertEquals, assertStringIncludes } from "jsr:@std/assert@1";
import { clearAiCache, generateLlmsTxt, getDocsJson } from "./ai.ts";
import { clearFullDocsCache, generateFullDocs } from "./docs.ts";

Deno.test("generateLlmsTxt - includes doc links", async () => {
  clearAiCache();
  const txt = await generateLlmsTxt(testContext, "http://localhost:8000");
  assertEquals(txt.includes("# Denote"), true);
  assertEquals(txt.includes("introduction"), true);
  assertEquals(txt.includes("llms-full.txt"), true);
});

Deno.test("generateFullDocs - includes all content", async () => {
  const txt = await generateFullDocs(testContext);
  assertEquals(txt.includes("Complete Documentation"), true);
  assertEquals(txt.includes("Introduction"), true);
  assertEquals(txt.includes("Installation"), true);
});

Deno.test("getDocsJson - returns structured data", async () => {
  clearAiCache();
  const json = await getDocsJson(testContext) as {
    name: string;
    pages: unknown[];
  };
  assertEquals(json.name, "Denote");
  assertEquals(json.pages.length > 0, true);
});

Deno.test("generateFullDocs - returns cached result on second call", async () => {
  clearFullDocsCache();
  const first = await generateFullDocs(testContext);
  const second = await generateFullDocs(testContext);
  // Exact same reference — served from cache, not regenerated
  assertEquals(first === second, true);
  clearFullDocsCache();
});

Deno.test("generateLlmsTxt - returns cached result on second call", async () => {
  clearAiCache();
  const first = await generateLlmsTxt(testContext, "http://localhost:8000");
  const second = await generateLlmsTxt(testContext, "http://localhost:8000");
  assertEquals(first === second, true);
  clearAiCache();
});

Deno.test("getDocsJson - returns cached result on second call", async () => {
  clearAiCache();
  const first = await getDocsJson(testContext);
  const second = await getDocsJson(testContext);
  assertEquals(first === second, true);
  clearAiCache();
});

Deno.test("generateLlmsTxt - includes MCP section when enabled", async () => {
  clearAiCache();
  const mcpContext = {
    ...testContext,
    config: { ...testContext.config, ai: { mcp: true } },
  };
  const txt = await generateLlmsTxt(mcpContext, "http://localhost:8000");
  assertStringIncludes(txt, "## MCP");
  assertStringIncludes(txt, "http://localhost:8000/mcp");
  assertStringIncludes(txt, "search_docs");
});

Deno.test("generateLlmsTxt - omits MCP section when disabled", async () => {
  clearAiCache();
  const noMcpContext = {
    ...testContext,
    config: { ...testContext.config, ai: undefined },
  };
  const txt = await generateLlmsTxt(noMcpContext, "http://localhost:8000");
  assertEquals(txt.includes("## MCP"), false);
});

Deno.test("clearAiCache - invalidates cached llms.txt", async () => {
  clearAiCache();
  const first = await generateLlmsTxt(testContext, "http://a.com");
  // Change baseUrl — without clearing, cache still holds the old baseUrl result
  clearAiCache();
  const second = await generateLlmsTxt(testContext, "http://b.com");
  // Content differs because baseUrl is embedded in the output
  assertStringIncludes(first, "http://a.com");
  assertStringIncludes(second, "http://b.com");
  clearAiCache();
});

Deno.test("clearAiCache - invalidates cached docsJson", async () => {
  clearAiCache();
  const first = await getDocsJson(testContext);
  clearAiCache();
  const second = await getDocsJson(testContext);
  assertEquals(first === second, false);
  clearAiCache();
});

Deno.test("generateLlmsTxt - concurrent calls return same reference", async () => {
  clearAiCache();
  const [a, b] = await Promise.all([
    generateLlmsTxt(testContext, "http://localhost:8000"),
    generateLlmsTxt(testContext, "http://localhost:8000"),
  ]);
  assertEquals(a === b, true);
  clearAiCache();
});

Deno.test("generateLlmsTxt - uses custom docsBasePath in links", async () => {
  clearAiCache();
  const customContext = { ...testContext, docsBasePath: "/guide" };
  const txt = await generateLlmsTxt(customContext, "http://localhost:8000");
  assertStringIncludes(txt, "http://localhost:8000/guide/introduction");
  assertEquals(txt.includes("/docs/introduction"), false);
  assertEquals(txt.includes("/guide/introduction"), true);
  clearAiCache();
});

Deno.test("getDocsJson - concurrent calls return same reference", async () => {
  clearAiCache();
  const [a, b] = await Promise.all([
    getDocsJson(testContext),
    getDocsJson(testContext),
  ]);
  assertEquals(a === b, true);
  clearAiCache();
});
