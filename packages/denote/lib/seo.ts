/**
 * SEO helper functions — pure, testable utilities for generating
 * structured data, sitemaps, and robots.txt.
 */
import type { DenoteConfig } from "../denote.config.ts";

/** Minimal doc shape needed by sitemap builder */
export interface SitemapDoc {
  slug: string;
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
    <loc>${baseUrl}${docsBasePath}/${doc.slug}</loc>
    <lastmod>${today}</lastmod>
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

/**
 * Build a robots.txt string.
 */
export function buildRobotsTxt(baseUrl: string): string {
  return `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml
`;
}
