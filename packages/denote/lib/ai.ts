/**
 * AI Agent serving utilities
 *
 * Generates llms.txt and structured content for AI consumption.
 * See: https://llmstxt.org/
 */
import { getAllDocs } from "./docs.ts";
import type { DenoteContext } from "../utils.ts";
import { extractToc } from "@deer/gfm";

/**
 * Generate llms.txt — a standard file that tells AI agents
 * what this documentation contains and how to access it.
 */
export async function generateLlmsTxt(
  denoteContext: DenoteContext,
  baseUrl: string,
): Promise<string> {
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

  return lines.join("\n");
}

/**
 * Generate full markdown dump of all docs — optimized for AI context windows.
 */
export async function generateFullDocs(
  denoteContext: DenoteContext,
): Promise<string> {
  const config = denoteContext.config;
  const docs = await getAllDocs(denoteContext);

  const sections: string[] = [
    `# ${config.name} — Complete Documentation`,
    "",
  ];

  for (const doc of docs) {
    sections.push(`---`);
    sections.push("");
    sections.push(`## ${doc.frontmatter.title}`);
    if (doc.frontmatter["ai-summary"]) {
      sections.push("");
      sections.push(`*${doc.frontmatter["ai-summary"]}*`);
    } else if (doc.frontmatter.description) {
      sections.push("");
      sections.push(`*${doc.frontmatter.description}*`);
    }
    if (
      doc.frontmatter["ai-keywords"] &&
      doc.frontmatter["ai-keywords"].length > 0
    ) {
      sections.push("");
      sections.push(
        `Keywords: ${doc.frontmatter["ai-keywords"].join(", ")}`,
      );
    }
    sections.push("");
    sections.push(doc.content);
    sections.push("");
  }

  return sections.join("\n");
}

/**
 * Get all docs as structured JSON for API consumption.
 */
export async function getDocsJson(
  denoteContext: DenoteContext,
  baseUrl?: string,
): Promise<object> {
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

  return result;
}
