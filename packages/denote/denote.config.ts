/**
 * Denote Configuration Types
 *
 * @module
 *
 * Type definitions for the Denote site configuration. The top-level
 * {@linkcode DenoteConfig} is composed from smaller, concern-specific
 * interfaces so each area (theme, SEO, AI, layout, etc.) can be documented
 * and consumed independently.
 *
 * @example
 * ```ts
 * import type { DenoteConfig } from "@denote/core";
 *
 * export const config: DenoteConfig = {
 *   name: "My Docs",
 *   colors: { primary: "#6366f1" },
 *   navigation: [
 *     { title: "Guide", children: [
 *       { title: "Intro", href: "/docs/intro" },
 *     ]},
 *   ],
 * };
 * ```
 */

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

/** A single item in the sidebar navigation tree. */
export interface NavItem {
  /** Display title for this nav entry. */
  title: string;
  /** URL path to link to (omit for section headers). */
  href?: string;
  /** Optional emoji or icon string shown before the title. */
  icon?: string;
  /** Nested child items (creates a collapsible section). */
  children?: NavItem[];
}

// ---------------------------------------------------------------------------
// Theme: colors, fonts, style
// ---------------------------------------------------------------------------

/** Logo image paths and optional text branding. */
export interface LogoConfig {
  /** Logo image path for light mode. */
  light?: string;
  /** Logo image path for dark mode. */
  dark?: string;
  /** Text to display in header (overrides config.name for the logo). Lowercase recommended. */
  text?: string;
  /** Styled suffix appended in primary color (e.g. ".sh", ".cloud") */
  suffix?: string;
}

/** Color palette for the site theme. All values are CSS color strings. */
export interface ColorConfig {
  /** Primary brand color used for links, buttons, and accents. */
  primary: string;
  /** Secondary accent color. */
  accent?: string;
  /** Page background color. */
  background?: string;
  /** Surface color for cards, sidebar, etc. */
  surface?: string;
  /** Base text color. */
  text?: string;
  /** Border color. */
  border?: string;
  /** Dark mode overrides. Falls back to auto-generated dark palette if unset. */
  dark?: {
    primary?: string;
    accent?: string;
    background?: string;
    surface?: string;
    text?: string;
    border?: string;
  };
}

/** Font family configuration for body, heading, and monospace text. */
export interface FontConfig {
  /** Body text font family. Include fallbacks. */
  body?: string;
  /** Heading font family. Falls back to body if unset. */
  heading?: string;
  /** Monospace font for code blocks. */
  mono?: string;
  /** Font stylesheet URLs (added as <link> tags in <head>). Self-host fonts for privacy. */
  imports?: string[];
}

