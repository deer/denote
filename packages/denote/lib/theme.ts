/**
 * Theme CSS generation from DenoteConfig.
 *
 * Extracted to a separate module for testability and CSP compliance.
 * Instead of inlining styles via dangerouslySetInnerHTML, these functions
 * generate content served from dedicated routes.
 */
import type { DenoteConfig } from "../denote.config.ts";

/** Generate CSS custom property overrides from DenoteConfig */
export function generateThemeCSS(config: DenoteConfig): string {
  const c = config.colors;
  const f = config.fonts;
  const hasColors = c?.primary || c?.accent || c?.background || f?.body;
  const hasLayout = config.layout?.sidebarWidth ||
    config.layout?.maxContentWidth || config.layout?.headerHeight ||
    config.layout?.tocWidth;
  const hasStyle = config.style?.roundedness;
  if (!hasColors && !hasLayout && !hasStyle) return "";

  const p = c?.primary;
  const a = c?.accent;
  const bg = c?.background;
  const surface = c?.surface;
  const text = c?.text;
  const border = c?.border;
  const dk = c?.dark;

  // Use `html:root` for higher specificity (0,1,1) so config overrides
  // always beat the `:root` defaults (0,1,0) in styles.css.
  const lines: string[] = ["html:root {"];

  // Layout dimensions
  const layout = config.layout;
  if (layout?.sidebarWidth) {
    lines.push(`  --denote-sidebar-width: ${layout.sidebarWidth}px;`);
  }
  if (layout?.maxContentWidth) {
    lines.push(`  --denote-content-max-width: ${layout.maxContentWidth}px;`);
  }
  if (layout?.headerHeight) {
    lines.push(`  --denote-header-height: ${layout.headerHeight}px;`);
  }
  if (layout?.tocWidth) {
    lines.push(`  --denote-toc-width: ${layout.tocWidth}px;`);
  }

  // Border radius scale
  const roundedness = config.style?.roundedness;
  if (roundedness) {
    const radiusMap: Record<string, [string, string, string]> = {
      none: ["0", "0", "0"],
      sm: ["0.25rem", "0.375rem", "0.5rem"],
      md: ["0.5rem", "0.75rem", "1rem"],
      lg: ["0.75rem", "1rem", "1.25rem"],
      xl: ["1rem", "1.25rem", "1.5rem"],
    };
    const [r, rlg, rxl] = radiusMap[roundedness] || radiusMap.md;
    lines.push(`  --denote-radius: ${r};`);
    lines.push(`  --denote-radius-lg: ${rlg};`);
    lines.push(`  --denote-radius-xl: ${rxl};`);
  }

  // Primary color + derived variants
  if (p) {
    lines.push(`  --denote-primary: ${p};`);
    lines.push(
      `  --denote-primary-hover: color-mix(in srgb, ${p} 85%, black);`,
    );
    lines.push(
      `  --denote-primary-subtle: color-mix(in srgb, ${p} 12%, white);`,
    );
    lines.push(`  --denote-primary-text: ${p};`);
    lines.push(
      `  --denote-shadow-primary: color-mix(in srgb, ${p} 25%, transparent);`,
    );
  }
  if (a) lines.push(`  --denote-accent: ${a};`);
  if (bg) lines.push(`  --denote-bg: ${bg};`);
  if (surface) {
    lines.push(`  --denote-bg-secondary: ${surface};`);
    lines.push(
      `  --denote-bg-tertiary: color-mix(in srgb, ${surface} 80%, ${
        bg || "white"
      });`,
    );
  }
  if (text) {
    lines.push(`  --denote-text: ${text};`);
    lines.push(
      `  --denote-text-secondary: color-mix(in srgb, ${text} 70%, ${
        bg || "white"
      });`,
    );
    lines.push(
      `  --denote-text-muted: color-mix(in srgb, ${text} 45%, ${
        bg || "white"
      });`,
    );
  }
  if (border) {
    lines.push(`  --denote-border: ${border};`);
    lines.push(
      `  --denote-border-strong: color-mix(in srgb, ${border} 80%, ${
        text || "black"
      });`,
    );
  }
  if (bg) {
    lines.push(
      `  --denote-surface-overlay: color-mix(in srgb, ${bg} 80%, transparent);`,
    );
  }

  // Font families
  if (f?.body) lines.push(`  --denote-font-body: ${f.body};`);
  if (f?.heading) lines.push(`  --denote-font-heading: ${f.heading};`);
  if (f?.mono) lines.push(`  --denote-font-mono: ${f.mono};`);

  lines.push("}");

  // Dark mode overrides
  const hasDark = dk || p || a;
  if (hasDark) {
    lines.push("html:root.dark {");
    const dp = dk?.primary ||
      (p ? `color-mix(in srgb, ${p} 70%, white)` : undefined);
    const da = dk?.accent ||
      (a ? `color-mix(in srgb, ${a} 70%, white)` : undefined);
    const dbg = dk?.background;
    const ds = dk?.surface;
    const dt = dk?.text;
    const dborder = dk?.border;

    if (dp) {
      lines.push(`  --denote-primary: ${dp};`);
      lines.push(
        `  --denote-primary-hover: color-mix(in srgb, ${dp} 80%, white);`,
      );
      lines.push(
        `  --denote-primary-subtle: color-mix(in srgb, ${dp} 30%, black);`,
      );
      lines.push(`  --denote-primary-text: ${dp};`);
      lines.push(
        `  --denote-shadow-primary: color-mix(in srgb, ${dp} 15%, transparent);`,
      );
    }
    if (da) lines.push(`  --denote-accent: ${da};`);
    if (dbg) {
      lines.push(`  --denote-bg: ${dbg};`);
      lines.push(
        `  --denote-surface-overlay: color-mix(in srgb, ${dbg} 80%, transparent);`,
      );
    }
    if (ds) {
      lines.push(`  --denote-bg-secondary: ${ds};`);
      // Dark mode: bg-tertiary should be LIGHTER than bg-secondary
      // (opposite of light mode) for visible code block backgrounds
      lines.push(
        `  --denote-bg-tertiary: color-mix(in srgb, ${ds}, ${
          dt || "white"
        } 15%);`,
      );
    }
    if (dt) {
      lines.push(`  --denote-text: ${dt};`);
      lines.push(
        `  --denote-text-secondary: color-mix(in srgb, ${dt} 65%, ${
          dbg || "black"
        });`,
      );
      lines.push(
        `  --denote-text-muted: color-mix(in srgb, ${dt} 40%, ${
          dbg || "black"
        });`,
      );
    }
    if (dborder) {
      lines.push(`  --denote-border: ${dborder};`);
      lines.push(
        `  --denote-border-strong: color-mix(in srgb, ${dborder} 70%, ${
          dt || "white"
        });`,
      );
    }
    lines.push("}");
  }

  return lines.join("\n");
}

/** Generate the dark-mode detection IIFE, respecting darkMode config */
export function darkModeScript(
  mode?: "auto" | "light" | "dark" | "toggle",
): string {
  if (mode === "light") {
    return `(function(){document.documentElement.classList.remove('dark')})();`;
  }
  if (mode === "dark") {
    return `(function(){document.documentElement.classList.add('dark')})();`;
  }
  // "toggle" defaults to dark, "auto" (default) uses system preference
  const defaultDark = mode === "toggle";
  return `(function(){
    var s;try{s=localStorage.getItem('theme')}catch(e){}
    var p=window.matchMedia('(prefers-color-scheme: dark)').matches;
    if(s==='dark'||(!s&&(p||${defaultDark}))){document.documentElement.classList.add('dark')}
  })();`;
}
