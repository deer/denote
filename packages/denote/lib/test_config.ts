/**
 * Shared test configuration for library tests.
 */
import { setConfig, setContentDir } from "./config.ts";
import type { DenoteContext } from "../utils.ts";
import type { DenoteConfig } from "../denote.config.ts";
import { dirname, fromFileUrl, join } from "@std/path";

// Prevent file watcher from starting during tests (avoids resource leaks)
Deno.env.set("DENO_TESTING", "1");

// Set content directory to docs/content/docs in monorepo
const __dirname = dirname(fromFileUrl(import.meta.url));
const testContentDir = join(
  __dirname,
  "..",
  "..",
  "..",
  "docs",
  "content",
  "docs",
);

// Test config object
const testConfig: DenoteConfig = {
  name: "Denote",
  navigation: [
    {
      title: "Getting Started",
      children: [
        { title: "Introduction", href: "/docs/introduction" },
        { title: "Installation", href: "/docs/installation" },
        { title: "Quick Start", href: "/docs/quickstart" },
      ],
    },
    {
      title: "Core Concepts",
      children: [
        { title: "Configuration", href: "/docs/configuration" },
        { title: "Writing Content", href: "/docs/content" },
        { title: "Components", href: "/docs/components" },
      ],
    },
    {
      title: "AI & API",
      children: [
        { title: "AI Native", href: "/docs/ai-native" },
        { title: "API Reference", href: "/docs/api" },
      ],
    },
    {
      title: "Deployment",
      children: [{ title: "Deploy Your Site", href: "/docs/deployment" }],
    },
    {
      title: "Customization",
      children: [
        { title: "Theming", href: "/docs/theming" },
        { title: "Styling", href: "/docs/styling" },
      ],
    },
  ],
};

// Set singletons (still needed by setConfig validation tests)
setContentDir(testContentDir);
setConfig(testConfig);

/** Shared test context for context-based APIs */
export const testContext: DenoteContext = {
  config: testConfig,
  contentDir: testContentDir,
  docsBasePath: "/docs",
};
