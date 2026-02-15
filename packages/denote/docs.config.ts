/**
 * Denote Configuration Types
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
    background?: string;
    surface?: string;
    text?: string;
    border?: string;
    dark?: {
      primary?: string;
      accent?: string;
      background?: string;
      surface?: string;
      text?: string;
      border?: string;
    };
  };
  fonts?: {
    /** Body text font family. Include fallbacks. */
    body?: string;
    /** Heading font family. Falls back to body if unset. */
    heading?: string;
    /** Monospace font for code blocks. */
    mono?: string;
    /** Google Fonts or other font import URLs (added as <link> tags in <head>) */
    imports?: string[];
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
  layout?: {
    /** Sidebar width in px (default: 256) */
    sidebarWidth?: number;
    /** Max content width in px (default: 768 / max-w-3xl) */
    maxContentWidth?: number;
    /** Header height in px (default: 64) */
    headerHeight?: number;
    /** TOC width in px (default: 256) */
    tocWidth?: number;
    /** Show table of contents sidebar (default: true) */
    toc?: boolean;
    /** Show breadcrumbs (default: true) */
    breadcrumbs?: boolean;
    /** Show footer (default: true) */
    footer?: boolean;
  };
  landing?: {
    /** Set to false to redirect "/" to first doc page */
    enabled?: boolean;
    /** Custom redirect path (default: first nav item with href) */
    redirectTo?: string;
  };
  style?: {
    /** Border radius scale: none=0, sm=0.25rem, md=0.5rem (default), lg=0.75rem, xl=1rem */
    roundedness?: "none" | "sm" | "md" | "lg" | "xl";
    /** Dark mode behavior: auto (system+toggle), light (force light), dark (force dark), toggle (default dark+toggle) */
    darkMode?: "auto" | "light" | "dark" | "toggle";
    /** Path to a custom CSS file relative to the docs directory, loaded after all theme tokens */
    customCss?: string;
  };
  /** Enable GA4 analytics. Set GA4_MEASUREMENT_ID env var to activate. */
  ga4?: boolean;
  ai?: {
    /** Enable the "Ask AI" chatbot widget on doc pages */
    chatbot?: boolean;
    /** Enable MCP (Model Context Protocol) endpoint at /mcp */
    mcp?: boolean;
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

/** Re-export config accessors */
export {
  getConfig,
  getContentDir,
  getDocsBasePath,
  setConfig,
  setContentDir,
  setDocsBasePath,
} from "./lib/config.ts";
