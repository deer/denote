/**
 * Denote configuration registry
 *
 * Module-level singleton that holds the active DenoteConfig and content directory.
 * Uses ES module live bindings so all importers see updates immediately.
 *
 * When Denote runs standalone, `denote.config.ts` sets the config at import time.
 * When mounted into another app, `denote()` in mod.ts calls setConfig() before
 * creating routes.
 */
import type { DenoteConfig } from "../denote.config.ts";
import { z } from "zod";

/** Matches 3, 6, or 8-digit hex color strings like #f00, #ff0000, #ff000080 */
export const HEX_COLOR_REGEX =
  /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

const HEX_COLOR = z.string().regex(
  HEX_COLOR_REGEX,
  "Must be a valid hex color (e.g. #ff0000)",
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
    href: z.string().optional(),
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
  locale: z.string().optional(),
  jsonLdType: z.string().optional(),
  jsonLdExtra: z.record(z.string(), z.unknown()).optional(),
}).optional();

const ConfigSchema = z.object({
  name: z.string().min(1, "Config 'name' is required"),
  navigation: z.array(NavItemSchema).min(
    1,
    "Config 'navigation' must have at least one item",
  ),
  colors: ColorSchema,
  seo: SeoSchema,
}).passthrough();

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

let _config: DenoteConfig | null = null;

/**
 * Get the active Denote configuration.
 * Throws if no config has been set yet (programming error).
 */
export function getConfig(): DenoteConfig {
  if (!_config) {
    throw new Error(
      "Denote config not initialized. Call setConfig() or import denote.config.ts first.",
    );
  }
  return _config;
}

/**
 * Set the active Denote configuration.
 * Called by denote.config.ts (standalone) or denote() (mounted).
 */
export function setConfig(config: DenoteConfig): void {
  const result = ConfigSchema.safeParse(config);
  if (!result.success) {
    for (const issue of result.error.issues) {
      const path = issue.path.length > 0 ? issue.path.join(".") : "config";
      console.warn(`Warning: Config validation — ${path}: ${issue.message}`);
    }
  }
  _config = config;
}

// ---------------------------------------------------------------------------
// Content directory
// ---------------------------------------------------------------------------

let _contentDir = "./content/docs";

/**
 * Get the content directory path.
 */
export function getContentDir(): string {
  return _contentDir;
}

/**
 * Set the content directory path.
 * Default: "./content/docs"
 */
export function setContentDir(dir: string): void {
  _contentDir = dir;
}

// ---------------------------------------------------------------------------
// Docs base path (where doc pages are served)
// ---------------------------------------------------------------------------

let _docsBasePath = "/docs";

/**
 * Get the docs base path (e.g. "/docs" or "/reference").
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
