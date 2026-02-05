/**
 * Denote Documentation Site
 *
 * This is the official Denote docs site, built with Denote itself.
 * It serves as both documentation and a real-world example of a standalone Denote project.
 */
import { denote } from "@denote/core";
import { config } from "./docs.config.ts";
import { dirname, fromFileUrl, join } from "@std/path";

// Resolve content directory relative to this file, not the library
const __dirname = dirname(fromFileUrl(import.meta.url));
const contentDir = join(__dirname, "content", "docs");

export const app = denote({
  config,
  contentDir,
});
