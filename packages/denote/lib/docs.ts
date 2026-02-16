/**
 * Documentation loader utilities
 */
import { type ParsedDoc, parseDocument } from "./markdown.ts";
import type { NavItem } from "../denote.config.ts";
import { getConfig, getContentDir } from "./config.ts";
import { resolve } from "jsr:@std/path@1";

export interface DocPage extends ParsedDoc {
  slug: string;
  path: string;
}

/**
 * Get a single document by slug
 */
export async function getDoc(slug: string): Promise<DocPage | null> {
  const docsDir = getContentDir();

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
      const doc = parseDocument(content);
      return {
        ...doc,
        slug,
        path,
      };
    } catch {
      // File not found, try next path
    }
  }

  return null;
}

/**
 * Get all documents
 */
export async function getAllDocs(): Promise<DocPage[]> {
  const docs: DocPage[] = [];

  const docsDir = getContentDir();

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
          const doc = parseDocument(content);

          docs.push({
            ...doc,
            slug,
            path,
          });
        }
      }
    } catch {
      // Directory doesn't exist
    }
  }

  await walkDir(docsDir);
  return docs;
}

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
): { prev: NavLink | null; next: NavLink | null } {
  const pages = flattenNav(getConfig().navigation);
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

export function getBreadcrumbs(currentPath: string): Breadcrumb[] {
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

  findPath(getConfig().navigation, []);
  return crumbs;
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
let searchIndexBuiltAt = 0;
const SEARCH_INDEX_TTL_MS = 60_000; // 1 minute TTL

export async function buildSearchIndex(): Promise<SearchItem[]> {
  const now = Date.now();
  if (cachedSearchIndex && (now - searchIndexBuiltAt) < SEARCH_INDEX_TTL_MS) {
    return cachedSearchIndex;
  }

  const docs = await getAllDocs();

  cachedSearchIndex = docs.map((doc) => ({
    title: doc.frontmatter.title,
    description: doc.frontmatter.description,
    aiSummary: doc.frontmatter["ai-summary"],
    aiKeywords: doc.frontmatter["ai-keywords"],
    slug: doc.slug,
    content: doc.content.slice(0, 500), // First 500 chars for search preview
  }));
  searchIndexBuiltAt = now;

  return cachedSearchIndex;
}

/** Clear the search index cache (useful for testing) */
export function clearSearchIndexCache(): void {
  cachedSearchIndex = null;
  searchIndexBuiltAt = 0;
}
