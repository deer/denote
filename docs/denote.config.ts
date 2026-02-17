/**
 * Denote Documentation Site Configuration
 *
 * Themed to match denote.cloud — warm parchment palette with
 * Newsreader (headings) + Source Sans 3 (body), light-only mode.
 */
import type { DenoteConfig } from "@denote/core";

export const config: DenoteConfig = {
  name: "Denote",
  logo: {
    light: "/logo.svg",
    dark: "/logo-dark.svg",
  },
  favicon: "/favicon.ico",
  colors: {
    primary: "#2d5016", // forest green
    accent: "#b8860b", // dark goldenrod
    background: "#faf6f1", // parchment
    surface: "#f0ebe4", // warm linen
    text: "#2c2c2c", // charcoal
    border: "#d4cec6", // warm gray
  },
  fonts: {
    heading: '"Newsreader", Georgia, serif',
    body: '"Source Sans 3", system-ui, sans-serif',
    imports: [
      "https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,400;0,700;1,400&display=swap",
      "https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700&display=swap",
    ],
  },
  style: {
    darkMode: "light",
    roundedness: "lg",
  },
  seo: {
    url: "https://denote.sh",
    locale: "en",
    jsonLdType: "WebSite",
    jsonLdExtra: {
      author: { "@type": "Organization", name: "Denote" },
    },
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
        { title: "Theming & Styling", href: "/docs/theming" },
      ],
    },
  ],
  topNav: [
    { title: "Documentation", href: "/docs" },
    { title: "GitHub", href: "https://github.com/deer/denote" },
  ],
  footer: {
    copyright: "\u00A9 2026 Denote Contributors",
    links: [
      { title: "GitHub", href: "https://github.com/deer/denote" },
    ],
  },
  social: {
    github: "https://github.com/deer/denote",
  },
  search: {
    enabled: true,
  },
  ai: {
    chatbot: true,
    mcp: true,
  },
  ga4: true,
  editUrl: "https://github.com/deer/denote/edit/main/docs/content/docs",
};
