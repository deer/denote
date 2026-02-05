/**
 * Denote — Standalone entry point
 *
 * This is the default standalone server that uses denote() from mod.ts
 * with the default configuration from docs.config.ts.
 *
 * For embedding Denote into another Fresh app, see mod.ts.
 */
import { dirname, fromFileUrl, join } from "@std/path";
import { config } from "./docs.config.ts";
import { denote } from "./mod.ts";

// In monorepo: content lives in docs/content/docs
// Resolve relative to this file's location
const __dirname = dirname(fromFileUrl(import.meta.url));
const contentDir = join(__dirname, "..", "..", "docs", "content", "docs");

export const app = denote({
  config,
  contentDir,
});
