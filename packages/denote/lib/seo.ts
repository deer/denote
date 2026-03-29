/**
 * SEO helper functions — pure, testable utilities for generating
 * structured data, sitemaps, and robots.txt.
 */
import type { DenoteConfig } from "../denote.config.ts";

/** Escape special XML characters in text content. */
function xmlEscape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Minimal doc shape needed by sitemap builder */
export interface SitemapDoc {
  slug: string;
  /** ISO date string (YYYY-MM-DD) for lastmod. Falls back to today if unset. */
  lastmod?: string;
}

/**
 * Build a JSON-LD structured data object for a page.
 */
export function buildJsonLd(
  config: DenoteConfig,
  pageDescription: string,
  pageUrl?: string,
): Record<string, unknown> {
  const seo = config.seo;
  const base: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": seo?.jsonLdType || "WebSite",
    name: config.name,
    url: pageUrl || seo?.url || "/",
    description: pageDescription,
  };

  if (seo?.jsonLdExtra) {
    Object.assign(base, seo.jsonLdExtra);
  }

  return base;
}

/**
 * Build a sitemap.xml string with changefreq and priority.
 */
export function buildSitemapXml(
  baseUrl: string,
  docsBasePath: string,
  docs: SitemapDoc[],
): string {
  const today = new Date().toISOString().slice(0, 10);

  const homeUrl = `  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>`;

  const indexUrl = `  <url>
    <loc>${baseUrl}${docsBasePath}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;

  const docUrls = docs.map((doc) =>
    `  <url>
    <loc>${baseUrl}${docsBasePath}/${xmlEscape(doc.slug)}</loc>
    <lastmod>${doc.lastmod ?? today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`
  );

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${homeUrl}
${indexUrl}
${docUrls.join("\n")}
</urlset>`;
}

// ── Sitemap cache ──────────────────────────────────────────

/** Cached sitemap XML keyed by `${baseUrl}|${docsBasePath}`. */
let sitemapCache: Map<string, string> = new Map();

/** Return cached sitemap XML, or null on miss. */
export function getCachedSitemap(
  baseUrl: string,
  docsBasePath: string,
): string | null {
  return sitemapCache.get(`${baseUrl}|${docsBasePath}`) ?? null;
}

/** Store sitemap XML in cache. */
export function setCachedSitemap(
  baseUrl: string,
  docsBasePath: string,
  xml: string,
): void {
  sitemapCache.set(`${baseUrl}|${docsBasePath}`, xml);
}

/** Clear the in-memory sitemap cache (called on content changes). */
export function clearSitemapCache(): void {
  sitemapCache = new Map();
}

/**
 * Build a robots.txt string.
 */
export function buildRobotsTxt(baseUrl: string): string {
  return `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml
`;
}
