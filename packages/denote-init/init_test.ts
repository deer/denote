/**
 * Tests for @denote/init scaffolder
 *
 * Design decisions:
 * - mod.ts keeps inline scaffolding because it's simpler for a single-file
 *   init tool.
 * - We patch the generated deno.json to resolve @denote/core from the local
 *   workspace since it's not published to JSR yet.
 */

import { assert, assertEquals, assertStringIncludes } from "@std/assert";
import { exists } from "@std/fs/exists";
import { join, resolve } from "@std/path";
import { initProject, VERSION } from "./mod.ts";

const REPO_ROOT = resolve(import.meta.dirname!, "../..");
const DENO_BIN = Deno.execPath();
const DENOTE_CORE_DIR = resolve(REPO_ROOT, "packages/denote");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a temp directory with AsyncDisposable cleanup. */
async function useTempDir(prefix: string) {
  const path = await Deno.makeTempDir({ prefix });
  return {
    path,
    [Symbol.asyncDispose]: async () => {
      for (let i = 0; i < 3; i++) {
        try {
          await Deno.remove(path, { recursive: true });
          return;
        } catch {
          // Subprocesses (e.g. esbuild) may still be writing; brief retry
          await new Promise((r) => setTimeout(r, 500));
        }
      }
    },
  };
}

/** Run an async function with console.log suppressed. */
async function withSuppressedConsole<T>(fn: () => Promise<T>): Promise<T> {
  const origLog = console.log;
  console.log = () => {};
  try {
    return await fn();
  } finally {
    console.log = origLog;
  }
}

/** Scaffold a project and patch deno.json for local development. */
async function scaffoldAndPatch(dir: string, name: string) {
  await withSuppressedConsole(() => initProject({ dir, name }));
  await patchDenoJson(dir);
}

/** Assert a file exists in the project directory */
async function expectProjectFile(projectDir: string, path: string) {
  const full = join(projectDir, path);
  assert(await exists(full), `Expected file to exist: ${path}`);
}

/** Assert a directory exists in the project directory */
async function expectProjectDir(projectDir: string, path: string) {
  const full = join(projectDir, path);
  assert(
    await exists(full, { isDirectory: true }),
    `Expected directory to exist: ${path}`,
  );
}

/** Read a file from the project directory */
async function readProjectFile(
  projectDir: string,
  path: string,
): Promise<string> {
  return await Deno.readTextFile(join(projectDir, path));
}

/**
 * Patch the generated project's deno.json to resolve @denote/core
 * against the local workspace package instead of JSR.
 */
async function patchDenoJson(projectDir: string) {
  const denoJsonPath = join(projectDir, "deno.json");
  const config = JSON.parse(await Deno.readTextFile(denoJsonPath));
  // Point imports at the local core package using file:// URLs
  config.imports = config.imports || {};
  const coreUrl = new URL("./", `file://${DENOTE_CORE_DIR}/`).href;
  config.imports["@denote/core"] = coreUrl + "mod.ts";
  config.imports["@denote/core/types"] = coreUrl + "denote.config.ts";
  config.imports["@denote/core/cli"] = new URL("cli.ts", coreUrl).href;
  await Deno.writeTextFile(
    denoJsonPath,
    JSON.stringify(config, null, 2) + "\n",
  );
}

/**
 * Full patch: resolve @denote/core locally AND copy all deps from the core
 * package (fresh, preact, vite, tailwindcss, etc.) plus JSX compilerOptions.
 * Needed for tests that actually start the dev server.
 */
async function patchDenoJsonFull(projectDir: string) {
  const denoJsonPath = join(projectDir, "deno.json");
  const config = JSON.parse(await Deno.readTextFile(denoJsonPath));
  const coreUrl = new URL("./", `file://${DENOTE_CORE_DIR}/`).href;

  config.imports["@denote/core"] = coreUrl + "mod.ts";
  config.imports["@denote/core/types"] = coreUrl + "denote.config.ts";
  config.imports["@denote/core/cli"] = new URL("cli.ts", coreUrl).href;

  // Copy ALL deps from core package (fresh, preact, vite, tailwindcss, etc.)
  const coreDeno = JSON.parse(
    await Deno.readTextFile(join(DENOTE_CORE_DIR, "deno.json")),
  );
  for (const [key, value] of Object.entries(coreDeno.imports)) {
    config.imports[key] ??= value;
  }

  // JSX compiler options (required for Fresh/Preact)
  config.compilerOptions = coreDeno.compilerOptions;
  config.nodeModulesDir = "auto";

  await Deno.writeTextFile(
    denoJsonPath,
    JSON.stringify(config, null, 2) + "\n",
  );
}

