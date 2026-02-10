/**
 * Markdown parsing utilities using @deer/gfm
 *
 * Provides frontmatter parsing, TOC extraction, and HTML rendering
 * with GitHub Flavored Markdown support and syntax highlighting via lowlight.
 */
import { render } from "@deer/gfm";
import { parse as parseYaml } from "jsr:@std/yaml@1";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DocFrontmatter {
  title: string;
  description?: string;
  icon?: string;
  sidebarTitle?: string;
  order?: number;
  /** Short AI-optimized summary for LLM context and embeddings */
  "ai-summary"?: string;
  /** Keywords/tags for AI retrieval and classification */
  "ai-keywords"?: string[];
}

export interface ParsedDoc {
  frontmatter: DocFrontmatter;
  content: string;
  toc: TocItem[];
}

export interface TocItem {
  id: string;
  title: string;
  level: number;
  children?: TocItem[];
}

// ---------------------------------------------------------------------------
// Frontmatter
// ---------------------------------------------------------------------------

const FRONTMATTER_REGEX = /^---\n([\s\S]*?)\n---\n?/;

/**
 * Parse frontmatter from markdown content.
 * Uses @std/yaml for full YAML support.
 */
export function parseFrontmatter(
  raw: string,
): { frontmatter: DocFrontmatter; content: string } {
  const match = raw.match(FRONTMATTER_REGEX);

  if (!match) {
    return {
      frontmatter: { title: "Untitled" },
      content: raw,
    };
  }

  try {
    const yaml = match[1];
    const frontmatter = parseYaml(yaml) as DocFrontmatter;
    const content = raw.slice(match[0].length);
    return { frontmatter, content };
  } catch {
    return {
      frontmatter: { title: "Untitled" },
      content: raw,
    };
  }
}

// ---------------------------------------------------------------------------
// Table of Contents
// ---------------------------------------------------------------------------

/**
 * Generate a URL-friendly slug from text
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

/**
 * Extract table of contents from markdown content.
 * Parses headings and generates slugified IDs.
 */
export function extractToc(content: string): TocItem[] {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const toc: TocItem[] = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const title = match[2].trim();
    const id = slugify(title);

    toc.push({ id, title, level });
  }

  return toc;
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

/**
 * Convert markdown to HTML using @deer/gfm.
 *
 * Features:
 * - GitHub Flavored Markdown (tables, task lists, strikethrough, etc.)
 * - Syntax highlighting via lowlight (highlight.js)
 * - HTML sanitization
 */
export async function markdownToHtml(content: string): Promise<string> {
  return await render(content, {
    highlighter: "lowlight",
    allowMath: true,
  });
}

// ---------------------------------------------------------------------------
// Document parsing
// ---------------------------------------------------------------------------

/**
 * Parse a full document: frontmatter + TOC + body content.
 */
export function parseDocument(raw: string): ParsedDoc {
  const { frontmatter, content } = parseFrontmatter(raw);
  const toc = extractToc(content);

  return {
    frontmatter,
    content,
    toc,
  };
}
