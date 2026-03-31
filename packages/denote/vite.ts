/**
 * Vite plugins for Denote.
 *
 * @module
 *
 * Provides {@linkcode denoteStyles} and {@linkcode denoteHmr}.
 *
 * - `denoteStyles()` handles two things in CSS files before `@tailwindcss/vite`
 *   processes them: it inlines `@import "@denote/core/styles.css"` with the
 *   actual CSS content, and rewrites `@source "node_modules/@denote/core/"` to
 *   the real package path derived from `import.meta.url`. Both are necessary
 *   because JSR packages are not installed into `node_modules` — `@tailwindcss/vite`
 *   uses its own CSS import resolver that bypasses Vite's plugin `resolveId`
 *   chain, so virtual modules cannot intercept CSS `@import` statements.
 * - `denoteHmr()` watches `denote.config.ts` and hot-reloads it without
 *   restarting the dev server.
 *
 * @example
 * ```ts
 * // vite.config.ts
 * import { defineConfig } from "vite";
 * import { fresh } from "@fresh/plugin-vite";
 * import tailwindcss from "@tailwindcss/vite";
 * import { denoteStyles, denoteHmr } from "@denote/core/vite";
 * import { islandSpecifiers } from "@denote/core";
 *
 * export default defineConfig({
 *   plugins: [
 *     denoteStyles(),
 *     denoteHmr(),
 *     fresh({ serverEntry: "main.ts", clientEntry: "client.ts", islandSpecifiers }),
 *     tailwindcss(),
 *   ],
 * });
 * ```
 */

import { setConfig } from "./lib/config.ts";

const VIRTUAL_STYLES_ID = "\0@denote/core/styles.css";
const stylesUrl = new URL("./styles.css", import.meta.url);
let stylesCache: string | null = null;

async function loadStyles(): Promise<string> {
  if (stylesCache !== null) return stylesCache;
  if (stylesUrl.protocol === "file:") {
    stylesCache = await Deno.readTextFile(stylesUrl);
  } else {
    stylesCache = await (await fetch(stylesUrl.href)).text();
  }
  return stylesCache;
}

/**
 * Vite plugin that pre-processes CSS files before `@tailwindcss/vite` sees them:
 * 1. Inlines `@import "@denote/core/styles.css"` with the actual CSS content.
 *    `@tailwindcss/vite` resolves CSS `@import` with its own resolver that
 *    bypasses Vite's `resolveId` plugin chain, so virtual modules don't work here.
 * 2. Rewrites `@source "node_modules/@denote/core/"` to the actual package
 *    directory derived from `import.meta.url`, so Tailwind can scan the
 *    framework source files for class names. JSR packages are not installed
 *    into `node_modules`, so the path would otherwise resolve to nothing.
 *
 * Must be listed before `tailwindcss()` in the plugins array.
 */
export function denoteStyles(): import("vite").Plugin {
  // Resolve the package directory at plugin-load time.
  // When loaded from JSR, import.meta.url is a file:// URL pointing to the
  // Deno module cache, which is a real directory on disk.
  const packageDir = new URL(".", import.meta.url);

  return {
    name: "denote-styles",
    enforce: "pre",

    resolveId(id: string) {
      if (id === "@denote/core/styles.css") {
        return VIRTUAL_STYLES_ID;
      }
    },

    async load(id: string) {
      if (id === VIRTUAL_STYLES_ID) {
        return await loadStyles();
      }
    },

    // @tailwindcss/vite resolves CSS @import statements with its own resolver
    // (outside Vite's resolveId chain), so the virtual module above won't be
    // reached for CSS @import. Instead we inline the content and rewrite
    // @source here, before @tailwindcss/vite processes the file.
    async transform(code: string, id: string) {
      if (!id.endsWith(".css")) return;

      let result = code;

      if (result.includes('@import "@denote/core/styles.css"')) {
        const styles = await loadStyles();
        result = result.replace('@import "@denote/core/styles.css"', styles);
      }

      if (
        result.includes("node_modules/@denote/core/") &&
        packageDir.protocol === "file:"
      ) {
        result = result.replace(
          /@source "node_modules\/@denote\/core\/"/g,
          `@source "${packageDir.pathname}"`,
        );
      }

      return result !== code ? result : undefined;
    },
  };
}

/**
 * Vite plugin that hot-reloads `denote.config.ts` without restarting
 * the dev server. When the config file changes, it re-imports the module,
 * calls `setConfig` to update the runtime singleton, and triggers
 * a full browser reload.
 */
export function denoteHmr(): import("vite").Plugin {
  return {
    name: "denote-config-hmr",
    configureServer(server) {
      server.watcher.on("change", async (file: string) => {
        if (
          file.endsWith("/denote.config.ts") ||
          file.endsWith("/denote.config.js")
        ) {
          try {
            const mod = await import(`file://${file}?t=${Date.now()}`);
            setConfig(mod.config || mod.default);
            console.log("[denote] Config reloaded");
            server.hot.send({ type: "full-reload" });
          } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            console.error(
              `[denote] Config reload error: ${msg}\n  Check denote.config.ts for syntax errors. The previous config is still active.`,
            );
          }
        }
      });
    },
  };
}
