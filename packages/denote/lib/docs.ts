/**
 * Documentation loader utilities
 *
 * Features an in-memory content cache that avoids redundant disk I/O and
 * markdown parsing. The cache is populated on first access and invalidated
 * automatically via Deno.watchFs in development. In production the cache
 * lives for the lifetime of the process (content is immutable after deploy).
 *
 * Also builds the serialized MiniSearch index served at `/api/search` via
 * {@linkcode buildMiniSearchJSON}. The index is cached alongside the doc
 * cache and invalidated on content changes.
 */
import {
  type ParsedDoc,
  parseDocument,
  renderDoc,
  type TocItem,
} from "./markdown.ts";
import type { NavItem } from "../denote.config.ts";
import type { DenoteContext } from "../utils.ts";
import { clearSitemapCache } from "./seo.ts";
import { resolve } from "@std/path";
import { flattenNav, type NavLink } from "./nav.ts";
import MiniSearch from "minisearch";
import { SEARCH_OPTIONS } from "./search-options.ts";
export { SEARCH_OPTIONS } from "./search-options.ts";

export interface DocPage extends ParsedDoc {
  slug: string;
  path: string;
}

/** Cached rendered output for a single document. */
interface RenderedDoc {
  doc: DocPage;
  html: string;
  toc: TocItem[];
}

// ---------------------------------------------------------------------------
// Content cache
// ---------------------------------------------------------------------------

/** slug → cached doc (parsed frontmatter + raw markdown) */
const docCache = new Map<string, DocPage>();

/** slug → cached rendered HTML + TOC */
const renderCache = new Map<string, RenderedDoc>();

/** Whether the full doc list has been loaded at least once. */
let allDocsLoaded = false;

// In-flight promise deduplication: concurrent callers share the same build.
let buildingAllDocs: Promise<DocPage[]> | null = null;
let buildingSearchIndex: Promise<SearchItem[]> | null = null;
let buildingMiniSearch: Promise<MiniSearch<SearchItem>> | null = null;
let buildingMiniSearchJSON: Promise<string> | null = null;
let buildingFullDocs: Promise<string> | null = null;

/** Hooks called on content invalidation (used by ai.ts to clear its caches). */
const invalidationHooks: (() => void)[] = [];

/** Register a callback to run whenever content is invalidated. */
export function onContentInvalidated(fn: () => void): void {
  invalidationHooks.push(fn);
}

/** Active file watcher (if any). */
let watcher: Deno.FsWatcher | null = null;

/**
 * Invalidate caches for a specific file path, or everything if path is null.
 */
function invalidate(filePath?: string): void {
  if (!filePath) {
    docCache.clear();
    renderCache.clear();
    allDocsLoaded = false;
    buildingAllDocs = null;
    clearSearchIndexCache();
    clearFullDocsCache();
    for (const fn of invalidationHooks) fn();
    clearSitemapCache();
    return;
  }

  // Find which slug(s) map to this file path
  for (const [slug, cached] of docCache) {
    if (cached.path === filePath) {
      docCache.delete(slug);
      renderCache.delete(slug);
    }
  }
  allDocsLoaded = false;
  buildingAllDocs = null;
  clearSearchIndexCache();
  clearFullDocsCache();
  for (const fn of invalidationHooks) fn();
  clearSitemapCache();
}

/**
 * Start watching the content directory for changes.
 * Only runs once; safe to call multiple times.
 * Skipped in test environments to avoid resource leaks.
 */
function startWatcher(contentDir: string): void {
  // Don't start watcher in tests or if already running
  if (watcher || Deno.env.get("DENO_TESTING") === "1") return;

  // Deno.watchFs may not be available in all environments (e.g. Deno Deploy)
  try {
    watcher = Deno.watchFs(contentDir, { recursive: true });

    (async () => {
      try {
        for await (const event of watcher!) {
          if (
            event.kind === "modify" || event.kind === "create" ||
            event.kind === "remove"
          ) {
            for (const path of event.paths) {
              if (path.endsWith(".md")) {
                invalidate(path);
              }
            }
          }
        }
      } catch (e) {
        // Watcher was closed — expected during shutdown
        if (!(e instanceof Deno.errors.BadResource)) {
          console.error("[denote] File watcher error:", e);
        }
      }
    })();
  } catch (e) {
    // watchFs not available — cache is still valid, just won't auto-refresh
    console.warn("[denote] File watcher unavailable:", e);
    watcher = null;
  }
}

