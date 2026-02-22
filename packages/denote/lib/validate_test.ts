import { testContext } from "./test_config.ts";
import { assertEquals } from "jsr:@std/assert@1";
import { validate } from "./validate.ts";
import type { DenoteContext } from "../utils.ts";
import { dirname, fromFileUrl, join } from "@std/path";

const __dirname = dirname(fromFileUrl(import.meta.url));
const realContentDir = join(
  __dirname,
  "..",
  "..",
  "..",
  "docs",
  "content",
  "docs",
);

/** Create a test context with overrides */
function ctx(
  overrides?: Partial<DenoteContext> & {
    config?: Partial<DenoteContext["config"]>;
  },
): DenoteContext {
  return {
    ...testContext,
    contentDir: overrides?.contentDir ?? realContentDir,
    docsBasePath: overrides?.docsBasePath ?? testContext.docsBasePath,
    config: overrides?.config
      ? { ...testContext.config, ...overrides.config }
      : testContext.config,
  };
}

Deno.test("validate - runs without crashing on test config", async () => {
  const issues = await validate(ctx());
  // test_config.ts references /docs/styling which doesn't exist as a file,
  // so validation correctly reports it as a broken nav link.
  const errors = issues.filter((i) => i.severity === "error");
  assertEquals(errors.length, 1);
  assertEquals(errors[0].message.includes("styling"), true);
});

Deno.test("validate - reports missing content directory", async () => {
  const issues = await validate(
    ctx({ contentDir: "/tmp/denote-nonexistent-dir-" + Math.random() }),
  );
  const errors = issues.filter((i) => i.severity === "error");
  assertEquals(
    errors.some((i) => i.message.includes("Content directory")),
    true,
  );
});

Deno.test("validate - reports broken navigation links", async () => {
  const issues = await validate(ctx({
    config: {
      name: "Test",
      navigation: [
        { title: "Ghost Page", href: "/docs/this-page-does-not-exist" },
      ],
    },
  }));
  const errors = issues.filter((i) => i.severity === "error");
  assertEquals(
    errors.some((i) => i.message.includes("this-page-does-not-exist")),
    true,
  );
});

Deno.test("validate - reports missing config name", async () => {
  const issues = await validate(ctx({
    config: {
      // @ts-ignore: intentionally testing empty name
      name: "",
      navigation: [{ title: "X", href: "/docs/introduction" }],
    },
  }));
  assertEquals(
    issues.some((i) => i.message.includes("'name' is required")),
    true,
  );
});

Deno.test("validate - reports invalid hex color", async () => {
  const issues = await validate(ctx({
    config: {
      name: "Test",
      navigation: [{ title: "Intro", href: "/docs/introduction" }],
      colors: { primary: "not-a-color" },
    },
  }));
  assertEquals(
    issues.some((i) => i.message.includes("not a valid hex color")),
    true,
  );
});

Deno.test("validate - skips external navigation links", async () => {
  const issues = await validate(ctx({
    config: {
      name: "Test",
      navigation: [
        { title: "GitHub", href: "https://github.com/example" },
        { title: "Introduction", href: "/docs/introduction" },
      ],
    },
  }));
  const errors = issues.filter((i) => i.severity === "error");
  assertEquals(
    errors.some((i) => i.message.includes("github.com")),
    false,
  );
});
