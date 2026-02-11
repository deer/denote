import { defineConfig, type Plugin } from "vite";
import { fresh } from "@fresh/plugin-vite";
import tailwindcss from "@tailwindcss/vite";
import { islandSpecifiers } from "@denote/core";

/**
 * Vite plugin to fix node-emoji CJS-to-ESM interop issue.
 *
 * When Vite bundles emojilib (CJS) for SSR, the module namespace object gets a
 * `default` property pointing to the entire module. node-emoji then iterates
 * `Object.entries(lib)` and tries to destructure `{ char }` from each entry —
 * but the `default` entry is the module object, not an emoji, so `char` is
 * undefined and `.replace()` throws.
 *
 * This plugin patches the bundled output to filter out entries with no `char`.
 */
function fixNodeEmoji(): Plugin {
  return {
    name: "fix-node-emoji",
    generateBundle(_options, bundle) {
      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== "chunk") continue;
        // Patch: filter the emojiData map to skip entries where char is undefined
        chunk.code = chunk.code.replace(
          /var emojiData = Object\.entries\(([\w$]+)\.lib\)\.map\(\(\[name, \{\s*char:\s*emoji\s*\}\]\) => \[name, emoji\]\);/s,
          "var emojiData = Object.entries($1.lib).filter(([, v]) => v && typeof v.char === 'string').map(([name, { char: emoji }]) => [name, emoji]);",
        );
      }
    },
  };
}

export default defineConfig({
  plugins: [
    fresh({ islandSpecifiers }),
    tailwindcss(),
    fixNodeEmoji(),
  ],
  server: {
    port: 8000,
    host: true,
  },
});
