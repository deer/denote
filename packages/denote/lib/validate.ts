/**
 * Validation utilities for Denote projects.
 * Checks content directory, frontmatter, navigation links, and config.
 */
import { getConfig, getContentDir, getDocsBasePath } from "./config.ts";
import { getAllDocs } from "./docs.ts";
import type { DenoteConfig, NavItem } from "../denote.config.ts";

export interface ValidationIssue {
  severity: "error" | "warning";
  message: string;
}

const HEX_COLOR_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

function collectNavHrefs(items: NavItem[]): string[] {
  const hrefs: string[] = [];
  for (const item of items) {
    if (item.href) hrefs.push(item.href);
    if (item.children) hrefs.push(...collectNavHrefs(item.children));
  }
  return hrefs;
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

  return issues;
}

/**
 * Run all validation checks and return a list of issues.
 */
export async function validate(): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];

  // 1. Config validation
  let config: DenoteConfig;
  try {
    config = getConfig();
    issues.push(...validateConfig(config));
  } catch {
    issues.push({
      severity: "error",
      message: "Config not initialized. Ensure denote.config.ts is loaded.",
    });
    return issues;
  }

  // 2. Content directory check
  const contentDir = getContentDir();
  try {
    await Deno.stat(contentDir);
  } catch {
    issues.push({
      severity: "error",
      message: `Content directory not found: ${contentDir}`,
    });
    return issues;
  }

  // 3. Frontmatter validation
  const docs = await getAllDocs();
  if (docs.length === 0) {
    issues.push({
      severity: "warning",
      message: "No markdown files found in content directory.",
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
  const docsBasePath = getDocsBasePath();
  const slugs = new Set(docs.map((d) => `${docsBasePath}/${d.slug}`));
  const navHrefs = collectNavHrefs(config.navigation);

  for (const href of navHrefs) {
    if (href.startsWith("http://") || href.startsWith("https://")) continue;
    if (!slugs.has(href)) {
      issues.push({
        severity: "error",
        message: `Navigation link "${href}" does not match any document.`,
      });
    }
  }

  return issues;
}

/**
 * Run validation and print results to console.
 * Returns the number of errors found.
 */
export async function validateAndPrint(): Promise<number> {
  const issues = await validate();
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
