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

export interface State {
  shared: string;
  pageTitle?: string;
  pageDescription?: string;
  pageUrl?: string;
  pageImage?: string;
  /** Denote configuration context — set by denote() middleware */
  denote: DenoteContext;
}

export const define = createDefine<State>();
