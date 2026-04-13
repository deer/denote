import { assert, assertStringIncludes } from "jsr:@std/assert@1";
import { denoteStyles } from "./vite.ts";

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
  // Verify the import directive was replaced with real CSS content by
  // checking for known design tokens defined in styles.css.
  assertStringIncludes(result, "--denote-primary");
  assertStringIncludes(result, "--denote-sidebar-width");
  // And verify the pre-compiled framework utilities block made it through.
  assertStringIncludes(result, "framework-utilities:start");
  assert(
    result.length > input.length,
    "result should be longer after inlining",
  );
});

Deno.test("denoteStyles - ignores non-CSS files", async () => {
  const result = await transform(
    `@import "@denote/core/styles.css";`,
    "main.ts",
  );
  assert(result === undefined, "should not transform non-CSS files");
});

Deno.test("denoteStyles - returns undefined when nothing to inline", async () => {
  const result = await transform(`@import "tailwindcss";\n@source "./";\n`);
  assert(
    result === undefined,
    "should return undefined when no changes needed",
  );
});
