#!/usr/bin/env -S deno run -A
/**
 * Denote MCP Server (Standalone)
 *
 * Serves your documentation as an MCP server so AI agents (Cursor, Claude,
 * ChatGPT, etc.) can search and read your docs as live context.
 *
 * Usage:
 *   deno run -A mcp.ts                     # stdio transport (for local tools)
 *   deno run -A mcp.ts --http --port 3100  # Streamable HTTP transport (for remote)
 */
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createMcpServer, MCP_CORS_HEADERS } from "./lib/mcp.ts";
import { getConfig, getContentDir, getDocsBasePath } from "./lib/config.ts";
import type { DenoteContext } from "./utils.ts";

// Build context from singletons (set by importing denote.config.ts or CLI)
function buildContext(): DenoteContext {
  return {
    config: getConfig(),
    contentDir: getContentDir(),
    docsBasePath: getDocsBasePath(),
  };
}

// ── Transport ───────────────────────────────────────────────

const args = Deno.args;
const useHttp = args.includes("--http");

if (useHttp) {
  const portIdx = args.indexOf("--port");
  const port = portIdx !== -1 ? parseInt(args[portIdx + 1]) : 3100;
  const httpBaseUrl = `http://localhost:${port}`;

  const ctx = buildContext();
  const name = ctx.config.name;
  console.log(
    `🦕 ${name} MCP server (Streamable HTTP) on port ${port}`,
  );
  console.log(`   Endpoint: http://localhost:${port}/mcp`);

  Deno.serve({ port }, async (req: Request) => {
    const url = new URL(req.url);

    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: MCP_CORS_HEADERS });
    }

    // MCP endpoint — stateless: fresh server+transport per request
    if (url.pathname === "/mcp") {
      const server = createMcpServer(buildContext(), httpBaseUrl);
      const transport = new WebStandardStreamableHTTPServerTransport({});
      await server.connect(transport);

      const response = await transport.handleRequest(req);
      for (const [key, value] of Object.entries(MCP_CORS_HEADERS)) {
        if (!response.headers.has(key)) {
          response.headers.set(key, value);
        }
      }
      return response;
    }

    // Health endpoint
    if (url.pathname === "/" || url.pathname === "/health") {
      const currentCtx = buildContext();
      return new Response(
        JSON.stringify({
          name: `${currentCtx.config.name} Docs MCP Server`,
          status: "ok",
          transport: "streamable-http",
          endpoint: "/mcp",
          instructions:
            `Search and read ${currentCtx.config.name} documentation. Use search_docs to find pages, get_doc to read a specific page, or get_all_docs for full context.`,
        }),
        {
          headers: {
            "Content-Type": "application/json",
            ...MCP_CORS_HEADERS,
          },
        },
      );
    }

    return new Response("Not Found", {
      status: 404,
      headers: MCP_CORS_HEADERS,
    });
  });
} else {
  const server = createMcpServer(buildContext());
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
