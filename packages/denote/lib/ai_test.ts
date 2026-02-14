import "./test_config.ts"; // side-effect: sets up config for tests
import { assertEquals, assertStringIncludes } from "jsr:@std/assert@1";
import { generateFullDocs, generateLlmsTxt, getDocsJson } from "./ai.ts";
import { getConfig, setConfig } from "./config.ts";

Deno.test("generateLlmsTxt - includes doc links", async () => {
  const txt = await generateLlmsTxt("http://localhost:8000");
  assertEquals(txt.includes("# Denote"), true);
  assertEquals(txt.includes("introduction"), true);
  assertEquals(txt.includes("llms-full.txt"), true);
});

Deno.test("generateFullDocs - includes all content", async () => {
  const txt = await generateFullDocs();
  assertEquals(txt.includes("Complete Documentation"), true);
  assertEquals(txt.includes("Introduction"), true);
  assertEquals(txt.includes("Installation"), true);
});

Deno.test("getDocsJson - returns structured data", async () => {
  const json = await getDocsJson() as { name: string; pages: unknown[] };
  assertEquals(json.name, "Denote");
  assertEquals(json.pages.length > 0, true);
});

Deno.test("generateLlmsTxt - includes MCP section when enabled", async () => {
  const original = getConfig();
  setConfig({ ...original, ai: { mcp: true } });
  try {
    const txt = await generateLlmsTxt("http://localhost:8000");
    assertStringIncludes(txt, "## MCP");
    assertStringIncludes(txt, "http://localhost:8000/mcp");
    assertStringIncludes(txt, "search_docs");
  } finally {
    setConfig(original);
  }
});

Deno.test("generateLlmsTxt - omits MCP section when disabled", async () => {
  const original = getConfig();
  setConfig({ ...original, ai: undefined });
  try {
    const txt = await generateLlmsTxt("http://localhost:8000");
    assertEquals(txt.includes("## MCP"), false);
  } finally {
    setConfig(original);
  }
});
