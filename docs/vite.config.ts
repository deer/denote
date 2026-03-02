import { defineConfig } from "vite";
import { fresh } from "@fresh/plugin-vite";
import tailwindcss from "@tailwindcss/vite";
import { denoteHmr } from "@denote/core/vite.ts";
import { islandSpecifiers } from "@denote/core";

export default defineConfig({
  plugins: [
    denoteHmr(),
    fresh({
      serverEntry: "main.ts",
      clientEntry: "client.ts",
      islandSpecifiers,
    }),
    tailwindcss(),
  ],
  server: {
    port: 8000,
  },
});
