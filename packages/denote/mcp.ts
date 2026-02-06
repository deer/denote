#!/usr/bin/env -S deno run -A
/**
 * Denote MCP Server
 *
 * Serves your documentation as an MCP server so AI agents (Cursor, Claude,
 * ChatGPT, etc.) can search and read your docs as live context.
 *
 * Usage:
 *   deno run -A mcp.ts                     # stdio transport (for local tools)
 *   deno run -A mcp.ts --http --port 3100  # Streamable HTTP transport (for remote)
 */
import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { buildSearchIndex, getAllDocs, getDoc } from "./lib/docs.ts";
import { getConfig } from "./docs.config.ts";
import { z } from "zod";

// Get site name from config (defaults to "Denote" if not set)
const getSiteName = () => getConfig()?.name ?? "Denote";

const server = new McpServer({
  name: `${getSiteName()} Docs`,
  version: "1.0.0",
});

// ── Resources ───────────────────────────────────────────────

// List all doc pages as resources
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

// Individual doc pages as resources
server.resource(
  "doc-page",
  new ResourceTemplate("docs://{slug}", { list: undefined }),
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

// Search across all documentation
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
        parts.push("", `${r.content.slice(0, 300)}...`);
        return parts.join("\n");
      })
      .join("\n\n---\n\n");

    return { content: [{ type: "text" as const, text }] };
  },
);

// Get a specific documentation page
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
        content: [{ type: "text" as const, text: `Page not found: ${slug}` }],
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

// Get all docs as a single context blob
server.tool(
  "get_all_docs",
  "Get the entire documentation as a single text. Use this when you need comprehensive context about the project.",
  {},
  async () => {
    const docs = await getAllDocs();
    const text = docs
      .map((d) => `# ${d.frontmatter.title}\n\n${d.content}`)
      .join("\n\n---\n\n");

    return { content: [{ type: "text" as const, text }] };
  },
);

// ── Transport ───────────────────────────────────────────────

const args = Deno.args;
const useHttp = args.includes("--http");

if (useHttp) {
  const portIdx = args.indexOf("--port");
  const port = portIdx !== -1 ? parseInt(args[portIdx + 1]) : 3100;

  // Stateless Streamable HTTP transport — works on Deno via Web Standard APIs
  const transport = new WebStandardStreamableHTTPServerTransport();
  await server.connect(transport);

  console.log(
    `🦕 ${getSiteName()} MCP server (Streamable HTTP) on port ${port}`,
  );
  console.log(`   Endpoint: http://localhost:${port}/mcp`);

  Deno.serve({ port }, async (req: Request) => {
    const url = new URL(req.url);

    // CORS headers for cross-origin MCP clients
    const corsHeaders: Record<string, string> = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, mcp-session-id, Last-Event-ID, mcp-protocol-version",
      "Access-Control-Expose-Headers": "mcp-session-id, mcp-protocol-version",
    };

    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // MCP endpoint — delegate to transport
    if (url.pathname === "/mcp") {
      const response = await transport.handleRequest(req);
      // Add CORS headers to transport response
      for (const [key, value] of Object.entries(corsHeaders)) {
        if (!response.headers.has(key)) {
          response.headers.set(key, value);
        }
      }
      return response;
    }

    // Health/info endpoint
    if (url.pathname === "/" || url.pathname === "/health") {
      return new Response(
        JSON.stringify({
          name: `${getSiteName()} Docs MCP Server`,
          status: "ok",
          transport: "streamable-http",
          endpoint: "/mcp",
          instructions:
            `Search and read ${getSiteName()} documentation. Use search_docs to find pages, get_doc to read a specific page, or get_all_docs for full context.`,
        }),
        {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        },
      );
    }

    return new Response("Not Found", { status: 404, headers: corsHeaders });
  });
} else {
  // Default: stdio transport for local tool integration
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
