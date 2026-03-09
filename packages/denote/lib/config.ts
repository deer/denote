/**
 * Denote configuration registry
 *
 * Module-level singleton that holds the active DenoteConfig and content directory.
 * Uses ES module live bindings so all importers see updates immediately.
 *
 * The {@linkcode denote} factory in mod.ts calls {@linkcode setConfig} before
 * creating routes. HMR updates also go through setConfig so changes are
 * picked up on the next request without restarting the server.
 */
import type { DenoteConfig } from "../denote.config.ts";
import { resolve } from "@std/path";
import { z } from "zod";

/** Matches 3, 6, or 8-digit hex color strings like #f00, #ff0000, #ff000080 */
export const HEX_COLOR_REGEX =
  /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

const HEX_COLOR = z.string().regex(
  HEX_COLOR_REGEX,
  "Must be a valid hex color (e.g. #ff0000)",
);

/** Matches BCP 47-like locale tags: en, en-US, zh-Hant-TW, etc. */
export const LOCALE_REGEX = /^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})*$/;

/**
 * Safe href validator — blocks javascript: and data: URIs.
 * Allows local paths (starting with /) and http(s) URLs.
 */
const SAFE_HREF = z.string().refine(
  (s) =>
    s.startsWith("/") || s.startsWith("https://") || s.startsWith("http://"),
  "Must be a local path (/) or http(s) URL — javascript: and data: URIs are not allowed",
);

const ColorSchema = z.object({
  primary: HEX_COLOR,
  accent: HEX_COLOR.optional(),
  background: HEX_COLOR.optional(),
  surface: HEX_COLOR.optional(),
  text: HEX_COLOR.optional(),
  border: HEX_COLOR.optional(),
  dark: z.object({
    primary: HEX_COLOR.optional(),
    accent: HEX_COLOR.optional(),
    background: HEX_COLOR.optional(),
    surface: HEX_COLOR.optional(),
    text: HEX_COLOR.optional(),
    border: HEX_COLOR.optional(),
  }).optional(),
}).optional();

const NavItemSchema: z.ZodType<unknown> = z.lazy(() =>
  z.object({
    title: z.string(),
    href: SAFE_HREF.optional(),
    icon: z.string().optional(),
    children: z.array(NavItemSchema).optional(),
  })
);

const SeoSchema = z.object({
  url: z.string().url("Must be a valid URL (e.g. https://denote.sh)")
    .optional(),
  ogImage: z.string().url("Must be a valid URL").optional(),
  ogImageWidth: z.number().positive().optional(),
  ogImageHeight: z.number().positive().optional(),
  locale: z.string().regex(
    LOCALE_REGEX,
    "Must be a valid locale (e.g. en, en-US)",
  ).optional(),
  jsonLdType: z.string().optional(),
  jsonLdExtra: z.record(z.string(), z.unknown()).optional(),
}).optional();

const LandingSchema = z.object({
  enabled: z.boolean().optional(),
  redirectTo: z.string().min(1).startsWith(
    "/",
    "redirectTo must be a local path starting with /",
  ).refine(
    (s) => !s.startsWith("//"),
    "redirectTo must not start with // (protocol-relative URL)",
  ).optional(),
  hero: z.object({
    badge: z.string().optional(),
    title: z.string(),
    titleHighlight: z.string().optional(),
    subtitle: z.string().optional(),
    description: z.string().optional(),
  }).optional(),
  cta: z.object({
    primary: z.object({ text: z.string(), href: SAFE_HREF }).optional(),
    secondary: z.object({ text: z.string(), href: SAFE_HREF }).optional(),
  }).optional(),
  install: z.string().optional(),
  features: z.array(z.object({
    icon: z.string().optional(),
    title: z.string(),
    description: z.string(),
  })).optional(),
}).optional();

const LogoSchema = z.object({
  light: SAFE_HREF.optional(),
  dark: SAFE_HREF.optional(),
  text: z.string().optional(),
  suffix: z.string().optional(),
}).optional();

const FontSchema = z.object({
  body: z.string().optional(),
  heading: z.string().optional(),
  mono: z.string().optional(),
  imports: z.array(SAFE_HREF).optional(),
}).optional();

const StyleSchema = z.object({
  roundedness: z.enum(["none", "sm", "md", "lg", "xl"]).optional(),
  darkMode: z.enum(["auto", "light", "dark", "toggle"]).optional(),
  customCss: z.string().optional(),
}).optional();

