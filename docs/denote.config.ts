/**
 * Denote Documentation Site Configuration
 */
import type { DenoteConfig } from "@denote/core";

export const config: DenoteConfig = {
  name: "Denote",
  logo: {
    light: "/logo.svg",
    dark: "/logo-dark.svg",
  },
  favicon: "/favicon.ico",
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
    copyright: "© 2026 Denote Contributors",
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
};