/** Visual style options for border radius, dark mode, and custom CSS. */
export interface StyleConfig {
  /** Border radius scale: none=0, sm=0.25rem, md=0.5rem (default), lg=0.75rem, xl=1rem */
  roundedness?: "none" | "sm" | "md" | "lg" | "xl";
  /** Dark mode behavior: auto (system preference, no toggle), light (force light), dark (force dark), toggle (system preference + user toggle) */
  darkMode?: "auto" | "light" | "dark" | "toggle";
  /** URL path to a custom CSS file served from the static directory, loaded after all theme tokens */
  customCss?: string;
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

/** Layout dimensions and visibility toggles. */
export interface LayoutConfig {
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
}

// ---------------------------------------------------------------------------
// Landing page
// ---------------------------------------------------------------------------

/** Landing page hero section content. */
export interface HeroConfig {
  /** Badge text above the headline (e.g. "Open Source · Fast") */
  badge?: string;
  /** Main headline text */
  title: string;
  /** Portion of the title rendered with a gradient highlight */
  titleHighlight?: string;
  /** Subtitle displayed below the title */
  subtitle?: string;
  /** Description paragraph below the subtitle */
  description?: string;
}

/** Call-to-action buttons in the landing page hero. */
export interface CtaConfig {
  /** Primary CTA button */
  primary?: { text: string; href: string };
  /** Secondary CTA button */
  secondary?: { text: string; href: string };
}

/** A feature card displayed in the landing page grid. */
export interface FeatureCard {
  /** Emoji or icon */
  icon?: string;
  /** Feature title */
  title: string;
  /** Feature description */
  description: string;
}

/** Landing page configuration: hero, features, and CTAs. */
export interface LandingConfig {
  /** Set to false to redirect "/" to first doc page */
  enabled?: boolean;
  /** Custom redirect path (default: first nav item with href) */
  redirectTo?: string;
  /** Hero section content */
  hero?: HeroConfig;
  /** Call-to-action buttons in the hero */
  cta?: CtaConfig;
  /** Shell command shown in an install snippet (e.g. "npm install my-lib") */
  install?: string;
  /** Feature cards displayed in a grid */
  features?: FeatureCard[];
}

// ---------------------------------------------------------------------------
// SEO
// ---------------------------------------------------------------------------

/** SEO and Open Graph configuration. */
export interface SeoConfig {
  /** Canonical base URL (e.g. "https://denote.sh"). Used for canonical links, sitemap, hreflang, OG. */
  url?: string;
  /** Default OG image URL (1200x630 recommended) */
  ogImage?: string;
  /** OG image width (default: 1200 when ogImage is set) */
  ogImageWidth?: number;
  /** OG image height (default: 630 when ogImage is set) */
  ogImageHeight?: number;
  /** Locale for hreflang and html lang (default: "en") */
  locale?: string;
  /** JSON-LD @type for the site (default: "WebSite") */
  jsonLdType?: string;
  /** Extra properties merged into the JSON-LD object */
  jsonLdExtra?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// AI
// ---------------------------------------------------------------------------

/** AI features configuration. */
export interface AiConfig {
  /** Enable MCP (Model Context Protocol) endpoint at /mcp */
  mcp?: boolean;
}

// ---------------------------------------------------------------------------
// Top-level config (composed)
// ---------------------------------------------------------------------------

/**
 * Top-level site configuration.
 *
 * Compose from the smaller interfaces above to configure navigation, theming,
 * SEO, AI features, and layout.
 */
export interface DenoteConfig {
  /** Site display name, shown in the header and page titles. */
  name: string;
  /** Logo images and branding text. */
  logo?: LogoConfig;
  /** Path to the favicon file (relative to `static/`). */
  favicon?: string;
  /** Color palette for theming. */
  colors?: ColorConfig;
  /** Font families and external stylesheet imports. */
  fonts?: FontConfig;
  /** Sidebar navigation tree. */
  navigation: NavItem[];
  /** Top navigation bar links (shown next to the logo). */
  topNav?: { title: string; href: string }[];
  /** Footer links and copyright text. */
  footer?: {
    links?: { title: string; href: string }[];
    copyright?: string;
  };
  /** Social media links shown in the header/footer. */
  social?: {
    github?: string;
    twitter?: string;
    discord?: string;
  };
  /** Search configuration. */
  search?: {
    enabled: boolean;
  };
  /** Layout dimensions and visibility toggles. */
  layout?: LayoutConfig;
  /** Landing page content and settings. */
  landing?: LandingConfig;
  /** Visual style options. */
  style?: StyleConfig;
  /** Server-side analytics (no client JS, no cookies, GDPR-friendly) */
  analytics?: {
    /** Analytics provider: "umami", "plausible", or "custom" */
    provider: "umami" | "plausible" | "custom";
    /** Collection API endpoint URL. Defaults to the provider's cloud endpoint for Umami and Plausible. Required for "custom". */
    endpoint?: string;
    /** Site identifier. Falls back to ANALYTICS_SITE_ID env var at runtime. Keep out of committed config to prevent analytics spam. */
    siteId?: string;
  };
  /** Base URL for "Edit this page" links. Denote appends /<slug>.md automatically.
   *  Example: "https://github.com/your-org/your-repo/edit/main/docs/content/docs" */
  editUrl?: string;
  /** SEO and Open Graph settings. */
  seo?: SeoConfig;
  /** AI features (MCP endpoint). */
  ai?: AiConfig;
}

/** Re-export config setters (used by CLI and mod.ts internals) */
export { setConfig, setContentDir, setDocsBasePath } from "./lib/config.ts";
