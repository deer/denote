import { testContext } from "./test_config.ts";
import { assertEquals } from "jsr:@std/assert@1";
import { spy } from "jsr:@std/testing@1/mock";
import { validate, validateAndPrint } from "./validate.ts";
import type { DenoteContext } from "../utils.ts";

/** Create a test context with overrides */
function ctx(
  overrides?: Partial<DenoteContext> & {
    config?: Partial<DenoteContext["config"]>;
  },
): DenoteContext {
  return {
    ...testContext,
    contentDir: overrides?.contentDir ?? testContext.contentDir,
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

Deno.test("validate - reports invalid seo.url", async () => {
  const issues = await validate(ctx({
    config: {
      name: "Test",
      navigation: [{ title: "Intro", href: "/docs/introduction" }],
      seo: { url: "not-a-url" },
    },
  }));
  assertEquals(
    issues.some((i) =>
      i.message.includes("seo.url") && i.message.includes("not a valid URL")
    ),
    true,
  );
});

Deno.test("validate - reports invalid seo.ogImage", async () => {
  const issues = await validate(ctx({
    config: {
      name: "Test",
      navigation: [{ title: "Intro", href: "/docs/introduction" }],
      seo: { ogImage: "bad-url" },
    },
  }));
  assertEquals(
    issues.some((i) =>
      i.message.includes("seo.ogImage") && i.message.includes("not a valid URL")
    ),
    true,
  );
});

Deno.test("validate - accepts valid seo config", async () => {
  const issues = await validate(ctx({
    config: {
      name: "Test",
      navigation: [{ title: "Intro", href: "/docs/introduction" }],
      seo: {
        url: "https://example.com",
        ogImage: "https://example.com/og.png",
      },
    },
  }));
  assertEquals(
    issues.some((i) => i.message.includes("seo.")),
    false,
  );
});

Deno.test("validate - warns on empty navigation", async () => {
  const issues = await validate(ctx({
    config: {
      name: "Test",
      navigation: [],
    },
  }));
  assertEquals(
    issues.some((i) => i.message.includes("'navigation' is empty")),
    true,
  );
});

Deno.test("validate - reports invalid dark hex color", async () => {
  const issues = await validate(ctx({
    config: {
      name: "Test",
      navigation: [{ title: "Intro", href: "/docs/introduction" }],
      // @ts-ignore: intentionally testing invalid dark color without primary
      colors: { dark: { primary: "not-hex" } },
    },
  }));
  assertEquals(
    issues.some((i) =>
      i.message.includes("colors.dark") && i.message.includes("not a valid hex")
    ),
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

// ---------------------------------------------------------------------------
// validateAndPrint
// ---------------------------------------------------------------------------

Deno.test("validateAndPrint - all-pass case returns 0", async () => {
  const logSpy = spy(console, "log");
  try {
    const result = await validateAndPrint(ctx({
      config: {
        name: "Test",
        navigation: [
          { title: "Introduction", href: "/docs/introduction" },
        ],
      },
    }));
    assertEquals(result, 0);
    assertEquals(
      logSpy.calls.some((c) => String(c.args[0]).includes("All checks passed")),
      true,
    );
  } finally {
    logSpy.restore();
  }
});

Deno.test("validateAndPrint - warnings-only returns 0", async () => {
  const logSpy = spy(console, "log");
  try {
    const result = await validateAndPrint(ctx({
      config: {
        name: "Test",
        navigation: [],
      },
    }));
    assertEquals(result, 0);
    assertEquals(
      logSpy.calls.some((c) => String(c.args[0]).includes("\u26A0")),
      true,
    );
  } finally {
    logSpy.restore();
  }
});

Deno.test("validateAndPrint - errors case returns >0", async () => {
  const logSpy = spy(console, "log");
  try {
    const result = await validateAndPrint(ctx({
      config: {
        name: "Test",
        navigation: [
          { title: "Styling", href: "/docs/styling" },
        ],
      },
    }));
    assertEquals(result > 0, true);
    assertEquals(
      logSpy.calls.some((c) => String(c.args[0]).includes("\u2717")),
      true,
    );
  } finally {
    logSpy.restore();
  }
});
