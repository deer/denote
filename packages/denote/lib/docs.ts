/**
 * Documentation loader utilities
 *
 * Features an in-memory content cache that avoids redundant disk I/O and
 * markdown parsing. The cache is populated on first access and invalidated
 * automatically via Deno.watchFs in development. In production the cache
 * lives for the lifetime of the process (content is immutable after deploy).
 */
import {
  type ParsedDoc,
  parseDocument,
  renderDoc,
  type TocItem,
} from "./markdown.ts";
import type { NavItem } from "../denote.config.ts";
import type { DenoteContext } from "../utils.ts";
import { resolve } from "@std/path";

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
    clearSearchIndexCache();
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
  clearSearchIndexCache();
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
      } catch {
        // Watcher was closed — expected during shutdown
      }
    })();
  } catch {
    // watchFs not available — cache is still valid, just won't auto-refresh
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
 */
export async function getAllDocs(
  denoteContext: DenoteContext,
): Promise<DocPage[]> {
  if (allDocsLoaded && docCache.size > 0) {
    return Array.from(docCache.values());
  }

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
          `Warning: content directory not found at ${docsDir}. No docs will be served.`,
        );
      }
    }
  }

  await walkDir(docsDir);
  allDocsLoaded = true;
  startWatcher(denoteContext.contentDir);
  return docs;
}

// ---------------------------------------------------------------------------
// Navigation helpers
// ---------------------------------------------------------------------------

/**
 * Flatten navigation tree into an ordered list of page links
 */
export interface NavLink {
  title: string;
  href: string;
}

function flattenNav(items: NavItem[]): NavLink[] {
  const result: NavLink[] = [];
  for (const item of items) {
    if (item.href) {
      result.push({ title: item.title, href: item.href });
    }
    if (item.children) {
      result.push(...flattenNav(item.children));
    }
  }
  return result;
}

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

export async function buildSearchIndex(
  denoteContext: DenoteContext,
): Promise<SearchItem[]> {
  if (cachedSearchIndex) return cachedSearchIndex;

  const docs = await getAllDocs(denoteContext);

  cachedSearchIndex = docs.map((doc) => ({
    title: doc.frontmatter.title,
    description: doc.frontmatter.description,
    aiSummary: doc.frontmatter["ai-summary"],
    aiKeywords: doc.frontmatter["ai-keywords"],
    slug: doc.slug,
    content: doc.content.slice(0, 500), // First 500 chars for search preview
  }));

  return cachedSearchIndex;
}

/** Clear the search index cache (useful for testing or after content changes) */
export function clearSearchIndexCache(): void {
  cachedSearchIndex = null;
}