/**
 * Stop the file watcher and clear all caches.
 * Useful for cleanup in tests or graceful shutdown.
 */
export function stopWatcher(): void {
  if (watcher) {
    watcher.close();
    watcher = null;
  }
}

// ---------------------------------------------------------------------------
// Document loading
// ---------------------------------------------------------------------------

/**
 * Get a single document by slug (cached).
 */
export async function getDoc(
  slug: string,
  denoteContext: DenoteContext,
): Promise<DocPage | null> {
  // Return from cache if available
  const cached = docCache.get(slug);
  if (cached) return cached;

  const docsDir = denoteContext.contentDir;

  // Path traversal guard: ensure slug resolves within docsDir
  const resolvedBase = resolve(docsDir);
  if (
    !resolve(docsDir, slug).startsWith(resolvedBase + "/") &&
    resolve(docsDir, slug) !== resolvedBase
  ) {
    return null;
  }

  const paths = [
    `${docsDir}/${slug}.md`,
    `${docsDir}/${slug}/index.md`,
  ];

  for (const path of paths) {
    try {
      const content = await Deno.readTextFile(path);
      const doc: DocPage = {
        ...parseDocument(content),
        slug,
        path,
      };
      docCache.set(slug, doc);
      startWatcher(denoteContext.contentDir);
      return doc;
    } catch {
      // File not found, try next path
    }
  }

  return null;
}

/**
 * Get rendered HTML + TOC for a document (cached).
 * Avoids re-rendering markdown on every page load.
 */
export async function getRenderedDoc(
  slug: string,
  denoteContext: DenoteContext,
): Promise<{ doc: DocPage; html: string; toc: TocItem[] } | null> {
  const cached = renderCache.get(slug);
  if (cached) return cached;

  const doc = await getDoc(slug, denoteContext);
  if (!doc) return null;

  const { html, toc } = await renderDoc(doc.content);
  const result: RenderedDoc = { doc, html, toc };
  renderCache.set(slug, result);
  return result;
}

/**
 * Get all documents (cached).
 * Uses promise dedup so concurrent cold-start callers share one build.
 */
export function getAllDocs(
  denoteContext: DenoteContext,
): Promise<DocPage[]> {
  if (allDocsLoaded && docCache.size > 0) {
    return Promise.resolve(Array.from(docCache.values()));
  }

  return buildingAllDocs ??= _getAllDocsInner(denoteContext);
}

async function _getAllDocsInner(
  denoteContext: DenoteContext,
): Promise<DocPage[]> {
  const docs: DocPage[] = [];
  const docsDir = denoteContext.contentDir;

  async function walkDir(dir: string, prefix = ""): Promise<void> {
    try {
      for await (const entry of Deno.readDir(dir)) {
        const path = `${dir}/${entry.name}`;

        if (entry.isDirectory) {
          await walkDir(path, `${prefix}${entry.name}/`);
        } else if (entry.name.endsWith(".md")) {
          const slug = entry.name === "index.md"
            ? prefix.slice(0, -1) || "index"
            : `${prefix}${entry.name.replace(".md", "")}`;

          const content = await Deno.readTextFile(path);
          const doc: DocPage = {
            ...parseDocument(content),
            slug,
            path,
          };

          docs.push(doc);
          docCache.set(slug, doc);
        }
      }
    } catch {
      if (dir === docsDir) {
        console.warn(
          `[denote] Content directory not found at ${docsDir}. No docs will be served.`,
        );
      }
    }
  }

  try {
    await walkDir(docsDir);
    allDocsLoaded = true;
    startWatcher(denoteContext.contentDir);
    return docs;
  } finally {
    buildingAllDocs = null;
  }
}

// ---------------------------------------------------------------------------
// Navigation helpers
// ---------------------------------------------------------------------------

/**
 * Get previous and next pages for a given path
 */
