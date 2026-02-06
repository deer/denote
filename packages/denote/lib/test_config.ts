/**
 * Shared test configuration for library tests.
 */
import { setConfig, setContentDir } from "./config.ts";
import { dirname, fromFileUrl, join } from "@std/path";

// Set content directory to docs/content/docs in monorepo
const __dirname = dirname(fromFileUrl(import.meta.url));
setContentDir(join(__dirname, "..", "..", "..", "docs", "content", "docs"));

// Set test config
setConfig({
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
});
