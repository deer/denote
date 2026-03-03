#!/usr/bin/env -S deno run -A
/**
 * Standalone validation script for Denote projects.
 *
 * @module
 *
 * Reads `denote.config.ts` from the current directory and validates
 * content, navigation links, and configuration.
 *
 * @example Default paths
 * ```sh
 * deno run -A jsr:@denote/core/validate
 * ```
 *
 * @example Custom content directory and base path
 * ```sh
 * deno run -A jsr:@denote/core/validate --content-dir=./my-content --docs-base-path=/reference
 * ```
 */

import { resolve } from "@std/path";
import { validateAndPrint } from "./lib/validate.ts";
import type { DenoteConfig } from "./denote.config.ts";
import type { DenoteContext } from "./utils.ts";

const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const cyan = (s: string) => `\x1b[36m${s}\x1b[0m`;

async function loadConfig(): Promise<DenoteConfig> {
  const candidates = ["denote.config.ts", "denote.config.js"];
  for (const name of candidates) {
    const absPath = `${Deno.cwd()}/${name}`;
    try {
      await Deno.stat(absPath);
      const mod = await import(new URL(absPath, "file:///").href);
      return mod.config || mod.default;
    } catch (e) {
      if (!(e instanceof Deno.errors.NotFound)) {
        console.error(red(`Error loading ${name}:`), e);
        console.error(
          `  Check for syntax errors in your config file, or re-scaffold with ${
            cyan("deno run -Ar jsr:@denote/init")
          }`,
        );
      }
    }
  }
  console.error(red("Error: No config file found."));
  console.error(`Expected one of: ${candidates.join(", ")}`);
  console.error(
    `Run ${cyan("deno run -Ar jsr:@denote/init")} to create a new project.`,
  );
  Deno.exit(1);
}

function parseArgs(
  args: string[],
): { contentDir: string; docsBasePath: string } {
  let contentDir = "./content/docs";
  let docsBasePath = "/docs";
  for (const arg of args) {
    if (arg.startsWith("--content-dir=")) {
      contentDir = arg.slice("--content-dir=".length);
    } else if (arg.startsWith("--docs-base-path=")) {
      docsBasePath = arg.slice("--docs-base-path=".length);
    }
  }
  return { contentDir, docsBasePath };
}

if (import.meta.main) {
  const config = await loadConfig();
  const { contentDir, docsBasePath } = parseArgs(Deno.args);
  const denoteContext: DenoteContext = {
    config,
    contentDir: resolve(contentDir),
    docsBasePath,
  };
  const errorCount = await validateAndPrint(denoteContext);
  Deno.exit(errorCount > 0 ? 1 : 0);
}
