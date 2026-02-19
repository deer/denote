/**
 * Markdown parsing utilities using @deer/gfm
 *
 * Provides frontmatter parsing and HTML rendering with GitHub Flavored
 * Markdown support, syntax highlighting via lowlight, and single-pass
 * TOC extraction via renderWithMeta.
 */
import { renderWithMeta } from "@deer/gfm";
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
  /** OG image URL for this page (overrides config.seo.ogImage) */
  image?: string;
  /** Short AI-optimized summary for LLM context and embeddings */
  "ai-summary"?: string;
  /** Keywords/tags for AI retrieval and classification */
  "ai-keywords"?: string[];
}

export interface ParsedDoc {
  frontmatter: DocFrontmatter;
  content: string;
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
    if (!frontmatter.title) {
      console.warn(
        "Warning: No title found in frontmatter. Using 'Untitled'.",
      );
      frontmatter.title = "Untitled";
    }
    const content = raw.slice(match[0].length);
    return { frontmatter, content };
  } catch {
    console.warn("Warning: Failed to parse frontmatter YAML. Using defaults.");
    return {
      frontmatter: { title: "Untitled" },
      content: raw,
    };
  }
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

/**
 * Render markdown to HTML and extract TOC in a single pass using @deer/gfm.
 *
 * Features:
 * - GitHub Flavored Markdown (tables, task lists, strikethrough, etc.)
 * - Syntax highlighting via lowlight (highlight.js)
 * - Table of contents extracted from rendered heading IDs
 * - HTML sanitization
 */
export async function renderDoc(
  content: string,
): Promise<{ html: string; toc: TocItem[] }> {
  const result = await renderWithMeta(content, {
    highlighter: "lowlight",
    allowMath: true,
  });

  // Strip the "user-content-" prefix that rehype-sanitize adds to heading IDs,
  // so they match the TOC slugs for anchor navigation.
  const html = result.html.replaceAll('id="user-content-', 'id="');

  return {
    html,
    toc: result.toc.map((entry) => ({
      id: entry.slug,
      title: entry.text,
      level: entry.depth,
    })),
  };
}

// ---------------------------------------------------------------------------
// Document parsing
// ---------------------------------------------------------------------------

/**
 * Parse a full document: frontmatter + body content.
 * Use renderDoc() separately when HTML rendering and TOC are needed.
 */
export function parseDocument(raw: string): ParsedDoc {
  const { frontmatter, content } = parseFrontmatter(raw);
  return { frontmatter, content };
}
