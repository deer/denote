import "./test_config.ts"; // side-effect: sets up config for tests
import { assertEquals } from "jsr:@std/assert@1";
import { generateFullDocs, generateLlmsTxt, getDocsJson } from "./ai.ts";

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
