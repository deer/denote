/**
 * Denote — Mountable Documentation Engine for Fresh v2
 *
 * Usage (standalone):
 *   import { denote } from "./mod.ts";
 *   import { config } from "./denote.config.ts";
 *   const app = denote({ config });
 *   app.listen();
 *
 * Usage (mounted in another Fresh app):
 *   import { denote } from "denote/mod.ts";
 *   import { App, staticFiles } from "fresh";
 *
 *   const docs = denote({
 *     config: { name: "My Project", navigation: [...] },
 *     contentDir: "./docs/content",
 *   });
 *
 *   const app = new App()
 *     .use(staticFiles())
 *     .get("/", (ctx) => ctx.render(<HomePage />))
 *     .mountApp("/", docs)
 *     .listen();
 */
import { App, staticFiles } from "fresh";
import type { DenoteConfig, NavItem } from "./denote.config.ts";
import {
  getConfig,
  getDocsBasePath,
  setConfig,
  setContentDir,
  setDocsBasePath,
} from "./lib/config.ts";
import { csp } from "./lib/csp.ts";
import { ga4Middleware } from "./lib/ga4.ts";
import { darkModeScript, generateThemeCSS } from "./lib/theme.ts";
import { COMBINED_CSS } from "@deer/gfm/style";
import type { State } from "./utils.ts";

