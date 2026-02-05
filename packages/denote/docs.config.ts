/**
 * Denote Configuration
 * A Mintlify-like documentation platform built on Fresh v2
 */

export interface NavItem {
  title: string;
  href?: string;
  icon?: string;
  children?: NavItem[];
}

export interface DocsConfig {
  name: string;
  logo?: {
    light?: string;
    dark?: string;
  };
  favicon?: string;
  colors?: {
    primary: string;
    accent?: string;
  };
  navigation: NavItem[];
  topNav?: {
    title: string;
    href: string;
  }[];
  footer?: {
    links?: { title: string; href: string }[];
    copyright?: string;
  };
  social?: {
    github?: string;
    twitter?: string;
    discord?: string;
  };
  search?: {
    enabled: boolean;
  };
  ai?: {
    /** Enable the "Ask AI" chatbot widget on doc pages */
    chatbot?: boolean;
    /** AI provider for LLM-powered answers (optional — falls back to search) */
    provider?: {
      /** OpenAI-compatible API URL (default: https://api.openai.com/v1/chat/completions) */
      apiUrl?: string;
      /** Model name (default: gpt-4o-mini) */
      model?: string;
      /** API key (or set DENOTE_AI_API_KEY env var) */
      apiKey?: string;
    };
  };
}

/** Re-export config accessors for convenience */
export {
  getConfig,
  getContentDir,
  getDocsBasePath,
  setConfig,
  setContentDir,
  setDocsBasePath,
} from "./lib/config.ts";

// Default configuration - users can override this
export const defaultConfig: DocsConfig = {
  name: "Denote",
  logo: {
    light: "/logo.svg",
    dark: "/logo-dark.svg",
  },
  favicon: "/favicon.ico",
  colors: {
    primary: "#6366f1", // Indigo
    accent: "#22c55e", // Green
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
    { title: "Blog", href: "/blog" },
    { title: "GitHub", href: "https://github.com/<your-org>/denote" },
  ],
  footer: {
    copyright: "© 2026 Denote Contributors",
    links: [
      { title: "Terms", href: "/terms" },
      { title: "Privacy", href: "/privacy" },
    ],
  },
  social: {
    github: "https://github.com/<your-org>/denote",
    twitter: "https://twitter.com/<your-handle>",
    discord: "https://discord.gg/<your-server>",
  },
  search: {
    enabled: true,
  },
  ai: {
    chatbot: true,
  },
};

/**
 * For backward compatibility: modules that import { config } from "docs.config.ts"
 * get the default config. When using denote() from mod.ts, setConfig() overrides it.
 */
import { setConfig } from "./lib/config.ts";
export const config = defaultConfig;
setConfig(defaultConfig);
