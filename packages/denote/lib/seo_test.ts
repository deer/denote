import { assertEquals } from "jsr:@std/assert@1";
import { buildJsonLd, buildRobotsTxt, buildSitemapXml } from "./seo.ts";
import type { DenoteConfig } from "../denote.config.ts";

function minimalConfig(overrides?: Partial<DenoteConfig>): DenoteConfig {
  return {
    name: "Test",
    navigation: [{ title: "Home", href: "/docs/home" }],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// buildJsonLd
// ---------------------------------------------------------------------------

Deno.test("buildJsonLd - defaults to WebSite type", () => {
  const ld = buildJsonLd(minimalConfig(), "A test site");
  assertEquals(ld["@type"], "WebSite");
  assertEquals(ld["@context"], "https://schema.org");
  assertEquals(ld.name, "Test");
  assertEquals(ld.description, "A test site");
});

Deno.test("buildJsonLd - uses jsonLdType when set", () => {
  const config = minimalConfig({
    seo: { jsonLdType: "SoftwareApplication" },
  });
  const ld = buildJsonLd(config, "desc");
  assertEquals(ld["@type"], "SoftwareApplication");
});

Deno.test("buildJsonLd - merges jsonLdExtra properties", () => {
  const config = minimalConfig({
    seo: {
      jsonLdExtra: {
        author: { "@type": "Organization", name: "Acme" },
        license: "MIT",
      },
    },
  });
  const ld = buildJsonLd(config, "desc");
  assertEquals(
    (ld.author as Record<string, string>).name,
    "Acme",
  );
  assertEquals(ld.license, "MIT");
});

Deno.test("buildJsonLd - uses seo.url as url when no pageUrl", () => {
  const config = minimalConfig({ seo: { url: "https://denote.sh" } });
  const ld = buildJsonLd(config, "desc");
  assertEquals(ld.url, "https://denote.sh");
});

Deno.test("buildJsonLd - prefers pageUrl over seo.url", () => {
  const config = minimalConfig({ seo: { url: "https://denote.sh" } });
  const ld = buildJsonLd(config, "desc", "https://denote.sh/docs/intro");
  assertEquals(ld.url, "https://denote.sh/docs/intro");
});

// ---------------------------------------------------------------------------
// buildSitemapXml
// ---------------------------------------------------------------------------

Deno.test("buildSitemapXml - includes changefreq and priority", () => {
  const xml = buildSitemapXml("https://example.com", "/docs", [
    { slug: "intro" },
  ]);
  assertEquals(xml.includes("<changefreq>weekly</changefreq>"), true);
  assertEquals(xml.includes("<priority>1.0</priority>"), true);
  assertEquals(xml.includes("<priority>0.8</priority>"), true);
  assertEquals(xml.includes("<priority>0.6</priority>"), true);
});

Deno.test("buildSitemapXml - uses provided baseUrl", () => {
  const xml = buildSitemapXml("https://denote.sh", "/docs", [
    { slug: "intro" },
  ]);
  assertEquals(xml.includes("<loc>https://denote.sh/</loc>"), true);
  assertEquals(xml.includes("<loc>https://denote.sh/docs</loc>"), true);
  assertEquals(xml.includes("<loc>https://denote.sh/docs/intro</loc>"), true);
});

Deno.test("buildSitemapXml - lists all doc pages", () => {
  const docs = [
    { slug: "intro" },
    { slug: "install" },
    { slug: "guides/advanced" },
  ];
  const xml = buildSitemapXml("https://example.com", "/docs", docs);
  assertEquals(xml.includes("/docs/intro</loc>"), true);
  assertEquals(xml.includes("/docs/install</loc>"), true);
  assertEquals(xml.includes("/docs/guides/advanced</loc>"), true);
});

// ---------------------------------------------------------------------------
// buildRobotsTxt
// ---------------------------------------------------------------------------

Deno.test("buildRobotsTxt - uses baseUrl for sitemap reference", () => {
  const txt = buildRobotsTxt("https://denote.sh");
  assertEquals(txt.includes("Sitemap: https://denote.sh/sitemap.xml"), true);
  assertEquals(txt.includes("Allow: /"), true);
});
