/**
 * AI Agent serving utilities
 *
 * Generates llms.txt and structured content for AI consumption.
 * See: https://llmstxt.org/
 */
import { getAllDocs, onContentInvalidated } from "./docs.ts";
import type { DenoteContext } from "../utils.ts";
import { extractToc } from "@deer/gfm/parse";

// ---------------------------------------------------------------------------
// In-memory cache + in-flight promise dedup
// ---------------------------------------------------------------------------

/** Cache key for llms.txt includes the baseUrl since output varies by origin. */
let cachedLlmsTxt: string | null = null;
let cachedLlmsTxtBaseUrl: string = "";
let buildingLlmsTxt: Promise<string> | null = null;

let cachedDocsJson: object | null = null;
let cachedDocsJsonBaseUrl: string | undefined = undefined;
let buildingDocsJson: Promise<object> | null = null;

/** Clear all AI output caches. Called on content invalidation via hook. */
export function clearAiCache(): void {
  cachedLlmsTxt = null;
  cachedLlmsTxtBaseUrl = "";
  buildingLlmsTxt = null;
  cachedDocsJson = null;
  cachedDocsJsonBaseUrl = undefined;
  buildingDocsJson = null;
}

// Register with the content invalidation chain so caches clear automatically.
onContentInvalidated(clearAiCache);

// ---------------------------------------------------------------------------
// llms.txt
// ---------------------------------------------------------------------------

/**
 * Generate llms.txt — a standard file that tells AI agents
 * what this documentation contains and how to access it.
 * Cached in memory; invalidated when content changes.
 */
export function generateLlmsTxt(
  denoteContext: DenoteContext,
  baseUrl: string,
): Promise<string> {
  if (cachedLlmsTxt && cachedLlmsTxtBaseUrl === baseUrl) {
    return Promise.resolve(cachedLlmsTxt);
  }

  // baseUrl changed — invalidate stale cache and in-flight build
  if (cachedLlmsTxtBaseUrl !== baseUrl) {
    cachedLlmsTxt = null;
    buildingLlmsTxt = null;
    cachedLlmsTxtBaseUrl = baseUrl;
  }

  return buildingLlmsTxt ??= _generateLlmsTxtInner(denoteContext, baseUrl);
}

async function _generateLlmsTxtInner(
  denoteContext: DenoteContext,
  baseUrl: string,
): Promise<string> {
  try {
    const config = denoteContext.config;
    const docs = await getAllDocs(denoteContext);

    const lines: string[] = [
      `# ${config.name}`,
      "",
      `> ${config.name} documentation`,
      "",
      "## Docs",
      "",
    ];

    for (const doc of docs) {
      const desc = doc.frontmatter["ai-summary"] ||
        doc.frontmatter.description ||
        doc.frontmatter.title;
      lines.push(
        `- [${doc.frontmatter.title}](${baseUrl}/docs/${doc.slug}): ${desc}`,
      );
    }

    lines.push("");
    lines.push("## API");
    lines.push("");
    lines.push(
      `- [Full docs as markdown](${baseUrl}/llms-full.txt): Complete documentation in a single markdown file`,
    );
    lines.push(
      `- [Structured JSON](${baseUrl}/api/docs): All documentation pages as structured JSON`,
    );

    // Advertise MCP endpoint when enabled
    if (config.ai?.mcp) {
      lines.push("");
      lines.push("## MCP (Model Context Protocol)");
      lines.push("");
      lines.push(
        `For richer AI integration, connect via MCP at \`${baseUrl}/mcp\` (Streamable HTTP transport).`,
      );
      lines.push(
        "Tools: search_docs, get_doc, get_all_docs. Resources: docs://index, docs://{slug}.",
      );
    }

    cachedLlmsTxt = lines.join("\n");
    cachedLlmsTxtBaseUrl = baseUrl;
    return cachedLlmsTxt;
  } finally {
    buildingLlmsTxt = null;
  }
}

// ---------------------------------------------------------------------------
// Structured JSON
// ---------------------------------------------------------------------------

/**
 * Get all docs as structured JSON for API consumption.
 * Cached in memory; invalidated when content changes.
 */
export function getDocsJson(
  denoteContext: DenoteContext,
  baseUrl?: string,
): Promise<object> {
  if (cachedDocsJson && cachedDocsJsonBaseUrl === baseUrl) {
    return Promise.resolve(cachedDocsJson);
  }

  // baseUrl changed — invalidate stale cache and in-flight build
  if (cachedDocsJsonBaseUrl !== baseUrl) {
    cachedDocsJson = null;
    buildingDocsJson = null;
    cachedDocsJsonBaseUrl = baseUrl;
  }

  return buildingDocsJson ??= _getDocsJsonInner(denoteContext, baseUrl);
}

async function _getDocsJsonInner(
  denoteContext: DenoteContext,
  baseUrl?: string,
): Promise<object> {
  try {
    const config = denoteContext.config;
    const docs = await getAllDocs(denoteContext);

    const result: Record<string, unknown> = {
      name: config.name,
      pages: docs.map((doc) => ({
        slug: doc.slug,
        title: doc.frontmatter.title,
        description: doc.frontmatter.description,
        aiSummary: doc.frontmatter["ai-summary"],
        aiKeywords: doc.frontmatter["ai-keywords"],
        content: doc.content,
        headings: extractToc(doc.content).map((t) => ({
          level: t.depth,
          title: t.text,
          id: t.slug,
        })),
      })),
    };

    // Progressive disclosure: point consumers to richer access layers
    if (baseUrl) {
      result.llmsFullTxt = `${baseUrl}/llms-full.txt`;
      if (config.ai?.mcp) {
        result.mcp = {
          endpoint: `${baseUrl}/mcp`,
          transport: "Streamable HTTP",
          tools: ["search_docs", "get_doc", "get_all_docs"],
        };
      }
    }

    cachedDocsJson = result;
    cachedDocsJsonBaseUrl = baseUrl;
    return result;
  } finally {
    buildingDocsJson = null;
  }
}