const LayoutSchema = z.object({
  sidebarWidth: z.number().positive().optional(),
  maxContentWidth: z.number().positive().optional(),
  headerHeight: z.number().positive().optional(),
  tocWidth: z.number().positive().optional(),
  toc: z.boolean().optional(),
  breadcrumbs: z.boolean().optional(),
  footer: z.boolean().optional(),
}).optional();

const TopNavSchema = z.array(z.object({
  title: z.string(),
  href: SAFE_HREF,
})).optional();

const FooterSchema = z.object({
  links: z.array(z.object({
    title: z.string(),
    href: SAFE_HREF,
  })).optional(),
  copyright: z.string().optional(),
}).optional();

const SocialSchema = z.object({
  github: z.string().optional(),
  twitter: z.string().optional(),
  discord: z.string().optional(),
}).optional();

const SearchSchema = z.object({
  enabled: z.boolean(),
}).optional();

const AnalyticsSchema = z.object({
  provider: z.enum(["umami", "plausible", "custom"]),
  endpoint: z.string().url("Must be a valid URL").refine(
    (s) => s.startsWith("https://"),
    "Analytics endpoint must use HTTPS",
  ).optional(),
  siteId: z.string().optional(),
}).optional();

const AiSchema = z.object({
  mcp: z.boolean().optional(),
}).optional();

const ConfigSchema = z.object({
  name: z.string().min(1, "Config 'name' is required"),
  navigation: z.array(NavItemSchema).min(
    1,
    "Config 'navigation' must have at least one item",
  ),
  logo: LogoSchema,
  favicon: z.string().optional(),
  colors: ColorSchema,
  fonts: FontSchema,
  style: StyleSchema,
  layout: LayoutSchema,
  topNav: TopNavSchema,
  footer: FooterSchema,
  social: SocialSchema,
  search: SearchSchema,
  analytics: AnalyticsSchema,
  editUrl: z.string().url("editUrl must be a valid URL").optional(),
  seo: SeoSchema,
  landing: LandingSchema,
  ai: AiSchema,
}).strict();

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

let _config: DenoteConfig | null = null;

/**
 * Get the active Denote configuration.
 * Used internally by the context middleware to read the latest config
 * (supports HMR updates via setConfig).
 */
export function getConfig(): DenoteConfig {
  if (!_config) {
    throw new Error(
      "Denote config not initialized. Ensure denote.config.ts exports a 'config' object and that denote() is called in main.ts before the server starts.",
    );
  }
  return _config;
}

/** Set the active Denote configuration. */
export function setConfig(config: DenoteConfig): void {
  const result = ConfigSchema.safeParse(config);
  if (!result.success) {
    for (const issue of result.error.issues) {
      const path = issue.path.length > 0 ? issue.path.join(".") : "config";
      console.warn(
        `[denote] Config validation — ${path}: ${issue.message}. Check this field in denote.config.ts.`,
      );
    }
  }
  _config = config;
}

// ---------------------------------------------------------------------------
// Content directory
// ---------------------------------------------------------------------------

let _contentDir = resolve("./content/docs");

/**
 * Get the content directory path.
 * Used internally by the context middleware.
 */
export function getContentDir(): string {
  return _contentDir;
}

/**
 * Set the content directory path.
 * Resolves to an absolute path to avoid CWD-sensitivity at runtime.
 * Default: "./content/docs"
 */
export function setContentDir(dir: string): void {
  _contentDir = resolve(dir);
}

// ---------------------------------------------------------------------------
// Docs base path (where doc pages are served)
// ---------------------------------------------------------------------------

let _docsBasePath = "/docs";

/**
 * Get the docs base path (e.g. "/docs" or "/reference").
 * Used internally by the context middleware.
 */
export function getDocsBasePath(): string {
  return _docsBasePath;
}

/**
 * Set the docs base path.
 * Default: "/docs"
 */
export function setDocsBasePath(path: string): void {
  // Normalize: ensure leading slash, no trailing slash
  _docsBasePath = path.startsWith("/") ? path : `/${path}`;
  if (_docsBasePath.endsWith("/") && _docsBasePath !== "/") {
    _docsBasePath = _docsBasePath.slice(0, -1);
  }
}
