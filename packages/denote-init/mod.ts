#!/usr/bin/env -S deno run -A
/**
 * @denote/init — Scaffold a new Denote documentation project
 *
 * Usage:
 *   deno run -Ar jsr:@denote/init             # Prompts for project name
 *   deno run -Ar jsr:@denote/init my-docs      # Create "my-docs" directory
 *   deno run -Ar jsr:@denote/init .             # Initialize in current directory
 */

import { basename, resolve } from "@std/path";
import denoConfig from "./deno.json" with { type: "json" };
export const VERSION = denoConfig.version;

// ANSI colors
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const cyan = (s: string) => `\x1b[36m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;

function printHelp() {
  console.log(`
${bold("🦕 Denote")} — AI-native documentation platform

${bold("USAGE")}
  deno run -Ar jsr:@denote/init [project-name]

${bold("EXAMPLES")}
  deno run -Ar jsr:@denote/init              ${
    dim("# Prompts with default name")
  }
  deno run -Ar jsr:@denote/init my-docs      ${dim("# Create new project")}
  deno run -Ar jsr:@denote/init .            ${
    dim("# Initialize in current dir")
  }

${bold("OPTIONS")}
  -h, --help       Show this help message
  -v, --version    Show version number
`);
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch {
    return false;
  }
}

async function scaffold(projectDir: string, projectName: string) {
  console.log(
    `\n${bold("🦕 Creating Denote project:")} ${cyan(projectName)}\n`,
  );

  // Create directory structure
  const dirs = [
    "",
    "content/docs",
    "static",
  ];

  for (const dir of dirs) {
    const path = `${projectDir}/${dir}`;
    await Deno.mkdir(path, { recursive: true });
  }

  // Create deno.json
  // Imports must cover bare specifiers used in CLI-generated .denote/ files
  // (vite.config.ts, main.ts). Transitive deps resolve via JSR/npm graphs.
  const coreSpecifier = "jsr:@denote/core@^0.0.3";
  const denoJson = {
    nodeModulesDir: "auto",
    tasks: {
      dev: "deno run -A jsr:@denote/core/cli dev",
      build: "deno run -A jsr:@denote/core/cli build",
      validate: "deno run -A jsr:@denote/core/cli validate",
      mcp: "deno run -A jsr:@denote/core/cli mcp",
    },
    imports: {
      "@denote/core": coreSpecifier,
      "@fresh/plugin-vite": "jsr:@fresh/plugin-vite@^1.0.8",
      "@tailwindcss/vite": "npm:@tailwindcss/vite@^4.1.12",
      "vite": "npm:vite@^7.3.1",
      "tailwindcss": "npm:tailwindcss@^4.1.10",
      "fresh": "jsr:@fresh/core@^2.2.0",
      "preact": "npm:preact@^10.27.2",
      "@preact/signals": "npm:@preact/signals@^2.5.0",
    },
    lint: {
      rules: { tags: ["fresh", "recommended"] },
    },
    exclude: ["**/_fresh/*"],
    compilerOptions: {
      lib: ["dom", "dom.asynciterable", "dom.iterable", "deno.ns"],
      jsx: "precompile",
      jsxImportSource: "preact",
      jsxPrecompileSkipElements: [
        "a",
        "img",
        "source",
        "body",
        "html",
        "head",
        "title",
        "meta",
        "script",
        "link",
        "style",
        "base",
        "noscript",
        "template",
      ],
    },
  };
  await Deno.writeTextFile(
    `${projectDir}/deno.json`,
    JSON.stringify(denoJson, null, 2) + "\n",
  );
  console.log(`  ${green("✓")} deno.json`);

  // Create denote.config.ts
  const docsConfig = `import type { DenoteConfig } from "@denote/core";

export const config: DenoteConfig = {
  name: "${projectName}",
  colors: {
    primary: "#6366f1",
  },
  landing: {
    hero: {
      badge: "Open Source",
      title: "Welcome to",
      titleHighlight: "${projectName}",
      description:
        "A fast, beautiful documentation site. Edit denote.config.ts to customize this page.",
    },
    cta: {
      primary: { text: "Get Started", href: "/docs/introduction" },
      secondary: {
        text: "GitHub",
        href: "https://github.com/your-org/${projectName}",
      },
    },
    install: "deno run -Ar jsr:@denote/init",
    features: [
      {
        icon: "⚡",
        title: "Fast",
        description: "Server-rendered with minimal client-side JavaScript.",
      },
      {
        icon: "📝",
        title: "Markdown",
        description:
          "Write docs in Markdown with frontmatter. No MDX compilation step. Just files.",
      },
      {
        icon: "🔍",
        title: "Search",
        description: "Built-in full-text search. No external service needed.",
      },
    ],
  },
  navigation: [
    {
      title: "Getting Started",
      children: [
        { title: "Introduction", href: "/docs/introduction" },
        { title: "Installation", href: "/docs/installation" },
      ],
    },
  ],
  topNav: [
    { title: "Documentation", href: "/docs" },
  ],
  social: {
    github: "https://github.com/your-org/${projectName}",
  },
  footer: {
    copyright: "© ${new Date().getFullYear()} ${projectName}",
  },
  search: {
    enabled: true,
  },
};
`;
  await Deno.writeTextFile(`${projectDir}/denote.config.ts`, docsConfig);
  console.log(`  ${green("✓")} denote.config.ts`);

  // Create introduction.md
  const introMd = `---
