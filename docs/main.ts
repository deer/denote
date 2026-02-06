/**
 * Denote Documentation Site
 *
 * This is the official Denote docs site, demonstrating how to use
 * @denote/core as a library in a Fresh app.
 */
import { join } from "@std/path";
import { denote } from "@denote/core";
import { config } from "./docs.config.ts";

// Resolve content directory relative to working directory
// This works in both dev (running from docs/) and production (deployed with content alongside)
const contentDir = Deno.env.get("DENOTE_CONTENT_DIR") ||
  join(Deno.cwd(), "content", "docs");

// Create the denote app
// Islands are registered via vite.config.ts islandSpecifiers
export const app = denote({
  config,
  contentDir,
});
