/**
 * AI Agent serving utilities
 *
 * Generates llms.txt and structured content for AI consumption.
 * See: https://llmstxt.org/
 */
import { getAllDocs } from "./docs.ts";
import { getConfig } from "./config.ts";

/**
 * Generate llms.txt — a standard file that tells AI agents
 * what this documentation contains and how to access it.
 */
export async function generateLlmsTxt(baseUrl: string): Promise<string> {
  const docs = await getAllDocs();

  const lines: string[] = [
    `# ${getConfig().name}`,
    "",
    `> ${getConfig().name} documentation`,
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

  return lines.join("\n");
}

/**
 * Generate full markdown dump of all docs — optimized for AI context windows.
 */
export async function generateFullDocs(): Promise<string> {
  const docs = await getAllDocs();

  const sections: string[] = [
    `# ${getConfig().name} — Complete Documentation`,
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
export async function getDocsJson(): Promise<object> {
  const docs = await getAllDocs();

  return {
    name: getConfig().name,
    pages: docs.map((doc) => ({
      slug: doc.slug,
      title: doc.frontmatter.title,
      description: doc.frontmatter.description,
      aiSummary: doc.frontmatter["ai-summary"],
      aiKeywords: doc.frontmatter["ai-keywords"],
      content: doc.content,
      headings: doc.toc.map((t) => ({
        level: t.level,
        title: t.title,
        id: t.id,
      })),
    })),
  };
}
