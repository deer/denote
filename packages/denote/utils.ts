import { createDefine } from "fresh";
import type { DenoteConfig } from "./denote.config.ts";

/** Complete configuration context for a Denote app */
export interface DenoteContext {
  /** Denote site configuration (name, navigation, colors, etc.) */
  config: DenoteConfig;
  /** Path to the markdown content directory */
  contentDir: string;
  /** Base path where doc pages are served (e.g. "/docs") */
  docsBasePath: string;
}

/** Fresh route state populated by Denote middleware. */
export interface State {
  /** Shared state string (Fresh convention). */
  shared?: string;
  /** Current page title (set by docs middleware). */
  pageTitle?: string;
  /** Current page meta description (set by docs middleware). */
  pageDescription?: string;
  /** Canonical URL for the current page. */
  pageUrl?: string;
  /** OG image URL for the current page. */
  pageImage?: string;
  /** Pre-fetched doc from middleware — avoids redundant getDoc in page handler */
  doc?: import("./lib/docs.ts").DocPage;
  /** Denote configuration context — set by denote() middleware */
  denote: DenoteContext;
}

/** Type-safe Fresh route helper pre-bound to {@linkcode State}. */
export const define = createDefine<State>();

/** True when running locally (not on Deno Deploy and not NODE_ENV=production). */
export function isDev(): boolean {
  return !Deno.env.get("DENO_DEPLOYMENT_ID") &&
    Deno.env.get("NODE_ENV") !== "production";
}
