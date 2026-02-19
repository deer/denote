/**
 * Content Security Policy middleware.
 *
 * Drop-in replacement for Fresh's built-in csp() that properly merges
 * custom directives by name instead of blindly appending them.
 *
 * Fresh's version appends custom directives after the defaults, but the
 * CSP spec says duplicate directive names are ignored (first wins). This
 * version uses a Map so custom directives override defaults by name.
 */

/** Options for Content-Security-Policy middleware */
export interface CSPOptions {
  /** If true, sets Content-Security-Policy-Report-Only instead */
  reportOnly?: boolean;

  /** If set, adds Reporting-Endpoints, report-to, and report-uri directives */
  reportTo?: string;

  /** CSP directives that override the defaults (matched by directive name) */
  csp?: string[];
}

const DEFAULT_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "img-src 'self' data:",
  "media-src 'self' data: blob:",
  "worker-src 'self' blob:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
];

/**
 * Middleware to set Content-Security-Policy headers.
 *
 * Custom directives in `options.csp` override defaults by directive name.
 * For example, passing `["font-src 'self' https://cdn.example.com"]`
 * replaces the default `font-src 'self'` instead of appending a duplicate.
 */
export function csp(options: CSPOptions = {}) {
  const { reportOnly = false, reportTo, csp: custom = [] } = options;

  // Map keyed by directive name so custom entries replace defaults
  const directives = new Map<string, string>();
  for (const d of DEFAULT_DIRECTIVES) {
    directives.set(d.split(/\s+/)[0], d);
  }
  for (const d of custom) {
    directives.set(d.split(/\s+/)[0], d);
  }

  if (reportTo) {
    directives.set("report-to", "report-to csp-endpoint");
    directives.set("report-uri", `report-uri ${reportTo}`);
  }

  const cspString = [...directives.values()].join("; ");

  // deno-lint-ignore no-explicit-any
  return async (ctx: any) => {
    const res = await ctx.next();
    const headerName = reportOnly
      ? "Content-Security-Policy-Report-Only"
      : "Content-Security-Policy";
    res.headers.set(headerName, cspString);
    if (reportTo) {
      res.headers.set("Reporting-Endpoints", `csp-endpoint="${reportTo}"`);
    }
    return res;
  };
}
