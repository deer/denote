/**
 * Denote Documentation Site Configuration
 *
 * Themed to match denote.cloud — warm parchment palette with
 * Newsreader (headings) + Source Sans 3 (body), dark mode support.
 */
import type { DenoteConfig } from "@denote/core";

export const config: DenoteConfig = {
  name: "Denote",
  logo: {
    text: "denote",
    suffix: ".sh",
  },
  favicon: "/favicon.svg",
  // ── Demo theme: uncomment to test config-driven theming ──────────
  // Warm earthy light mode + deep teal dark mode.
  // If theming works correctly, EVERY surface/text/border should change.
  // colors: {
  //   primary: "#b45309",       // amber-700
  //   accent: "#059669",        // emerald-600
  //   background: "#fef3c7",    // warm cream
  //   surface: "#fde68a",       // amber-200
  //   text: "#451a03",          // amber-950
  //   border: "#d97706",        // amber-500
  //   dark: {
  //     primary: "#f59e0b",     // amber-400
  //     accent: "#34d399",      // emerald-400
  //     background: "#042f2e",  // teal-950
  //     surface: "#0f766e",     // teal-700
  //     text: "#ccfbf1",        // teal-100
  //     border: "#115e59",      // teal-800
  //   },
  // },
  colors: {
    primary: "#2d5016", // forest green
    accent: "#b8860b", // dark goldenrod
    background: "#faf6f1", // parchment
    surface: "#f0ebe4", // warm linen
    text: "#2c2c2c", // charcoal
    border: "#d4cec6", // warm gray
    dark: {
      primary: "#4a9e6a", // forest green, readable on dark
      accent: "#e9b84e", // warm gold
      background: "#0d1117", // deep dark
      surface: "#1c2333", // visible separation from bg
      text: "#e6edf3", // soft white
      border: "#30363d", // clear borders
    },
  },
  fonts: {
    heading: '"Newsreader", Georgia, serif',
    body: '"Source Sans 3", system-ui, sans-serif',
    imports: ["/fonts.css"],
  },
  style: {
    darkMode: "auto",
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
    chatbot: false,
    mcp: true,
  },
  ga4: true,
  editUrl: "https://github.com/deer/denote/edit/main/docs/content/docs",
};
