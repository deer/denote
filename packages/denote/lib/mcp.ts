/**
 * Denote MCP Server Factory
 *
 * Creates an MCP server instance with documentation tools and resources.
 * Used by both the standalone mcp.ts script and the integrated Fresh route.
 */
import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { buildSearchIndex, getAllDocs, getDoc } from "./docs.ts";
import { getConfig } from "./config.ts";
import { z } from "zod";

/** Get site name from config, with fallback */
export function getSiteName(): string {
  try {
    return getConfig()?.name ?? "Denote";
  } catch {
    return "Denote";
  }
}

/**
 * Create a configured MCP server with documentation tools and resources.
 */
export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: `${getSiteName()} Docs`,
    version: "1.0.0",
  });

  // ── Resources ───────────────────────────────────────────────

  server.resource(
    "docs-index",
    "docs://index",
    async (uri) => {
      const docs = await getAllDocs();
      const listing = docs
        .map((d) =>
          `- ${d.frontmatter.title} (docs://${d.slug}): ${
            d.frontmatter["ai-summary"] || d.frontmatter.description || ""
          }`
        )
        .join("\n");

      return {
        contents: [{
          uri: uri.href,
          mimeType: "text/plain",
          text: `# ${getSiteName()} Documentation Index\n\n${listing}`,
        }],
      };
    },
  );

  server.resource(
    "doc-page",
    new ResourceTemplate("docs://{slug}", {
      list: async () => {
        const docs = await getAllDocs();
        return {
          resources: docs.map((d) => ({
            uri: `docs://${d.slug}`,
            name: d.frontmatter.title,
            description: d.frontmatter["ai-summary"] ||
              d.frontmatter.description || undefined,
          })),
        };
      },
    }),
    async (uri, { slug }) => {
      const doc = await getDoc(slug as string);
      if (!doc) {
        return {
          contents: [{
            uri: uri.href,
            mimeType: "text/plain",
            text: `Document not found: ${slug}`,
          }],
        };
      }

      const meta: string[] = [];
      if (doc.frontmatter.description) {
        meta.push(`> ${doc.frontmatter.description}`);
      }
      if (doc.frontmatter["ai-summary"]) {
        meta.push(`> AI Summary: ${doc.frontmatter["ai-summary"]}`);
      }
      if (
        doc.frontmatter["ai-keywords"] &&
        doc.frontmatter["ai-keywords"].length > 0
      ) {
        meta.push(
          `> Keywords: ${doc.frontmatter["ai-keywords"].join(", ")}`,
        );
      }
      const metaBlock = meta.length > 0 ? meta.join("\n") + "\n\n" : "";

      return {
        contents: [{
          uri: uri.href,
          mimeType: "text/markdown",
          text: `# ${doc.frontmatter.title}\n\n${metaBlock}${doc.content}`,
        }],
      };
    },
  );

  // ── Tools ───────────────────────────────────────────────────

  server.tool(
    "search_docs",
    "Search the documentation for a query. Returns matching page titles, descriptions, and content snippets.",
    { query: z.string().describe("Search query") },
    async ({ query }: { query: string }) => {
      const index = await buildSearchIndex();
      const q = query.toLowerCase();

      const results = index
        .filter(
          (item) =>
            item.title.toLowerCase().includes(q) ||
            item.content.toLowerCase().includes(q) ||
            item.description?.toLowerCase().includes(q) ||
            item.aiSummary?.toLowerCase().includes(q) ||
            item.aiKeywords?.some((k) => k.toLowerCase().includes(q)),
        )
        .slice(0, 10);

      if (results.length === 0) {
        return {
          content: [{
            type: "text" as const,
            text: `No results found for "${query}"`,
          }],
        };
      }

      const text = results
        .map((r) => {
          const parts = [`## ${r.title}`, `Slug: ${r.slug}`];
          if (r.description) parts.push(r.description);
          if (r.aiSummary) parts.push(`AI Summary: ${r.aiSummary}`);
          if (r.aiKeywords && r.aiKeywords.length > 0) {
            parts.push(`Keywords: ${r.aiKeywords.join(", ")}`);
          }
          // Show snippet around the match position, not just the beginning
          const contentLower = r.content.toLowerCase();
          const matchIdx = contentLower.indexOf(q);
          let snippet: string;
          if (matchIdx >= 0) {
            const start = Math.max(0, matchIdx - 100);
            const end = Math.min(r.content.length, matchIdx + q.length + 200);
            snippet = (start > 0 ? "..." : "") +
              r.content.slice(start, end) +
              (end < r.content.length ? "..." : "");
          } else {
            snippet = r.content.slice(0, 300) +
              (r.content.length > 300 ? "..." : "");
          }
          parts.push("", snippet);
          return parts.join("\n");
        })
        .join("\n\n---\n\n");

      return { content: [{ type: "text" as const, text }] };
    },
  );

  server.tool(
    "get_doc",
    "Get the full content of a documentation page by its slug.",
    {
      slug: z.string().describe(
        "Page slug (e.g. 'introduction', 'installation')",
      ),
    },
    async ({ slug }: { slug: string }) => {
      const doc = await getDoc(slug);
      if (!doc) {
        return {
          content: [{
            type: "text" as const,
            text: `Page not found: ${slug}`,
          }],
        };
      }

      return {
        content: [{
          type: "text" as const,
          text: `# ${doc.frontmatter.title}\n\n${
            doc.frontmatter.description
              ? `> ${doc.frontmatter.description}\n\n`
              : ""
          }${doc.content}`,
        }],
      };
    },
  );

  server.tool(
    "get_all_docs",
    "Get the entire documentation as a single text. Warning: may be large for big doc sites. Consider search_docs or get_doc first.",
    {},
    async () => {
      const docs = await getAllDocs();
      const body = docs
        .map((d) => `# ${d.frontmatter.title}\n\n${d.content}`)
        .join("\n\n---\n\n");

      const charCount = body.length;
      const preamble = `> ${docs.length} documents, ~${
        Math.round(charCount / 4)
      } tokens\n\n`;

      return { content: [{ type: "text" as const, text: preamble + body }] };
    },
  );

  return server;
}

// ── CORS headers for MCP endpoint ─────────────────────────────

export const MCP_CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, mcp-session-id, Last-Event-ID, mcp-protocol-version",
  "Access-Control-Expose-Headers": "mcp-session-id, mcp-protocol-version",
};
