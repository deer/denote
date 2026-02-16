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
