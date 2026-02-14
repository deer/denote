import "./test_config.ts"; // side-effect: sets up config for tests
import {
  assertEquals,
  assertNotEquals,
  assertStringIncludes,
} from "jsr:@std/assert@1";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createMcpServer, getSiteName, MCP_CORS_HEADERS } from "./mcp.ts";
import { clearSearchIndexCache } from "./docs.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

/** Extract text from callTool result */
function toolText(result: Any): string {
  return result.content[0].text;
}

/** Extract text from readResource result */
function resourceText(result: Any): string {
  return result.contents[0].text;
}

// ---------------------------------------------------------------------------
// Helper: spin up a connected client ↔ server pair
// ---------------------------------------------------------------------------

async function createTestClient(baseUrl?: string) {
  const server = createMcpServer(baseUrl);
  const [clientTransport, serverTransport] = InMemoryTransport
    .createLinkedPair();

  const client = new Client({ name: "test-client", version: "1.0.0" });

  await Promise.all([
    client.connect(clientTransport),
    server.connect(serverTransport),
  ]);

  return {
    client,
    close: async () => {
      await client.close();
      await server.close();
    },
  };
}

// The MCP SDK's InMemoryTransport leaves internal async ops after close()
// that Deno's sanitizer incorrectly attributes to other test files.
const mcpTestOpts = { sanitizeOps: false, sanitizeResources: false };

// ---------------------------------------------------------------------------
// getSiteName
// ---------------------------------------------------------------------------

Deno.test("getSiteName - returns configured name", () => {
  // test_config.ts sets name to "Denote"
  assertEquals(getSiteName(), "Denote");
});

// ---------------------------------------------------------------------------
// MCP_CORS_HEADERS
// ---------------------------------------------------------------------------

Deno.test("MCP_CORS_HEADERS - includes required headers", () => {
  assertEquals(MCP_CORS_HEADERS["Access-Control-Allow-Origin"], "*");
  assertStringIncludes(
    MCP_CORS_HEADERS["Access-Control-Allow-Methods"],
    "POST",
  );
  assertStringIncludes(
    MCP_CORS_HEADERS["Access-Control-Allow-Methods"],
    "DELETE",
  );
  assertStringIncludes(
    MCP_CORS_HEADERS["Access-Control-Allow-Headers"],
    "mcp-session-id",
  );
  assertStringIncludes(
    MCP_CORS_HEADERS["Access-Control-Expose-Headers"],
    "mcp-session-id",
  );
});

// ---------------------------------------------------------------------------
// Server capabilities
// ---------------------------------------------------------------------------

Deno.test(
  "createMcpServer - server reports tools and resources capabilities",
  mcpTestOpts,
  async () => {
    const { client, close } = await createTestClient();

    const caps = client.getServerCapabilities();
    assertNotEquals(caps, undefined);
    assertNotEquals(caps!.tools, undefined);
    assertNotEquals(caps!.resources, undefined);

    await close();
  },
);

// ---------------------------------------------------------------------------
// listTools
// ---------------------------------------------------------------------------

Deno.test("listTools - returns all three tools", mcpTestOpts, async () => {
  const { client, close } = await createTestClient();

  const { tools } = await client.listTools();
  const names = tools.map((t) => t.name).sort();
  assertEquals(names, ["get_all_docs", "get_doc", "search_docs"]);

  await close();
});

Deno.test("listTools - tools have descriptions", mcpTestOpts, async () => {
  const { client, close } = await createTestClient();

  const { tools } = await client.listTools();
  for (const tool of tools) {
    assertNotEquals(tool.description, undefined);
    assertEquals(typeof tool.description, "string");
    assertEquals(tool.description!.length > 0, true);
  }

  await close();
});

// ---------------------------------------------------------------------------
// search_docs tool
// ---------------------------------------------------------------------------

