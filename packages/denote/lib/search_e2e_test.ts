/**
 * E2E browser test for MiniSearch search integration.
 *
 * Requires a pre-built docs site (`deno task build` from repo root).
 * Serves the built app, then runs headless Chrome to verify:
 * 1. /api/search returns a serialized MiniSearch index (JSON object)
 * 2. Ctrl+K opens the search modal, typing returns ranked results
 * 3. Fuzzy matching works (misspelled query still matches)
 * 4. Prefix matching works (partial word matches)
 * 5. Cached on reopen (no loading state on second open)
 */
import { launch } from "jsr:@astral/astral@0.5.5";
import { assert, assertEquals } from "jsr:@std/assert@1";
import { dirname, fromFileUrl, join } from "@std/path";

const __dirname = dirname(fromFileUrl(import.meta.url));
const docsDir = join(__dirname, "..", "..", "..", "docs");
const serverEntry = join(docsDir, "_fresh", "server.js");

Deno.test("search e2e", async (t) => {
  // Verify the docs site is built
  try {
    await Deno.stat(serverEntry);
  } catch {
    throw new Error(
      "Docs site not built. Run `deno task build` from the repo root first.",
    );
  }

  // Start the built docs server on a random port
  const serverProcess = new Deno.Command("deno", {
    args: ["serve", "-A", "--port=0", serverEntry],
    cwd: docsDir,
    stdout: "piped",
    stderr: "piped",
  }).spawn();

  // Read the port from stderr ("Listening on http://0.0.0.0:<port>/")
  let BASE = "";
  const decoder = new TextDecoder();
  const reader = serverProcess.stderr.getReader();
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    const { value, done } = await Promise.race([
      reader.read(),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("Timed out waiting for server")),
          30_000,
        )
      ),
    ]);
    if (done) break;
    const text = decoder.decode(value);
    const match = text.match(/Listening on http:\/\/[^:]+:(\d+)/);
    if (match) {
      BASE = `http://localhost:${match[1]}`;
      reader.releaseLock();
      break;
    }
  }

  if (!BASE) throw new Error("Failed to detect server port");

  const browser = await launch();

  try {
    // ── 1. API-level check ──────────────────────────────────
    await t.step("/api/search returns MiniSearch index", async () => {
      const res = await fetch(`${BASE}/api/search`);
      assertEquals(res.status, 200);
      assertEquals(res.headers.get("content-type"), "application/json");
      assert(res.headers.get("cache-control") !== null);
      const json = await res.json();
      assert(typeof json === "object" && !Array.isArray(json));
    });

    const page = await browser.newPage(`${BASE}/docs/introduction`);
    await page.waitForNetworkIdle();

    // ── 2. Ctrl+K opens modal, typing returns results ───────
    await t.step("Ctrl+K opens modal, typing returns results", async () => {
      await page.keyboard.down("Control");
      await page.keyboard.press("k");
      await page.keyboard.up("Control");

      await page.waitForSelector(
        "input[placeholder='Search documentation...']",
      );

      // Wait for index to load (loading state disappears)
      await page.waitForFunction(() => {
        const el = document.querySelector(".py-8.text-center");
        return !el?.textContent?.includes("Loading");
      });

      await page.keyboard.type("introduction");

      await page.waitForFunction(
        () => document.querySelectorAll("a[href^='/docs/']").length > 0,
      );

      const resultCount = await page.evaluate(() =>
        document.querySelectorAll("a[href^='/docs/']").length
      );
      assert(resultCount > 0, `Expected results, got ${resultCount}`);
    });

    // ── 3. Fuzzy matching ───────────────────────────────────
    await t.step("fuzzy: 'instalation' finds Installation", async () => {
      // Select all text in input, then type new query
      await page.keyboard.down("Control");
      await page.keyboard.press("a");
      await page.keyboard.up("Control");
      await page.keyboard.type("instalation"); // one L

      await new Promise((r) => setTimeout(r, 300));

      const titles: string[] = await page.evaluate(() =>
        Array.from(document.querySelectorAll("a[href^='/docs/'] .font-medium"))
          .map((el) => el.textContent ?? "")
      );
      const found = titles.some((t) => t.toLowerCase().includes("install"));
      assert(found, `Fuzzy didn't match: ${JSON.stringify(titles)}`);
    });

    // ── 4. Prefix matching ──────────────────────────────────
    await t.step("prefix: 'conf' finds Configuration", async () => {
      await page.keyboard.down("Control");
      await page.keyboard.press("a");
      await page.keyboard.up("Control");
      await page.keyboard.type("conf");

      await new Promise((r) => setTimeout(r, 300));

      const titles: string[] = await page.evaluate(() =>
        Array.from(document.querySelectorAll("a[href^='/docs/'] .font-medium"))
          .map((el) => el.textContent ?? "")
      );
      assert(titles.length > 0, "No prefix results");
      const found = titles.some((t) => t.toLowerCase().includes("config"));
      assert(found, `Prefix didn't match: ${JSON.stringify(titles)}`);
    });

    // ── 5. Cached on reopen (no loading state) ──────────────
    await t.step("reopen shows results instantly (cached)", async () => {
      await page.keyboard.press("Escape");
      await new Promise((r) => setTimeout(r, 200));

      // Reopen — should skip loading state entirely
      await page.keyboard.down("Control");
      await page.keyboard.press("k");
      await page.keyboard.up("Control");
      await page.waitForSelector(
        "input[placeholder='Search documentation...']",
      );

      await page.keyboard.type("install");
      await new Promise((r) => setTimeout(r, 300));

      const hasLoading = await page.evaluate(() =>
        document.querySelector(".py-8.text-center")?.textContent?.includes(
          "Loading",
        ) ?? false
      );
      assertEquals(hasLoading, false, "Should not show loading on reopen");

      const resultCount = await page.evaluate(() =>
        document.querySelectorAll("a[href^='/docs/']").length
      );
      assert(resultCount > 0, "Should have results immediately");
    });
  } finally {
    await browser.close();
    serverProcess.kill("SIGTERM");
    await serverProcess.stdout.cancel();
    await serverProcess.stderr.cancel();
    await serverProcess.status;
  }
});
