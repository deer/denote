import { assert, assertStringIncludes } from "jsr:@std/assert@1";
import { denoteStyles } from "./vite.ts";

// The expected @source path is derived the same way the plugin derives it.
const packageDir = new URL(".", import.meta.url).pathname;

/** Call the plugin's transform hook directly. */
async function transform(
  code: string,
  id = "styles.css",
): Promise<string | undefined> {
  const plugin = denoteStyles();
  // deno-lint-ignore no-explicit-any
  return await (plugin as any).transform(code, id);
}

Deno.test('denoteStyles - inlines @import "@denote/core/styles.css"', async () => {
  const input = `@import "tailwindcss";\n@import "@denote/core/styles.css";\n`;
  const result = await transform(input);
  assert(result !== undefined, "expected a transform result");
  // The import directive is replaced with the actual CSS content.
  // styles.css itself mentions the import in a comment, so we can't assert
  // the string is absent — instead verify the content was genuinely inlined.
  assertStringIncludes(result, "--denote-primary"); // known token from styles.css
  assertStringIncludes(result, "--denote-sidebar-width"); // another known token
  assert(
    result.length > input.length,
    "result should be longer after inlining",
  );
});

Deno.test("denoteStyles - rewrites @source node_modules path", async () => {
  const input = `@source "node_modules/@denote/core/";\n`;
  const result = await transform(input);
  assert(result !== undefined, "expected a transform result");
  assert(
    !result.includes("node_modules/@denote/core/"),
    "node_modules path should be gone",
  );
  assertStringIncludes(result, packageDir);
});

Deno.test("denoteStyles - handles both in one file", async () => {
  const input =
    `@import "tailwindcss";\n@import "@denote/core/styles.css";\n@source "node_modules/@denote/core/";\n`;
  const result = await transform(input);
  assert(result !== undefined);
  assert(!result.includes("node_modules/@denote/core/"));
  assertStringIncludes(result, "--denote-primary");
  assertStringIncludes(result, packageDir);
});

Deno.test("denoteStyles - ignores non-CSS files", async () => {
  const result = await transform(
    `@import "@denote/core/styles.css";`,
    "main.ts",
  );
  assert(result === undefined, "should not transform non-CSS files");
});

Deno.test("denoteStyles - returns undefined when nothing to rewrite", async () => {
  const result = await transform(`@import "tailwindcss";\n@source "./";\n`);
  assert(
    result === undefined,
    "should return undefined when no changes needed",
  );
});