export function getPrevNext(
  currentPath: string,
  denoteContext: DenoteContext,
): { prev: NavLink | null; next: NavLink | null } {
  const pages = flattenNav(denoteContext.config.navigation);
  const index = pages.findIndex((p) => p.href === currentPath);
  if (index === -1) return { prev: null, next: null };
  return {
    prev: index > 0 ? pages[index - 1] : null,
    next: index < pages.length - 1 ? pages[index + 1] : null,
  };
}

/**
 * Build breadcrumb trail for a given path
 */
export interface Breadcrumb {
  title: string;
  href?: string;
}

export function getBreadcrumbs(
  currentPath: string,
  denoteContext: DenoteContext,
): Breadcrumb[] {
  const crumbs: Breadcrumb[] = [];

  function findPath(items: NavItem[], parents: Breadcrumb[]): boolean {
    for (const item of items) {
      if (item.children) {
        const sectionCrumb: Breadcrumb = { title: item.title };
        if (findPath(item.children, [...parents, sectionCrumb])) {
          return true;
        }
      }
      if (item.href === currentPath) {
        crumbs.push(...parents, { title: item.title, href: item.href });
        return true;
      }
    }
    return false;
  }

  findPath(denoteContext.config.navigation, []);
  return crumbs;
}

// ---------------------------------------------------------------------------
// Search index
// ---------------------------------------------------------------------------

/**
 * Strip common markdown syntax for cleaner search indexing.
 * Removes headings, bold, italic, links, inline code backticks,
 * images, and horizontal rules.
 */