Deno.test(
  "search_docs - finds results for known topic",
  mcpTestOpts,
  async () => {
    clearSearchIndexCache();
    const { client, close } = await createTestClient();

    const result = await client.callTool({
      name: "search_docs",
      arguments: { query: "installation" },
    });

    const text = toolText(result);
    assertStringIncludes(text, "Installation");
    assertStringIncludes(text, "Slug:");

    await close();
  },
);

Deno.test(
  "search_docs - returns no results for nonsense query",
  mcpTestOpts,
  async () => {
    clearSearchIndexCache();
    const { client, close } = await createTestClient();

    const result = await client.callTool({
      name: "search_docs",
      arguments: { query: "xyzzy_quantum_flux_99" },
    });

    const text = toolText(result);
    assertStringIncludes(text, "No results found");

    await close();
  },
);

Deno.test("search_docs - case insensitive", mcpTestOpts, async () => {
  clearSearchIndexCache();
  const { client, close } = await createTestClient();

  const result = await client.callTool({
    name: "search_docs",
    arguments: { query: "INSTALLATION" },
  });

  const text = toolText(result);
  assertStringIncludes(text, "Installation");

  await close();
});

Deno.test("search_docs - limits results to 10", mcpTestOpts, async () => {
  clearSearchIndexCache();
  const { client, close } = await createTestClient();

  // "the" should match many docs
  const result = await client.callTool({
    name: "search_docs",
    arguments: { query: "the" },
  });

  const text = toolText(result);
  // Count result separators (---) between results; N results = N-1 separators
  const separators = (text.match(/^---$/gm) || []).length;
  const resultCount = separators + 1;
  assertEquals(resultCount <= 10, true);
  assertEquals(resultCount > 0, true);

  await close();
});

// ---------------------------------------------------------------------------
// get_doc tool
// ---------------------------------------------------------------------------

Deno.test("get_doc - returns existing page", mcpTestOpts, async () => {
  const { client, close } = await createTestClient();

  const result = await client.callTool({
    name: "get_doc",
    arguments: { slug: "introduction" },
  });

  const text = toolText(result);
  assertStringIncludes(text, "# Introduction");

  await close();
});

Deno.test(
  "get_doc - returns not found for missing page",
  mcpTestOpts,
  async () => {
    const { client, close } = await createTestClient();

    const result = await client.callTool({
      name: "get_doc",
      arguments: { slug: "nonexistent-page-xyz" },
    });

    const text = toolText(result);
    assertStringIncludes(text, "Page not found");

    await close();
  },
);

// ---------------------------------------------------------------------------
// get_all_docs tool
// ---------------------------------------------------------------------------

Deno.test(
  "get_all_docs - returns all documentation with preamble",
  mcpTestOpts,
  async () => {
    const { client, close } = await createTestClient();

    const result = await client.callTool({
      name: "get_all_docs",
      arguments: {},
    });

    const text = toolText(result);
    // Preamble with doc count and token estimate
    assertStringIncludes(text, "documents, ~");
    assertStringIncludes(text, "tokens");
    // Contains actual content
    assertStringIncludes(text, "Introduction");
    assertStringIncludes(text, "Installation");
    // Docs are separated
    assertStringIncludes(text, "---");

    await close();
  },
);

// ---------------------------------------------------------------------------
// listResources
// ---------------------------------------------------------------------------

Deno.test("listResources - includes docs-index", mcpTestOpts, async () => {
  const { client, close } = await createTestClient();

  const { resources } = await client.listResources();
  const uris = resources.map((r) => r.uri);
  assertEquals(uris.includes("docs://index"), true);

  await close();
});

Deno.test(
  "listResources - doc-page template lists all docs",
  mcpTestOpts,
  async () => {
    const { client, close } = await createTestClient();

    const { resources } = await client.listResources();
    // The list callback should populate resources from all docs
    const docResources = resources.filter((r) =>
      r.uri.startsWith("docs://") && r.uri !== "docs://index"
    );
    assertEquals(docResources.length > 0, true);

    // Each should have a name
    for (const r of docResources) {
      assertNotEquals(r.name, undefined);
      assertEquals(typeof r.name, "string");
    }

    await close();
  },
);

