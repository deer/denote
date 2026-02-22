import { testContext } from "./test_config.ts";
import { assertEquals, assertStringIncludes } from "jsr:@std/assert@1";
import { generateFullDocs, generateLlmsTxt, getDocsJson } from "./ai.ts";

Deno.test("generateLlmsTxt - includes doc links", async () => {
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
  const json = await getDocsJson(testContext) as {
    name: string;
    pages: unknown[];
  };
  assertEquals(json.name, "Denote");
  assertEquals(json.pages.length > 0, true);
});

Deno.test("generateLlmsTxt - includes MCP section when enabled", async () => {
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
  const noMcpContext = {
    ...testContext,
    config: { ...testContext.config, ai: undefined },
  };
  const txt = await generateLlmsTxt(noMcpContext, "http://localhost:8000");
  assertEquals(txt.includes("## MCP"), false);
});
