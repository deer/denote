import { createDefine } from "fresh";

export interface State {
  shared: string;
  pageTitle?: string;
  pageDescription?: string;
  pageUrl?: string;
  pageImage?: string;
  /** Per-request CSP nonce for inline script tags */
  cspNonce?: string;
}

export const define = createDefine<State>();
