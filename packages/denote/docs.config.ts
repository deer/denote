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
