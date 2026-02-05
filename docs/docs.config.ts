/**
 * Denote Documentation Site Configuration
 */
import type { DocsConfig } from "@denote/core";

export const config: DocsConfig = {
  name: "Denote",
  logo: {
    light: "/logo.svg",
    dark: "/logo-dark.svg",
  },
  favicon: "/favicon.ico",
  colors: {
    primary: "#6366f1",
    accent: "#22c55e",
  },
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
      children: [
        { title: "Deploy Your Site", href: "/docs/deployment" },
      ],
    },
    {
      title: "Customization",
      children: [
        { title: "Theming", href: "/docs/theming" },
        { title: "Styling", href: "/docs/styling" },
      ],
    },
  ],
  topNav: [
    { title: "Documentation", href: "/docs" },
    { title: "GitHub", href: "https://github.com/denote/denote" },
  ],
  footer: {
    copyright: "© 2026 Denote Contributors",
    links: [
      { title: "GitHub", href: "https://github.com/denote/denote" },
    ],
  },
  social: {
    github: "https://github.com/denote/denote",
  },
  search: {
    enabled: true,
  },
  ai: {
    chatbot: true,
  },
};
