import "../docs.config.ts"; // side-effect: registers default config
import { setContentDir } from "./config.ts";
import { dirname, fromFileUrl, join } from "@std/path";
import { assertEquals } from "jsr:@std/assert@1";
import { handleChat } from "./chat.ts";

// Set content directory to docs/content/docs in monorepo
const __dirname = dirname(fromFileUrl(import.meta.url));
setContentDir(join(__dirname, "..", "..", "..", "docs", "content", "docs"));

Deno.test("handleChat - search mode returns results for known topic", async () => {
  const result = await handleChat({
    messages: [{ role: "user", content: "How do I install Denote?" }],
  });
  assertEquals(result.mode, "search");
  assertEquals(result.message.role, "assistant");
  assertEquals(result.sources !== undefined, true);
  assertEquals(result.sources!.length > 0, true);
});

Deno.test("handleChat - search mode handles no results gracefully", async () => {
  const result = await handleChat({
    messages: [{
      role: "user",
      content: "xyzzy quantum flux capacitor nonsense",
    }],
  });
  assertEquals(result.mode, "search");
  assertEquals(result.message.role, "assistant");
});

Deno.test("handleChat - returns sources with title and slug", async () => {
  const result = await handleChat({
    messages: [{ role: "user", content: "AI features" }],
  });
  if (result.sources && result.sources.length > 0) {
    const source = result.sources[0];
    assertEquals(typeof source.title, "string");
    assertEquals(typeof source.slug, "string");
  }
});
