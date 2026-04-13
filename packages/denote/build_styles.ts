/**
 * Regenerates the pre-compiled Tailwind utility block inside `styles.css`.
 *
 * Run: `deno task build:styles`
 *
 * JSR packages are not installed into a consumer's `node_modules`, so the
 * consumer's Tailwind build cannot scan the framework source files for class
 * names. To work around this, we run Tailwind at framework *publish time*
 * against `components/`, `islands/`, and `routes/`, and embed the compiled
 * utility CSS directly inside `styles.css` between the
 * `framework-utilities:start` / `framework-utilities:end` markers.
 *
 * The consumer then just `@import "@denote/core/styles.css"` and gets all
 * framework utility classes as plain pre-compiled CSS — no scanning, no
 * plugin path rewriting, no fragile runtime resolution.
 *
 * Run this whenever you touch class names in framework components.
 */

import { join } from "node:path";

const packageDir = new URL(".", import.meta.url).pathname;
const stylesPath = join(packageDir, "styles.css");
const START = "/* framework-utilities:start */";
const END = "/* framework-utilities:end */";

// Tailwind's CLI resolves `@import "tailwindcss/..."` relative to the input
// file, walking upward looking for `node_modules/tailwindcss`. We generate
// the temp input inside the workspace so the repo-level `node_modules`
// (populated by `nodeModulesDir: auto` + the `tailwindcss` import in
// packages/denote/deno.json) is discoverable.
const tmpDir = join(packageDir, "..", "..", "tmp", "style-build");
await Deno.mkdir(tmpDir, { recursive: true });
const inputPath = join(tmpDir, "input.css");
const outputPath = join(tmpDir, "out.css");

// Preflight is deliberately excluded — the consumer's own Tailwind emits its
// own reset. Theme is kept so emitted utilities have the CSS vars they
// reference (--spacing, --text-sm, etc.) defined in the cascade, in case the
// consumer's own source doesn't happen to use every class the framework does.
const input = `@import "tailwindcss/theme" layer(theme);
@import "tailwindcss/utilities" layer(utilities);
@source "${join(packageDir, "components")}";
@source "${join(packageDir, "islands")}";
@source "${join(packageDir, "routes")}";
@variant dark (&:where(.dark, .dark *));
`;
await Deno.writeTextFile(inputPath, input);

const cmd = new Deno.Command("deno", {
  args: [
    "run",
    "-A",
    "npm:@tailwindcss/cli@^4.1",
    "-i",
    inputPath,
    "-o",
    outputPath,
  ],
  stdout: "piped",
  stderr: "piped",
});
const { success, stderr } = await cmd.output();
if (!success) {
  throw new Error(
    `tailwindcss CLI failed:\n${new TextDecoder().decode(stderr)}`,
  );
}

const compiled = (await Deno.readTextFile(outputPath))
  // Strip the CLI's leading banner comment — we add our own header inside
  // the marker block.
  .replace(/^\/\*![\s\S]*?\*\/\s*/, "")
  .trimEnd();

const header =
  `/* Pre-compiled by build_styles.ts — do not hand-edit. Run \`deno task build:styles\` to regenerate. */`;
const block = `${START}\n${header}\n${compiled}\n${END}`;

const existing = await Deno.readTextFile(stylesPath);
let updated: string;
if (existing.includes(START) && existing.includes(END)) {
  const before = existing.slice(0, existing.indexOf(START));
  const after = existing.slice(existing.indexOf(END) + END.length);
  updated = before + block + after;
} else {
  updated = existing.trimEnd() + "\n\n" + block + "\n";
}
await Deno.writeTextFile(stylesPath, updated);

// Clean up the scratch files but leave tmp/style-build/ in place so repeat
// runs reuse any node_modules resolution the CLI set up.
await Deno.remove(inputPath);
await Deno.remove(outputPath);

const ruleCount = (compiled.match(/^\s{2}\.[^\s{]+\s*\{/gm) ?? []).length;
console.log(
  `✓ Regenerated framework utilities block (${ruleCount} utility rules)`,
);