// ---------------------------------------------------------------------------
// readResource - docs://index
// ---------------------------------------------------------------------------

Deno.test(
  "readResource - docs://index returns doc listing",
  mcpTestOpts,
  async () => {
    const { client, close } = await createTestClient();

    const result = await client.readResource({ uri: "docs://index" });
    assertEquals(result.contents.length, 1);

    const text = resourceText(result);
    assertStringIncludes(text, "Documentation Index");
    assertStringIncludes(text, "introduction");

    await close();
  },
);

// ---------------------------------------------------------------------------
// readResource - docs://{slug}
// ---------------------------------------------------------------------------

Deno.test(
  "readResource - docs://{slug} returns doc content",
  mcpTestOpts,
  async () => {
    const { client, close } = await createTestClient();

    const result = await client.readResource({ uri: "docs://introduction" });
    assertEquals(result.contents.length, 1);
    assertEquals((result.contents[0] as Any).mimeType, "text/markdown");

    const text = resourceText(result);
    assertStringIncludes(text, "# Introduction");

    await close();
  },
);

Deno.test(
  "readResource - docs://{slug} returns not found for missing slug",
  mcpTestOpts,
  async () => {
    const { client, close } = await createTestClient();

    const result = await client.readResource({
      uri: "docs://nonexistent-page-xyz",
    });

    const text = resourceText(result);
    assertStringIncludes(text, "Document not found");

    await close();
  },
);

// ---------------------------------------------------------------------------
// listResourceTemplates
// ---------------------------------------------------------------------------

Deno.test(
  "listResourceTemplates - includes doc-page template",
  mcpTestOpts,
  async () => {
    const { client, close } = await createTestClient();

    const { resourceTemplates } = await client.listResourceTemplates();
    const templates = resourceTemplates.map((t) => t.uriTemplate);
    assertEquals(templates.includes("docs://{slug}"), true);

    await close();
  },
);

// ---------------------------------------------------------------------------
// baseUrl — web URL integration
// ---------------------------------------------------------------------------

Deno.test(
  "get_doc - includes web URL when baseUrl is provided",
  mcpTestOpts,
  async () => {
    const { client, close } = await createTestClient(
      "https://docs.example.com",
    );

    const result = await client.callTool({
      name: "get_doc",
      arguments: { slug: "introduction" },
    });

    const text = toolText(result);
    assertStringIncludes(text, "https://docs.example.com/docs/introduction");

    await close();
  },
);

Deno.test(
  "get_doc - omits web URL when no baseUrl",
  mcpTestOpts,
  async () => {
    const { client, close } = await createTestClient();

    const result = await client.callTool({
      name: "get_doc",
      arguments: { slug: "introduction" },
    });

    const text = toolText(result);
    assertEquals(text.includes("Web:"), false);

    await close();
  },
);

Deno.test(
  "search_docs - includes web URLs when baseUrl is provided",
  mcpTestOpts,
  async () => {
    clearSearchIndexCache();
    const { client, close } = await createTestClient(
      "https://docs.example.com",
    );

    const result = await client.callTool({
      name: "search_docs",
      arguments: { query: "installation" },
    });

    const text = toolText(result);
    assertStringIncludes(text, "https://docs.example.com/docs/");

    await close();
  },
);

Deno.test(
  "readResource - doc-page includes web URL when baseUrl is provided",
  mcpTestOpts,
  async () => {
    const { client, close } = await createTestClient(
      "https://docs.example.com",
    );

    const result = await client.readResource({ uri: "docs://introduction" });
    const text = resourceText(result);
    assertStringIncludes(text, "https://docs.example.com/docs/introduction");

    await close();
  },
);

Deno.test(
  "tool descriptions include site name",
  mcpTestOpts,
  async () => {
    const { client, close } = await createTestClient();

    const { tools } = await client.listTools();
    for (const tool of tools) {
      assertStringIncludes(tool.description!, "Denote");
    }

    await close();
  },
);
