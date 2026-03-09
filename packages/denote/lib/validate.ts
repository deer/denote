/**
 * Validation utilities for Denote projects.
 * Checks content directory, frontmatter, navigation links, and config.
 */
import { HEX_COLOR_REGEX } from "./config.ts";
import { getAllDocs } from "./docs.ts";
import { flattenNav } from "./nav.ts";
import type { DenoteConfig } from "../denote.config.ts";
import type { DenoteContext } from "../utils.ts";

export interface ValidationIssue {
  severity: "error" | "warning";
  message: string;
}

function validateConfig(config: DenoteConfig): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!config.name || config.name.trim() === "") {
    issues.push({ severity: "error", message: "Config: 'name' is required." });
  }

  if (!config.navigation || config.navigation.length === 0) {
    issues.push({
      severity: "warning",
      message: "Config: 'navigation' is empty. No sidebar links will render.",
    });
  }

  // Validate color hex codes
  if (config.colors) {
    const colorFields = [
      "primary",
      "accent",
      "background",
      "surface",
      "text",
      "border",
    ] as const;
    for (const field of colorFields) {
      const value = config.colors[field as keyof typeof config.colors];
      if (typeof value === "string" && !HEX_COLOR_REGEX.test(value)) {
        issues.push({
          severity: "error",
          message:
            `Config: colors.${field} "${value}" is not a valid hex color.`,
        });
      }
    }
    if (config.colors.dark) {
      for (const field of colorFields) {
        const value =
          config.colors.dark[field as keyof typeof config.colors.dark];
        if (typeof value === "string" && !HEX_COLOR_REGEX.test(value)) {
          issues.push({
            severity: "error",
            message:
              `Config: colors.dark.${field} "${value}" is not a valid hex color.`,
          });
        }
      }
    }
  }

  // Validate SEO fields
  if (config.seo?.url) {
    try {
      new URL(config.seo.url);
    } catch {
      issues.push({
        severity: "error",
        message:
          `Config: seo.url "${config.seo.url}" is not a valid URL. Use a full URL like "https://example.com".`,
      });
    }
  }
  if (config.seo?.ogImage) {
    try {
      new URL(config.seo.ogImage);
    } catch {
      issues.push({
        severity: "error",
        message:
          `Config: seo.ogImage "${config.seo.ogImage}" is not a valid URL. Use a full URL like "https://example.com/og.png".`,
      });
    }
  }

  return issues;
}

/**
 * Run all validation checks and return a list of issues.
 */
export async function validate(
  denoteContext: DenoteContext,
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];

  // 1. Config validation
  const config = denoteContext.config;
  issues.push(...validateConfig(config));

  // 2. Content directory check
  const contentDir = denoteContext.contentDir;
  try {
    await Deno.stat(contentDir);
  } catch (e) {
    if (!(e instanceof Deno.errors.NotFound)) throw e;
    issues.push({
      severity: "error",
      message:
        `Content directory not found: ${contentDir} — create it with mkdir -p content/docs and add at least one .md file.`,
    });
    return issues;
  }

  // 3. Frontmatter validation
  const docs = await getAllDocs(denoteContext);
  if (docs.length === 0) {
    issues.push({
      severity: "warning",
      message:
        `No markdown files found in ${contentDir}. Add .md files with YAML frontmatter (title, description) to populate your docs.`,
    });
  }

  for (const doc of docs) {
    if (doc.frontmatter.title === "Untitled") {
      issues.push({
        severity: "warning",
        message: `${doc.slug}: Missing or empty 'title' in frontmatter.`,
      });
    }
  }

  // 4. Navigation link validation
  const docsBasePath = denoteContext.docsBasePath;
  const slugs = new Set(docs.map((d) => `${docsBasePath}/${d.slug}`));
  const navHrefs = flattenNav(config.navigation).map((l) => l.href);

  for (const href of navHrefs) {
    if (href.startsWith("http://") || href.startsWith("https://")) continue;
    if (!slugs.has(href)) {
      issues.push({
        severity: "error",
        message:
          `Navigation link "${href}" does not match any document. Expected a file at content/docs/${
            href.replace(docsBasePath + "/", "")
          }.md or update the href in denote.config.ts.`,
      });
    }
  }

  return issues;
}

/**
 * Run validation and print results to console.
 * Returns the number of errors found.
 */
export async function validateAndPrint(
  denoteContext: DenoteContext,
): Promise<number> {
  const issues = await validate(denoteContext);
  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");

  if (issues.length === 0) {
    console.log("\x1b[32m✓ All checks passed.\x1b[0m");
    return 0;
  }

  for (const issue of errors) {
    console.log(`\x1b[31m  ✗ ${issue.message}\x1b[0m`);
  }
  for (const issue of warnings) {
    console.log(`\x1b[33m  ⚠ ${issue.message}\x1b[0m`);
  }

  console.log(
    `\n  ${errors.length} error(s), ${warnings.length} warning(s)`,
  );

  return errors.length;
}
