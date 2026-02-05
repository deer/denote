import { createDefine } from "fresh";

export interface State {
  shared: string;
  pageTitle?: string;
  pageDescription?: string;
  pageUrl?: string;
  pageImage?: string;
}

export const define = createDefine<State>();
