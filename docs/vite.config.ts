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
});
