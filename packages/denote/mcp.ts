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
import { createMcpServer, getSiteName, MCP_CORS_HEADERS } from "./lib/mcp.ts";

// ── Transport ───────────────────────────────────────────────

const args = Deno.args;
const useHttp = args.includes("--http");

if (useHttp) {
  const portIdx = args.indexOf("--port");
  const port = portIdx !== -1 ? parseInt(args[portIdx + 1]) : 3100;

  // Session-based: each MCP client gets its own server+transport pair
  const sessions = new Map<
    string,
    WebStandardStreamableHTTPServerTransport
  >();

  const createSessionTransport = async () => {
    const server = createMcpServer();
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: () => crypto.randomUUID(),
      onsessioninitialized: (sessionId) => {
        sessions.set(sessionId, transport);
      },
    });
    transport.onclose = () => {
      const sid = transport.sessionId;
      if (sid) sessions.delete(sid);
    };
    await server.connect(transport);
    return transport;
  };

  const name = getSiteName();
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

    // MCP endpoint
    if (url.pathname === "/mcp") {
      const sessionId = req.headers.get("mcp-session-id");
      let transport;

      if (sessionId && sessions.has(sessionId)) {
        transport = sessions.get(sessionId)!;
      } else if (sessionId) {
        return new Response(
          JSON.stringify({ error: "Session not found" }),
          {
            status: 404,
            headers: {
              "Content-Type": "application/json",
              ...MCP_CORS_HEADERS,
            },
          },
        );
      } else {
        transport = await createSessionTransport();
      }

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
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