title: Introduction
description: Welcome to ${projectName}
---

# Welcome to ${projectName}

This is your documentation site, powered by **Denote**.

## Features

- 📝 **Markdown First** — Write docs in plain Markdown
- ⚡ **Lightning Fast** — Server-rendered with Fresh v2
- 🤖 **AI Native** — Built-in MCP server, llms.txt, and JSON API
- 🔍 **Full-text Search** — Instant ⌘K search

## Next Steps

1. Edit this page in \`content/docs/introduction.md\`
2. Add more pages to \`content/docs/\`
3. Update navigation in \`denote.config.ts\`

> [!TIP]
> Run \`deno task dev\` to start the development server.
`;
  await Deno.writeTextFile(
    `${projectDir}/content/docs/introduction.md`,
    introMd,
  );
  console.log(`  ${green("✓")} content/docs/introduction.md`);

  // Create installation.md
  const installMd = `---
title: Installation
description: How to install and set up ${projectName}
---

# Installation

Get started with ${projectName} in minutes.

## Prerequisites

- [Deno](https://deno.land) v2.0 or later

## Quick Start

\`\`\`bash
# Clone the repository
git clone https://github.com/your-org/${projectName}
cd ${projectName}

# Start the dev server
deno task dev
\`\`\`

Open [http://localhost:8000](http://localhost:8000) to see your docs.

## Project Structure

\`\`\`
${projectName}/
├── content/docs/       # Your Markdown documentation
├── static/             # Static assets (images, etc.)
├── denote.config.ts    # Site configuration
└── deno.json           # Deno configuration
\`\`\`

That's it! No framework boilerplate. Just markdown and config.
`;
  await Deno.writeTextFile(
    `${projectDir}/content/docs/installation.md`,
    installMd,
  );
  console.log(`  ${green("✓")} content/docs/installation.md`);

  // Create .gitignore
  const gitignore = `# Dependencies
node_modules/

# Build output
_fresh/
dist/

# Generated by Denote CLI (regenerated on every dev/build)
.denote/

# IDE
.vscode/
.idea/

# OS
.DS_Store
`;
  await Deno.writeTextFile(`${projectDir}/.gitignore`, gitignore);
  console.log(`  ${green("✓")} .gitignore`);

  // Done! Skip "cd" instruction when scaffolding into the current directory.
  const isCwd = projectDir === Deno.cwd();
  console.log(`
${green(bold("✓ Project created!"))}
${
    isCwd ? "" : `
  ${dim("cd")} ${projectName}`
  }
  ${dim("deno task")} dev

  Then open ${cyan("http://localhost:8000")}
`);
}

/** Options for programmatic project initialization */
export interface InitOptions {
  /** Target directory to scaffold into */
  dir: string;
  /** Project name (used in config and docs) */
  name: string;
}

/**
 * Initialize a Denote project programmatically.
 * Exported for testing.
 */
export async function initProject(options: InitOptions): Promise<void> {
  await scaffold(options.dir, options.name);
}

// Main
if (import.meta.main) {
  const args = Deno.args;

  if (args.includes("-h") || args.includes("--help")) {
    printHelp();
    Deno.exit(0);
  }

  if (args.includes("-v") || args.includes("--version")) {
    console.log(`denote-init ${VERSION}`);
    Deno.exit(0);
  }

  const projectArg = args.find((a) => !a.startsWith("-"));

  let unresolvedDirectory: string;
  if (projectArg) {
    unresolvedDirectory = projectArg;
  } else {
    const input = prompt("Project Name:", "my-docs");
    if (!input) {
      printHelp();
      Deno.exit(1);
    }
    unresolvedDirectory = input;
  }

  const projectDir = resolve(Deno.cwd(), unresolvedDirectory);
  const projectName = basename(projectDir);

  // Check if directory exists and has files
  if (await fileExists(projectDir)) {
    const entries = [];
    for await (const entry of Deno.readDir(projectDir)) {
      entries.push(entry);
    }
    const isEmpty = entries.length === 0 ||
      entries.length === 1 && entries[0].name === ".git";
    if (!isEmpty && unresolvedDirectory !== ".") {
      console.error(
        `Error: Directory '${unresolvedDirectory}' already exists and is not empty.`,
      );
      Deno.exit(1);
    }
  }

  await scaffold(projectDir, projectName);
}