export function stripMarkdown(md: string): string {
  return md
    // Images ![alt](url)
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    // Links [text](url)
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    // Inline code
    .replace(/`([^`]+)`/g, "$1")
    // Fenced code block markers (``` or ~~~) with optional language
    .replace(/^(`{3,}|~{3,})\w*$/gm, "")
    // Bold+italic ***text*** or ___text___
    .replace(/(\*{3}|_{3})(.+?)\1/g, "$2")
    // Bold **text** or __text__
    .replace(/(\*{2}|_{2})(.+?)\1/g, "$2")
    // Italic *text* or _text_ (avoid matching horizontal rules)
    .replace(/(?<!\*)(\*|_)(?!\s)(.+?)(?<!\s)\1(?!\*)/g, "$2")
    // Headings (# at start of line)
    .replace(/^#{1,6}\s+/gm, "")
    // Horizontal rules
    .replace(/^[-*_]{3,}\s*$/gm, "")
    // HTML tags
    .replace(/<[^>]+>/g, "")
    // Collapse whitespace
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Build search index from all docs (cached in memory)
 */
export interface SearchItem {
  title: string;
  description?: string;
  aiSummary?: string;
  aiKeywords?: string[];
  slug: string;
  content: string;
}

let cachedSearchIndex: SearchItem[] | null = null;

/**
 * Build search index. Uses promise dedup for concurrent callers.
 */
export function buildSearchIndex(
  denoteContext: DenoteContext,
): Promise<SearchItem[]> {
  if (cachedSearchIndex) return Promise.resolve(cachedSearchIndex);

  return buildingSearchIndex ??= _buildSearchIndexInner(denoteContext);
}

async function _buildSearchIndexInner(
  denoteContext: DenoteContext,
): Promise<SearchItem[]> {
  try {
    const docs = await getAllDocs(denoteContext);

    cachedSearchIndex = docs.map((doc) => ({
      title: doc.frontmatter.title,
      description: doc.frontmatter.description,
      aiSummary: doc.frontmatter["ai-summary"],
      aiKeywords: doc.frontmatter["ai-keywords"],
      slug: doc.slug,
      content: stripMarkdown(doc.content),
    }));

    return cachedSearchIndex;
  } finally {
    buildingSearchIndex = null;
  }
}

let cachedMiniSearch: MiniSearch<SearchItem> | null = null;
let cachedMiniSearchJSON: string | null = null;

/**
 * Get a live MiniSearch instance for querying (cached).
 * Uses promise dedup for concurrent callers.
 */
export function getMiniSearchInstance(
  denoteContext: DenoteContext,
): Promise<MiniSearch<SearchItem>> {
  if (cachedMiniSearch) return Promise.resolve(cachedMiniSearch);

  return buildingMiniSearch ??= _getMiniSearchInner(denoteContext);
}

async function _getMiniSearchInner(
  denoteContext: DenoteContext,
): Promise<MiniSearch<SearchItem>> {
  try {
    const items = await buildSearchIndex(denoteContext);
    cachedMiniSearch = new MiniSearch<SearchItem>({
      ...SEARCH_OPTIONS,
      extractField: (doc, fieldName) => {
        if (fieldName === "aiKeywords") return doc.aiKeywords?.join(" ") ?? "";
        return (doc[fieldName as keyof SearchItem] as string) ?? "";
      },
    });
    cachedMiniSearch.addAll(items);
    return cachedMiniSearch;
  } finally {
    buildingMiniSearch = null;
  }
}

/** Get MiniSearch instance and the source items it was built from (single await). */
export async function getMiniSearchWithItems(
  denoteContext: DenoteContext,
): Promise<{ ms: MiniSearch<SearchItem>; items: SearchItem[] }> {
  const ms = await getMiniSearchInstance(denoteContext);
  return { ms, items: cachedSearchIndex! };
}

/**
 * Build MiniSearch JSON for client-side search (cached).
 * Uses promise dedup for concurrent callers.
 */
export function buildMiniSearchJSON(
  denoteContext: DenoteContext,
): Promise<string> {
  if (cachedMiniSearchJSON) return Promise.resolve(cachedMiniSearchJSON);

  return buildingMiniSearchJSON ??= _buildMiniSearchJSONInner(denoteContext);
}

async function _buildMiniSearchJSONInner(
  denoteContext: DenoteContext,
): Promise<string> {
  try {
    const ms = await getMiniSearchInstance(denoteContext);
    cachedMiniSearchJSON = JSON.stringify(ms);
    return cachedMiniSearchJSON;
  } finally {
    buildingMiniSearchJSON = null;
  }
}

/** Clear the search index cache (useful for testing or after content changes) */
export function clearSearchIndexCache(): void {
  cachedSearchIndex = null;
  cachedMiniSearch = null;
  cachedMiniSearchJSON = null;
  buildingSearchIndex = null;
  buildingMiniSearch = null;
  buildingMiniSearchJSON = null;
}

// ---------------------------------------------------------------------------
// Full docs generation (moved from ai.ts to break circular dependency)
// ---------------------------------------------------------------------------

let cachedFullDocs: string | null = null;

/**
 * Generate full markdown dump of all docs — optimized for AI context windows.
 * Result is cached in memory and cleared when content changes.
 * Uses promise dedup for concurrent callers.
 */
export function generateFullDocs(
  denoteContext: DenoteContext,
): Promise<string> {
  if (cachedFullDocs) return Promise.resolve(cachedFullDocs);

  return buildingFullDocs ??= _generateFullDocsInner(denoteContext);
}

async function _generateFullDocsInner(
  denoteContext: DenoteContext,
): Promise<string> {
  try {
    const config = denoteContext.config;
    const docs = await getAllDocs(denoteContext);

    const sections: string[] = [
      `# ${config.name} — Complete Documentation`,
      "",
    ];

    for (const doc of docs) {
      sections.push(`---`);
      sections.push("");
      sections.push(`## ${doc.frontmatter.title}`);
      if (doc.frontmatter["ai-summary"]) {
        sections.push("");
        sections.push(`*${doc.frontmatter["ai-summary"]}*`);
      } else if (doc.frontmatter.description) {
        sections.push("");
        sections.push(`*${doc.frontmatter.description}*`);
      }
      if (
        doc.frontmatter["ai-keywords"] &&
        doc.frontmatter["ai-keywords"].length > 0
      ) {
        sections.push("");
        sections.push(
          `Keywords: ${doc.frontmatter["ai-keywords"].join(", ")}`,
        );
      }
      sections.push("");
      sections.push(doc.content);
      sections.push("");
    }

    cachedFullDocs = sections.join("\n");
    return cachedFullDocs;
  } finally {
    buildingFullDocs = null;
  }
}

/** Clear the full docs cache (called on content invalidation) */
export function clearFullDocsCache(): void {
  cachedFullDocs = null;
  buildingFullDocs = null;
}
