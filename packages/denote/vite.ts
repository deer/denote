/**
 * Vite plugins for Denote.
 *
 * @module
 *
 * Provides {@linkcode denoteStyles} and {@linkcode denoteHmr}.
 *
 * - `denoteStyles()` inlines `@import "@denote/core/styles.css"` with the
 *   actual CSS content before `@tailwindcss/vite` processes the file. This
 *   is necessary because `@tailwindcss/vite` resolves CSS `@import`s with its
 *   own resolver that bypasses Vite's `resolveId` plugin chain, and JSR
 *   packages are not installed into `node_modules` so the import would
 *   otherwise fail to resolve.
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
 * Vite plugin that inlines `@import "@denote/core/styles.css"` with the
 * actual pre-compiled CSS before `@tailwindcss/vite` processes the file.
 *
 * `@tailwindcss/vite` resolves CSS `@import`s with its own resolver that
 * bypasses Vite's `resolveId` plugin chain, so a virtual module would never
 * get reached for CSS imports. JSR packages aren't installed into
 * `node_modules`, so the import would otherwise fail to resolve.
 *
 * The framework's `styles.css` is already fully compiled (design tokens,
 * markdown overrides, and a pre-compiled block of Tailwind utilities for
 * every class used by framework components). No scanning of the framework
 * source happens at consumer build time.
 *
 * Must be listed before `tailwindcss()` in the plugins array.
 */
export function denoteStyles(): import("vite").Plugin {
  return {
    name: "denote-styles",
    enforce: "pre",

    async transform(code: string, id: string) {
      if (!id.endsWith(".css")) return;
      if (!code.includes('@import "@denote/core/styles.css"')) return;
      const styles = await loadStyles();
      return code.replace('@import "@denote/core/styles.css"', styles);
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