/** Find a free port by briefly listening on port 0. */
function getAvailablePort(): number {
  const listener = Deno.listen({ port: 0 });
  const port = (listener.addr as Deno.NetAddr).port;
  listener.close();
  return port;
}

/** Poll an HTTP endpoint until it responds or timeout. */
async function waitForServer(url: string, timeoutMs: number): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const resp = await fetch(url);
      await resp.body?.cancel();
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error(`Server did not respond within ${timeoutMs}ms: ${url}`);
}

/** Run a command in a directory and return the result */
async function runCommand(
  cwd: string,
  cmd: string[],
): Promise<{ code: number; stdout: string; stderr: string }> {
  const command = new Deno.Command(cmd[0], {
    args: cmd.slice(1),
    cwd,
    stdout: "piped",
    stderr: "piped",
  });
  const output = await command.output();
  return {
    code: output.code,
    stdout: new TextDecoder().decode(output.stdout),
    stderr: new TextDecoder().decode(output.stderr),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

Deno.test("--version flag", async () => {
  const result = await runCommand(import.meta.dirname!, [
    DENO_BIN,
    "run",
    "-A",
    "mod.ts",
    "--version",
  ]);
  assert(
    result.stdout.includes(VERSION),
    `Expected version ${VERSION} in output`,
  );
});

Deno.test("--help flag", async () => {
  const result = await runCommand(import.meta.dirname!, [
    DENO_BIN,
    "run",
    "-A",
    "mod.ts",
    "--help",
  ]);
  assert(result.stdout.includes("Denote"), "Help should mention Denote");
  assert(result.stdout.includes("USAGE"), "Help should include USAGE section");
});

Deno.test("scaffold creates expected files", async () => {
  await using tmp = await useTempDir("denote_init_test_");

  await withSuppressedConsole(() =>
    initProject({ dir: tmp.path, name: "test-project" })
  );

  // Files exist
  await expectProjectFile(tmp.path, "deno.json");
  await expectProjectFile(tmp.path, "denote.config.ts");
  await expectProjectFile(tmp.path, "content/docs/introduction.md");
  await expectProjectFile(tmp.path, "content/docs/installation.md");
  await expectProjectFile(tmp.path, ".gitignore");

  // Directories exist
  await expectProjectDir(tmp.path, "static");

  // deno.json has correct tasks and import
  const denoJson = JSON.parse(await readProjectFile(tmp.path, "deno.json"));
  assertEquals(denoJson.tasks.dev, "deno run -A jsr:@denote/core/cli dev");
  assertEquals(denoJson.tasks.build, "deno run -A jsr:@denote/core/cli build");
  assertEquals(
    denoJson.tasks.validate,
    "deno run -A jsr:@denote/core/cli validate",
  );
  assertEquals(denoJson.tasks.mcp, "deno run -A jsr:@denote/core/cli mcp");
  assert(denoJson.imports["@denote/core"], "Should have @denote/core import");

  // denote.config.ts contains project name
  const config = await readProjectFile(tmp.path, "denote.config.ts");
  assertStringIncludes(config, '"test-project"');

  // .gitignore contains expected entries
  const gitignore = await readProjectFile(tmp.path, ".gitignore");
  assertStringIncludes(gitignore, "_fresh/");
  assertStringIncludes(gitignore, ".DS_Store");

  // introduction.md references project name and has frontmatter
  const intro = await readProjectFile(tmp.path, "content/docs/introduction.md");
  assertStringIncludes(intro, "test-project");
  assertStringIncludes(intro, "denote.config.ts");
  assertStringIncludes(intro, "title: Introduction");

  // installation.md references project name and has frontmatter
  const install = await readProjectFile(
    tmp.path,
    "content/docs/installation.md",
  );
  assertStringIncludes(install, "test-project");
  assertStringIncludes(install, "title: Installation");
});

Deno.test("generated project passes deno fmt --check", async () => {
  await using tmp = await useTempDir("denote_init_fmt_");
  await scaffoldAndPatch(tmp.path, "fmt-test");

  const result = await runCommand(tmp.path, [DENO_BIN, "fmt", "--check"]);
  assertEquals(result.code, 0, `deno fmt failed:\n${result.stderr}`);
});

Deno.test("generated project passes deno lint", async () => {
  await using tmp = await useTempDir("denote_init_lint_");
  await scaffoldAndPatch(tmp.path, "lint-test");

  const result = await runCommand(tmp.path, [DENO_BIN, "lint"]);
  assertEquals(result.code, 0, `deno lint failed:\n${result.stderr}`);
});

Deno.test("generated project passes deno check", async () => {
  await using tmp = await useTempDir("denote_init_check_");
  await withSuppressedConsole(() =>
    initProject({ dir: tmp.path, name: "check-test" })
  );
  await patchDenoJsonFull(tmp.path);

  const result = await runCommand(tmp.path, [
    DENO_BIN,
    "check",
    "denote.config.ts",
  ]);
  assertEquals(result.code, 0, `deno check failed:\n${result.stderr}`);
});

Deno.test("project name propagates to all files", async () => {
  await using tmp = await useTempDir("denote_init_name_");
  await withSuppressedConsole(() =>
    initProject({ dir: tmp.path, name: "my-awesome-docs" })
  );

  const config = await readProjectFile(tmp.path, "denote.config.ts");
  assertStringIncludes(config, '"my-awesome-docs"');

  const intro = await readProjectFile(tmp.path, "content/docs/introduction.md");
  assertStringIncludes(intro, "my-awesome-docs");

  const install = await readProjectFile(
    tmp.path,
    "content/docs/installation.md",
  );
  assertStringIncludes(install, "my-awesome-docs");
});

Deno.test("scaffold into existing directory preserves files", async () => {
  await using tmp = await useTempDir("denote_init_preserve_");

  // Create a pre-existing file
  const readmePath = join(tmp.path, "README.md");
  await Deno.writeTextFile(readmePath, "# Existing README\n");

  await withSuppressedConsole(() =>
    initProject({ dir: tmp.path, name: "preserve-test" })
  );

  // Pre-existing file should still be there
  const readme = await Deno.readTextFile(readmePath);
  assertEquals(readme, "# Existing README\n");

  // Scaffolded files should also exist
  await expectProjectFile(tmp.path, "denote.config.ts");
  await expectProjectFile(tmp.path, "deno.json");
});

Deno.test("CLI no-args scaffolds into cwd", async () => {
  await using tmp = await useTempDir("denote_init_cwd_");

  const result = await runCommand(tmp.path, [
    DENO_BIN,
    "run",
    "-A",
    join(import.meta.dirname!, "mod.ts"),
  ]);

  // Should succeed (exit 0)
  assertEquals(result.code, 0, `CLI failed:\n${result.stderr}`);

  // Should create files in cwd
  await expectProjectFile(tmp.path, "deno.json");
  await expectProjectFile(tmp.path, "denote.config.ts");
  await expectProjectFile(tmp.path, "content/docs/introduction.md");
});

Deno.test("CLI errors on existing non-empty directory", async () => {
  await using tmp = await useTempDir("denote_init_error_");

  // Create a subdirectory with a file in it
  const subDir = join(tmp.path, "my-project");
  await Deno.mkdir(subDir);
  await Deno.writeTextFile(join(subDir, "existing.txt"), "hello");

  const result = await runCommand(tmp.path, [
    DENO_BIN,
    "run",
    "-A",
    join(import.meta.dirname!, "mod.ts"),
    "my-project",
  ]);

  assert(result.code !== 0, "Should exit with non-zero code");
  assertStringIncludes(result.stderr, "already exists");
});

Deno.test({
  name: "dev server serves scaffolded pages",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async () => {
    await using tmp = await useTempDir("denote_init_serve_");
    await withSuppressedConsole(() =>
      initProject({ dir: tmp.path, name: "serve-test" })
    );
    await patchDenoJsonFull(tmp.path);

    const port = getAvailablePort();
    const cliPath = resolve(DENOTE_CORE_DIR, "cli.ts");

    const child = new Deno.Command(DENO_BIN, {
      args: ["run", "-A", cliPath, "dev", "--port", String(port)],
      cwd: tmp.path,
      stdout: "piped",
      stderr: "piped",
    }).spawn();

    try {
      await waitForServer(`http://localhost:${port}`, 60_000);

      // Doc page renders with project name
      const resp = await fetch(`http://localhost:${port}/docs/introduction`);
      assertEquals(resp.status, 200);
      const html = await resp.text();
      assertStringIncludes(html, "serve-test");

      // AI endpoint works
      const llms = await fetch(`http://localhost:${port}/llms.txt`);
      assertEquals(llms.status, 200);
      const llmsText = await llms.text();
      assertStringIncludes(llmsText, "serve-test");
    } finally {
      child.kill();
      await child.status;
    }
  },
});
