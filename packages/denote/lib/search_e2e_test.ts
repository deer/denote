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
import { deadline as withDeadline } from "jsr:@std/async@1/deadline";
import { dirname, fromFileUrl, join } from "@std/path";

const __dirname = dirname(fromFileUrl(import.meta.url));
const docsDir = join(__dirname, "..", "..", "..", "docs");
const serverEntry = join(docsDir, "_fresh", "server.js");

/** Wait for a condition, polling via page.evaluate. No leaked timers. */
async function waitFor(
  page: Awaited<ReturnType<Awaited<ReturnType<typeof launch>>["newPage"]>>,
  fn: () => boolean,
  timeout = 5000,
): Promise<void> {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    const result = await page.evaluate(fn);
    if (result) return;
    await page.evaluate(() =>
      new Promise((r) => requestAnimationFrame(() => r(undefined)))
    );
  }
  throw new Error("waitFor timed out");
}

Deno.test("search e2e", async (t) => {
  // Skip gracefully when the docs site hasn't been built
  try {
    await Deno.stat(serverEntry);
  } catch {
    console.warn(
      "⚠ Skipping search e2e: docs site not built. Run `deno task build` first.",
    );
    return;
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
  try {
    while (true) {
      const { value, done } = await withDeadline(reader.read(), 30_000);
      if (done) break;
      const text = decoder.decode(value);
      const match = text.match(/Listening on http:\/\/[^:]+:(\d+)/);
      if (match) {
        BASE = `http://localhost:${match[1]}`;
        break;
      }
    }
  } finally {
    reader.releaseLock();
  }

  if (!BASE) throw new Error("Failed to detect server port");

  const browser = await launch({
    args: (Deno.env.get("CI") && Deno.build.os === "linux")
      ? ["--no-sandbox"]
      : [],
  });

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
      await waitFor(page, () => {
        const el = document.querySelector(".py-8.text-center");
        return !el?.textContent?.includes("Loading");
      });

      await page.keyboard.type("introduction");

      await waitFor(
        page,
        () => document.querySelectorAll("a[href^='/docs/']").length > 0,
      );

      const resultCount = await page.evaluate(() =>
        document.querySelectorAll("a[href^='/docs/']").length
      );
      assert(resultCount > 0, `Expected results, got ${resultCount}`);
    });

    // ── 3. Fuzzy matching ───────────────────────────────────
    await t.step("fuzzy: 'instalation' finds Installation", async () => {
      await page.keyboard.down("Control");
      await page.keyboard.press("a");
      await page.keyboard.up("Control");
      await page.keyboard.type("instalation"); // one L

      await waitFor(
        page,
        () =>
          document.querySelectorAll("a[href^='/docs/'] .font-medium").length >
            0,
      );

      const titles: string[] = await page.evaluate(() =>
        Array.from(
          document.querySelectorAll("a[href^='/docs/'] .font-medium"),
        )
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

      await waitFor(
        page,
        () =>
          document.querySelectorAll("a[href^='/docs/'] .font-medium").length >
            0,
      );

      const titles: string[] = await page.evaluate(() =>
        Array.from(
          document.querySelectorAll("a[href^='/docs/'] .font-medium"),
        )
          .map((el) => el.textContent ?? "")
      );
      assert(titles.length > 0, "No prefix results");
      const found = titles.some((t) => t.toLowerCase().includes("config"));
      assert(found, `Prefix didn't match: ${JSON.stringify(titles)}`);
    });

    // ── 5. Cached on reopen (no loading state) ──────────────
    await t.step("reopen shows results instantly (cached)", async () => {
      await page.keyboard.press("Escape");

      // Wait for modal to close
      await waitFor(
        page,
        () =>
          !document.querySelector(
            "input[placeholder='Search documentation...']",
          ),
      );

      // Reopen — should skip loading state entirely
      await page.keyboard.down("Control");
      await page.keyboard.press("k");
      await page.keyboard.up("Control");
      await page.waitForSelector(
        "input[placeholder='Search documentation...']",
      );

      await page.keyboard.type("install");

      await waitFor(
        page,
        () => document.querySelectorAll("a[href^='/docs/']").length > 0,
      );

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
