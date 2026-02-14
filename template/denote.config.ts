import type { DocsConfig } from "@denote/core";

export const config: DocsConfig = {
  name: "My Docs",
  colors: {
    primary: "#6366f1",
  },
  navigation: [
    {
      title: "Getting Started",
      children: [
        { title: "Introduction", href: "/docs/introduction" },
        { title: "Installation", href: "/docs/installation" },
      ],
    },
  ],
  topNav: [
    { title: "Documentation", href: "/docs" },
  ],
  footer: {
    copyright: "© 2026 My Docs",
  },
  search: {
    enabled: true,
  },
};
