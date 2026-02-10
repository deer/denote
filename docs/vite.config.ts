import { defineConfig } from "vite";
import { fresh } from "@fresh/plugin-vite";
import tailwindcss from "@tailwindcss/vite";
import { islandSpecifiers } from "@denote/core";

export default defineConfig({
  plugins: [
    fresh({ islandSpecifiers }),
    tailwindcss(),
  ],
  server: {
    port: 8000,
    host: true,
  },
  ssr: {
    // Externalize CJS deps that break under Vite's SSR module runner.
    // node-emoji / emojilib have CJS-to-ESM interop issues that cause
    // "Cannot read properties of undefined (reading 'replace')" at startup.
    external: ["node-emoji", "emojilib", "remark-emoji"],
  },
});
