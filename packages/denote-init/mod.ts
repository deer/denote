#!/usr/bin/env -S deno run -A
/**
 * @denote/init — Scaffold a new Denote documentation project
 *
 * Usage:
 *   deno run -Ar jsr:@denote/init [project-name]
 *   deno run -Ar jsr:@denote/init my-docs
 *   deno run -Ar jsr:@denote/init .  # Initialize in current directory
 */

const VERSION = "0.1.0";

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
  deno run -Ar jsr:@denote/init my-docs    ${dim("# Create new project")}
  deno run -Ar jsr:@denote/init .          ${dim("# Initialize in current dir")}

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
  const denoJson = {
    tasks: {
      dev: "deno run -A jsr:@denote/core/cli dev",
      build: "deno run -A jsr:@denote/core/cli build",
      mcp: "deno run -A jsr:@denote/core/cli mcp",
    },
    imports: {
      "@denote/core": "jsr:@denote/core@^0.1.0",
    },
  };
  await Deno.writeTextFile(
    `${projectDir}/deno.json`,
    JSON.stringify(denoJson, null, 2) + "\n",
  );
  console.log(`  ${green("✓")} deno.json`);

  // Create denote.config.ts (replaces docs.config.ts + main.ts — users only need config now)
  const docsConfig = `import type { DocsConfig } from "@denote/core";

export const config: DocsConfig = {
  name: "${projectName}",
  colors: {
    primary: "#6366f1",
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
3. Update navigation in \`docs.config.ts\`

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

That's it! No build pipeline, no framework boilerplate. Just markdown and config.
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

# IDE
.vscode/
.idea/

# OS
.DS_Store
`;
  await Deno.writeTextFile(`${projectDir}/.gitignore`, gitignore);
  console.log(`  ${green("✓")} .gitignore`);

  // Done!
  console.log(`
${green(bold("✓ Project created!"))}

  ${dim("cd")} ${projectName}
  ${dim("deno task")} dev

  Then open ${cyan("http://localhost:8000")}
`);
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

  const projectArg = args.find((a) => !a.startsWith("-")) || ".";
  const projectDir = projectArg === "."
    ? Deno.cwd()
    : `${Deno.cwd()}/${projectArg}`;
  const projectName = projectArg === "."
    ? Deno.cwd().split("/").pop()!
    : projectArg;

  // Check if directory exists and has files
  if (await fileExists(projectDir)) {
    const entries = [];
    for await (const entry of Deno.readDir(projectDir)) {
      entries.push(entry);
    }
    if (entries.length > 0 && projectArg !== ".") {
      console.error(
        `Error: Directory '${projectArg}' already exists and is not empty.`,
      );
      Deno.exit(1);
    }
  }

  await scaffold(projectDir, projectName);
}
