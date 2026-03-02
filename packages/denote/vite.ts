/**
 * Vite plugin for Denote config hot-reloading.
 *
 * @module
 *
 * Provides {@linkcode denoteHmr}, a Vite plugin that watches
 * `denote.config.ts` and hot-reloads it without restarting the dev server.
 *
 * @example
 * ```ts
 * // vite.config.ts
 * import { defineConfig } from "vite";
 * import { fresh } from "@fresh/plugin-vite";
 * import tailwindcss from "@tailwindcss/vite";
 * import { denoteHmr } from "@denote/core/vite";
 * import { islandSpecifiers } from "@denote/core";
 *
 * export default defineConfig({
 *   plugins: [
 *     denoteHmr(),
 *     fresh({ serverEntry: "main.ts", clientEntry: "client.ts", islandSpecifiers }),
 *     tailwindcss(),
 *   ],
 * });
 * ```
 */

import { setConfig } from "./lib/config.ts";

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
            console.log("  [denote] Config reloaded");
            server.hot.send({ type: "full-reload" });
          } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            console.error(
              `  [denote] Config reload error: ${msg}\n  Check denote.config.ts for syntax errors. The previous config is still active.`,
            );
          }
        }
      });
    },
  };
}
