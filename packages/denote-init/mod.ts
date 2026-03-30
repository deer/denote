#!/usr/bin/env -S deno run -A
/**
 * @denote/init — Scaffold a new Denote documentation project
 *
 * @module
 *
 * CLI and programmatic API for scaffolding a new Denote docs site. Creates
 * a ready-to-run project with configuration, sample content, and Deno tasks.
 *
 * @example CLI usage
 * ```sh
 * deno run -Ar jsr:@denote/init             # Prompts for project name
 * deno run -Ar jsr:@denote/init my-docs     # Create "my-docs" directory
 * deno run -Ar jsr:@denote/init .           # Initialize in current directory
 * ```
 *
 * @example Programmatic usage
 * ```ts
 * import { initProject } from "@denote/init";
 *
 * await initProject({ dir: "./my-docs", name: "my-docs" });
 * ```
 */

import { basename, resolve } from "@std/path";
import denoConfig from "./deno.json" with { type: "json" };
/** Current package version, read from deno.json. */
export const VERSION: string = denoConfig.version;

// ANSI colors
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const cyan = (s: string) => `\x1b[36m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;

function printHelp() {
  console.log(`
${bold("🦕 Denote")} — AI-native documentation framework

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

  // Create deno.json — a plain Fresh/Deno project config
  // Note: ^0.0.x in semver means >=0.0.x <0.0.(x+1) — effectively pinned to
  // patch. This is intentional for pre-1.0 packages where minor bumps may break.
  const coreSpecifier = "jsr:@denote/core@^0.0.6";
  const denoJson = {
    nodeModulesDir: "auto",
    tasks: {
      dev: "deno run -A npm:vite",
      build: "deno run -A npm:vite build",
      start:
        "deno serve --allow-read --allow-net --allow-env=ANALYTICS_SITE_ID,DENO_DEPLOYMENT_ID,DENO_TESTING,NODE_ENV _fresh/server.js",
      ok: "deno fmt --check && deno lint && deno check && deno task validate",
      validate: "deno run -A jsr:@denote/core/validate",
    },
    imports: {
      "@denote/core": coreSpecifier,
      "@denote/core/": coreSpecifier + "/",
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
      types: ["vite/client"],
    },
  };
  await Deno.writeTextFile(
    `${projectDir}/deno.json`,
    JSON.stringify(denoJson, null, 2) + "\n",
  );
  console.log(`  ${green("✓")} deno.json`);

  // Create main.ts — Fresh app entry point
  const mainTs = `import { denote } from "@denote/core";
import { config } from "./denote.config.ts";

export const app = denote({ config });
`;
  await Deno.writeTextFile(`${projectDir}/main.ts`, mainTs);
  console.log(`  ${green("✓")} main.ts`);

  // Create client.ts — client-side entry for CSS
  const clientTs =
    `// Fresh client entry point — this file is bundled for the browser.
// Importing CSS here ensures Tailwind styles are included in the client bundle.
import "./styles.css";
`;
  await Deno.writeTextFile(`${projectDir}/client.ts`, clientTs);
  console.log(`  ${green("✓")} client.ts`);

  // Create styles.css — Tailwind + Denote styles
  // @import pulls in design tokens, markdown overrides, animations from core.
  // @source scans the installed core package for server component classes.
  const stylesCss = `@import "tailwindcss";
@import "@denote/core/styles.css";

/* @source tells Tailwind where to scan for class names to include in the build */
@source "./";
@source "node_modules/@denote/core/";

/* @variant defines when "dark:" utility classes apply — here, when .dark is on an ancestor */
@variant dark (&:where(.dark, .dark *));
`;
  await Deno.writeTextFile(`${projectDir}/styles.css`, stylesCss);
  console.log(`  ${green("✓")} styles.css`);

  // Create vite.config.ts — standard Vite config with Fresh + Denote islands
  const viteConfig = `import { defineConfig } from "vite";
import { fresh } from "@fresh/plugin-vite";
import tailwindcss from "@tailwindcss/vite";
import { denoteHmr } from "@denote/core/vite";
import { islandSpecifiers } from "@denote/core";

export default defineConfig({
  server: { port: 8000 },
  plugins: [
    denoteHmr(),
    fresh({
      serverEntry: "main.ts",
      clientEntry: "client.ts",
      islandSpecifiers,
    }),
    tailwindcss(),
  ],
});
`;
  await Deno.writeTextFile(`${projectDir}/vite.config.ts`, viteConfig);
  console.log(`  ${green("✓")} vite.config.ts`);

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
  ai: {
    mcp: true,
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
- ⚡ **Lightning Fast** — Server-rendered with Fresh
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

  // Create installation.md — sample doc page for the user's project
  const installMd = `---
title: Installation
description: How to install and set up ${projectName}
---

# Installation

Get started with ${projectName} quickly.

## Prerequisites

- [Deno](https://deno.com) v2.0 or later

## Install

\`\`\`bash
# Replace this with your project's actual install command
deno add @your-org/${projectName}
\`\`\`

## Usage

\`\`\`typescript
// Replace this with a real usage example
import { hello } from "@your-org/${projectName}";

hello("world");
\`\`\`

## Configuration

See the [Introduction](/docs/introduction) page for an overview.

---

> [!TIP]
> This is a sample documentation page generated by Denote. Edit it in
> \`content/docs/installation.md\` to document your own project.
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

  // Create Dockerfile
  // Pin to a specific Deno version for reproducible builds. Users should
  // update this when upgrading Deno.
  const dockerfile = `# Build stage
FROM denoland/deno:2.7.2 AS builder

WORKDIR /app

COPY deno.json deno.lock* ./
RUN deno install

COPY . .
RUN deno task build

# Runtime stage
FROM denoland/deno:2.7.2

WORKDIR /app

COPY --from=builder /app/_fresh ./_fresh
COPY --from=builder /app/content ./content
COPY --from=builder /app/denote.config.ts ./denote.config.ts
COPY --from=builder /app/static ./static

EXPOSE 8000

CMD ["deno", "serve", "--allow-read=/app", "--allow-net", "--allow-env=ANALYTICS_SITE_ID,DENO_DEPLOYMENT_ID,DENO_TESTING,NODE_ENV", "_fresh/server.js"]
`;
  if (!await fileExists(`${projectDir}/Dockerfile`)) {
    await Deno.writeTextFile(`${projectDir}/Dockerfile`, dockerfile);
    console.log(`  ${green("✓")} Dockerfile`);
  }

  // Create README.md
  const readmeMd = `# ${projectName}

Built with [Denote](https://denote.sh) — an AI-native documentation framework.

## Development

\`\`\`bash
deno task dev
\`\`\`

Open [http://localhost:8000](http://localhost:8000) to view your site.

## Build

\`\`\`bash
deno task build
\`\`\`

## Start

Serve the production build:

\`\`\`bash
deno task start
\`\`\`

## Deploy

### Deno Deploy

Link your GitHub repo at [dash.deno.com](https://dash.deno.com). Set the build
command to \`deno task build\` and the entry point to \`_fresh/server.js\`.

### Docker

A \`Dockerfile\` is included. Build and run:

\`\`\`bash
docker build -t ${projectName} .
docker run -p 8000:8000 ${projectName}
\`\`\`
`;
  if (!await fileExists(`${projectDir}/README.md`)) {
    await Deno.writeTextFile(`${projectDir}/README.md`, readmeMd);
    console.log(`  ${green("✓")} README.md`);
  }

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