// Import page components for programmatic routing
import { App as AppWrapper } from "./routes/_app.tsx";
import { NotFoundPage } from "./routes/_404.tsx";
import { ErrorPage } from "./routes/_error.tsx";
import { Home as HomePage } from "./routes/index.tsx";
import { DocsPage } from "./routes/docs/[...slug].tsx";
import { handler as docsMiddleware } from "./routes/docs/_middleware.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Walk the navigation tree and return the first item with an href. */
function findFirstHref(items: NavItem[]): string | null {
  for (const item of items) {
    if (item.href) return item.href;
    if (item.children) {
      const found = findFirstHref(item.children);
      if (found) return found;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface DenoteOptions {
  /** Denote site configuration (name, navigation, colors, etc.) */
  config: DenoteConfig;

  /** Path to the markdown content directory. Default: "./content/docs" */
  contentDir?: string;

  /**
   * Base path where doc pages are served. Default: "/docs"
   * This affects route patterns like {docsBasePath}/{slug}.
   */
  docsBasePath?: string;

  /**
   * Include the default landing page at "/". Default: true
   * Set to false when mounting into an existing app that has its own homepage.
   */
  includeLandingPage?: boolean;

  /**
   * Include static file serving middleware. Default: true
   * Set to false when the parent app already handles static files.
   */
  includeStaticFiles?: boolean;

  /**
   * Include SEO routes (sitemap.xml, robots.txt). Default: true
   */
  includeSeo?: boolean;

  /**
   * Include 404/error handlers. Default: true
   * Set to false when the parent app provides its own error handling.
   */
  includeErrorHandlers?: boolean;
}

/**
 * Create a Denote documentation app that can be used standalone
 * or mounted into another Fresh app via `app.mountApp()`.
 */
export function denote(options: DenoteOptions): App<unknown> {
  const {
    config,
    contentDir = "./content/docs",
    docsBasePath = "/docs",
    includeLandingPage = true,
    includeStaticFiles = true,
    includeSeo = true,
    includeErrorHandlers = true,
  } = options;

  // Configure the module-level singletons
  setConfig(config);
  setContentDir(contentDir);
  setDocsBasePath(docsBasePath);

  const app = new App<State>();

  // ── App wrapper (HTML shell) ────────────────────────────────
  app.appWrapper(AppWrapper);

  // ── Static files ────────────────────────────────────────────
  if (includeStaticFiles) {
    app.use(staticFiles());
  }

  // ── GA4 Analytics middleware (opt-in) ────────────────────────
  if (config.ga4) {
    app.use(ga4Middleware());
  }

  // ── CSP-compliant asset routes ──────────────────────────────

  // In dev mode, config-driven assets shouldn't be cached so that
  // config changes are reflected immediately on restart.
  const isDev = !Deno.env.get("DENO_DEPLOYMENT_ID") &&
    Deno.env.get("NODE_ENV") !== "production";
  const configCacheControl = isDev ? "no-cache" : "public, max-age=3600";

  // Theme detection script (render-blocking to prevent FOUC)
  app.get("/theme-init.js", () => {
    return new Response(darkModeScript(getConfig().style?.darkMode), {
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": configCacheControl,
      },
    });
  });

  // GFM syntax highlighting CSS
  app.get("/gfm.css", () => {
    return new Response(COMBINED_CSS, {
      headers: {
        "Content-Type": "text/css; charset=utf-8",
        "Cache-Control": "public, max-age=86400",
      },
    });
  });

  // Config-driven theme override CSS variables (recomputed per request for HMR)
  app.get("/theme-vars.css", () => {
    return new Response(generateThemeCSS(getConfig()), {
      headers: {
        "Content-Type": "text/css; charset=utf-8",
        "Cache-Control": configCacheControl,
      },
    });
  });

  // ── Content Security Policy ──────────────────────────────────
  // Build directive overrides based on config (fonts, images, etc.)
  const cspOverrides: string[] = [
    // Docs commonly embed external images from GitHub, CDNs, etc.
    "img-src 'self' data: https:",
  ];

  // Allow external CDN origins when font imports or custom CSS use absolute URLs
  const styleSrc = ["'self'", "'unsafe-inline'"];
  const fontSrc = ["'self'"];
  for (const url of config.fonts?.imports ?? []) {
    try {
      const { origin } = new URL(url);
      if (!styleSrc.includes(origin)) styleSrc.push(origin);
      if (!fontSrc.includes(origin)) fontSrc.push(origin);
    } catch { /* skip relative URLs and invalid URLs */ }
  }
  if (config.style?.customCss?.startsWith("http")) {
    try {
      const { origin } = new URL(config.style.customCss);
      if (!styleSrc.includes(origin)) styleSrc.push(origin);
    } catch { /* skip */ }
  }
  if (styleSrc.length > 2) {
    cspOverrides.push(`style-src ${styleSrc.join(" ")}`);
  }
  if (fontSrc.length > 1) {
    cspOverrides.push(`font-src ${fontSrc.join(" ")}`);
  }

  app.use(csp({ csp: cspOverrides }));

  // ── Security headers middleware ──────────────────────────────
  app.use(async (ctx) => {
    const resp = await ctx.next();
    resp.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
    resp.headers.set("X-Content-Type-Options", "nosniff");
    resp.headers.set("X-Frame-Options", "DENY");
    resp.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

    // Cache hashed static assets aggressively
    const url = new URL(ctx.req.url);
    const path = url.pathname;
    if (
      path.startsWith("/_fresh/") ||
      /\.[a-f0-9]{8,}\.(js|css|svg|png|jpg|jpeg|webp|woff2?)$/.test(path)
    ) {
      resp.headers.set("Cache-Control", "public, max-age=31536000, immutable");
    }

    return resp;
  });

  // ── Logger middleware ───────────────────────────────────────
  app.use((ctx) => {
    console.log(`${ctx.req.method} ${ctx.req.url}`);
    return ctx.next();
  });

  // ── MCP Endpoint ────────────────────────────────────────────

  if (config.ai?.mcp) {
    const mcpHandler = async (ctx: { req: Request }) => {
      const { createMcpServer, MCP_CORS_HEADERS } = await import(
        "./lib/mcp.ts"
      );

      // CORS preflight
      if (ctx.req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: MCP_CORS_HEADERS });
      }

      // Stateless: create a fresh server+transport per request.
      // No session tracking — works reliably on Deno Deploy
      const { WebStandardStreamableHTTPServerTransport } = await import(
        "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js"
      );
      const origin = new URL(ctx.req.url).origin;
      const server = createMcpServer(origin);
      const transport = new WebStandardStreamableHTTPServerTransport({});
      await server.connect(transport);

      const response = await transport.handleRequest(ctx.req);

      // Add CORS headers
      for (const [key, value] of Object.entries(MCP_CORS_HEADERS)) {
        if (!response.headers.has(key)) {
          response.headers.set(key, value);
        }
      }
      return response;
    };

    // Intercept all methods on /mcp via global middleware
    // (Fresh doesn't have app.options(), and MCP needs GET/POST/DELETE/OPTIONS)
    app.use((ctx) => {
      const url = new URL(ctx.req.url);
      if (url.pathname === "/mcp") {
        return mcpHandler(ctx);
      }
      return ctx.next();
    });
  }

  // ── AI Agent Endpoints ─────────────────────────────────────

  app.get("/llms.txt", async (ctx) => {
    const { generateLlmsTxt } = await import("./lib/ai.ts");
    const baseUrl = new URL(ctx.req.url).origin;
    const txt = await generateLlmsTxt(baseUrl);
    return new Response(txt, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  });

  app.get("/llms-full.txt", async () => {
    const { generateFullDocs } = await import("./lib/ai.ts");
    const txt = await generateFullDocs();
    return new Response(txt, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  });

  app.get("/api/docs", async (ctx) => {
    const { getDocsJson } = await import("./lib/ai.ts");
    const baseUrl = new URL(ctx.req.url).origin;
    const json = await getDocsJson(baseUrl);
    return new Response(JSON.stringify(json, null, 2), {
      headers: { "Content-Type": "application/json" },
    });
  });

  app.post("/api/chat", async (ctx) => {
    const { isAllowed } = await import("./lib/rate-limit.ts");
    const ip = ctx.req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";
    if (!isAllowed(ip)) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { status: 429, headers: { "Content-Type": "application/json" } },
      );
    }

    const { handleChat } = await import("./lib/chat.ts");
    try {
      const body = await ctx.req.json();
      const result = await handleChat(body);
      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("Chat error:", err);
      return new Response(
        JSON.stringify({ error: "Chat request failed" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  });

  app.get("/api/search", async () => {
    const { buildSearchIndex } = await import("./lib/docs.ts");
    const index = await buildSearchIndex();
    return new Response(JSON.stringify(index), {
      headers: { "Content-Type": "application/json" },
    });
  });

  // ── SEO Endpoints ──────────────────────────────────────────

  if (includeSeo) {
    app.get("/sitemap.xml", async (ctx) => {
      const { getAllDocs } = await import("./lib/docs.ts");
      const { buildSitemapXml } = await import("./lib/seo.ts");
      const seoBase = config.seo?.url?.replace(/\/$/, "");
      const baseUrl = seoBase || new URL(ctx.req.url).origin;
      const docs = await getAllDocs();
      const basePath = getDocsBasePath();

      const xml = buildSitemapXml(baseUrl, basePath, docs);

      return new Response(xml, {
        headers: { "Content-Type": "application/xml; charset=utf-8" },
      });
    });

    app.get("/robots.txt", async (ctx) => {
      const { buildRobotsTxt } = await import("./lib/seo.ts");
      const seoBase = config.seo?.url?.replace(/\/$/, "");
      const baseUrl = seoBase || new URL(ctx.req.url).origin;
      const txt = buildRobotsTxt(baseUrl);
      return new Response(txt, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    });
  }

  // ── Landing page ───────────────────────────────────────────

  if (includeLandingPage) {
    app.route("/", { component: HomePage });
  }

  // ── Documentation routes ───────────────────────────────────

  // Middleware for docs pages (sets page metadata in state)
  app.use(`${docsBasePath}/*`, docsMiddleware);

  // Redirect /docs to the first navigation page
  const firstNavHref = findFirstHref(config.navigation) ||
    `${docsBasePath}/introduction`;
  app.get(docsBasePath, () =>
    new Response(null, {
      status: 302,
      headers: { Location: firstNavHref },
    }));

  // Doc page handler — :slug+ matches one or more path segments
  app.route(`${docsBasePath}/:slug+`, { component: DocsPage });

  // ── Error handlers ─────────────────────────────────────────

  if (includeErrorHandlers) {
    app.notFound({ component: NotFoundPage });
    app.onError("*", { component: ErrorPage });
  }

  return app as App<unknown>;
}

// ---------------------------------------------------------------------------
// Re-exports for library consumers
// ---------------------------------------------------------------------------

export type { DenoteConfig, NavItem } from "./denote.config.ts";
export type { State } from "./utils.ts";
export {
  getConfig,
  getContentDir,
  getDocsBasePath,
  setConfig,
  setContentDir,
  setDocsBasePath,
} from "./lib/config.ts";

/**
 * Island specifiers for Fresh vite plugin configuration.
 * Use this when consuming @denote/core as a library:
 *
 * ```ts
 * // vite.config.ts
 * import { islandSpecifiers } from "@denote/core";
 * import { fresh } from "@fresh/plugin-vite";
 *
 * export default defineConfig({
 *   plugins: [fresh({ islandSpecifiers })],
 * });
 * ```
 */
export const islandSpecifiers = [
  "@denote/core/islands/ThemeToggle.tsx",
  "@denote/core/islands/MobileMenu.tsx",
  "@denote/core/islands/Search.tsx",
  "@denote/core/islands/CollapsibleNav.tsx",
  "@denote/core/islands/CopyButton.tsx",
  "@denote/core/islands/ActiveToc.tsx",
  "@denote/core/islands/AiChat.tsx",
];
