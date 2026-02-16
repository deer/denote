import "./test_config.ts";
import { assertEquals } from "jsr:@std/assert@1";
import { validate } from "./validate.ts";
import { setConfig, setContentDir } from "./config.ts";
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

/** Restore global state to the defaults used by test_config.ts */
function restoreTestConfig() {
  setContentDir(realContentDir);
  // Suppress Zod warnings during restore
  const origWarn = console.warn;
  console.warn = () => {};
  setConfig({
    name: "Denote",
    navigation: [
      {
        title: "Getting Started",
        children: [
          { title: "Introduction", href: "/docs/introduction" },
        ],
      },
    ],
  });
  console.warn = origWarn;
}

Deno.test("validate - runs without crashing on test config", async () => {
  setContentDir(realContentDir);
  try {
    const issues = await validate();
    // test_config.ts references /docs/styling which doesn't exist as a file,
    // so validation correctly reports it as a broken nav link.
    const errors = issues.filter((i) => i.severity === "error");
    assertEquals(errors.length, 1);
    assertEquals(errors[0].message.includes("styling"), true);
  } finally {
    restoreTestConfig();
  }
});

Deno.test("validate - reports missing content directory", async () => {
  setContentDir("/tmp/denote-nonexistent-dir-" + Math.random());
  try {
    const issues = await validate();
    const errors = issues.filter((i) => i.severity === "error");
    assertEquals(
      errors.some((i) => i.message.includes("Content directory")),
      true,
    );
  } finally {
    restoreTestConfig();
  }
});

Deno.test("validate - reports broken navigation links", async () => {
  setContentDir(realContentDir);
  setConfig({
    name: "Test",
    navigation: [
      { title: "Ghost Page", href: "/docs/this-page-does-not-exist" },
    ],
  });
  try {
    const issues = await validate();
    const errors = issues.filter((i) => i.severity === "error");
    assertEquals(
      errors.some((i) => i.message.includes("this-page-does-not-exist")),
      true,
    );
  } finally {
    restoreTestConfig();
  }
});

Deno.test("validate - reports missing config name", async () => {
  setContentDir(realContentDir);
  const origWarn = console.warn;
  console.warn = () => {};
  setConfig(
    // @ts-ignore: intentionally testing empty name
    { name: "", navigation: [{ title: "X", href: "/docs/introduction" }] },
  );
  console.warn = origWarn;
  try {
    const issues = await validate();
    assertEquals(
      issues.some((i) => i.message.includes("'name' is required")),
      true,
    );
  } finally {
    restoreTestConfig();
  }
});

Deno.test("validate - reports invalid hex color", async () => {
  setContentDir(realContentDir);
  const origWarn = console.warn;
  console.warn = () => {};
  setConfig({
    name: "Test",
    navigation: [{ title: "Intro", href: "/docs/introduction" }],
    colors: { primary: "not-a-color" },
  });
  console.warn = origWarn;
  try {
    const issues = await validate();
    assertEquals(
      issues.some((i) => i.message.includes("not a valid hex color")),
      true,
    );
  } finally {
    restoreTestConfig();
  }
});

Deno.test("validate - skips external navigation links", async () => {
  setContentDir(realContentDir);
  setConfig({
    name: "Test",
    navigation: [
      { title: "GitHub", href: "https://github.com/example" },
      { title: "Introduction", href: "/docs/introduction" },
    ],
  });
  try {
    const issues = await validate();
    const errors = issues.filter((i) => i.severity === "error");
    assertEquals(
      errors.some((i) => i.message.includes("github.com")),
      false,
    );
  } finally {
    restoreTestConfig();
  }
});
