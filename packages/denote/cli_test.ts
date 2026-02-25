import { assertEquals } from "jsr:@std/assert@1";
import { SERVER_CLASSES } from "./lib/server_classes.ts";
import { extractClasses } from "./scripts/extract-classes.ts";

Deno.test("SERVER_CLASSES is a non-empty string of space-separated classes", () => {
  assertEquals(typeof SERVER_CLASSES, "string");
  const classes = SERVER_CLASSES.split(" ");
  assertEquals(
    classes.length > 50,
    true,
    `Expected 50+ classes, got ${classes.length}`,
  );
  // Spot-check known classes
  assertEquals(classes.includes("flex"), true, "Missing 'flex'");
  assertEquals(
    classes.includes("items-center"),
    true,
    "Missing 'items-center'",
  );
  assertEquals(
    classes.includes("bg-[var(--denote-bg)]"),
    true,
    "Missing 'bg-[var(--denote-bg)]'",
  );
});

Deno.test("SERVER_CLASSES includes island component classes", async () => {
  const safelisted = new Set(SERVER_CLASSES.split(" "));
  const pkgDir = new URL(".", import.meta.url).pathname;

  // Scan all .tsx source directories (components, routes, islands)
  const dirs = [
    `${pkgDir}components`,
    `${pkgDir}routes`,
    `${pkgDir}islands`,
  ];

  const allClasses = new Set<string>();
  for (const dir of dirs) {
    for await (const entry of Deno.readDir(dir)) {
      if (!entry.name.endsWith(".tsx")) continue;
      const source = await Deno.readTextFile(`${dir}/${entry.name}`);
      for (const cls of extractClasses(source)) {
        allClasses.add(cls);
      }
    }
    // Also check subdirectories for routes
    if (dir.endsWith("routes")) {
      for await (const entry of Deno.readDir(dir)) {
        if (!entry.isDirectory) continue;
        for await (const sub of Deno.readDir(`${dir}/${entry.name}`)) {
          if (!sub.name.endsWith(".tsx")) continue;
          const source = await Deno.readTextFile(
            `${dir}/${entry.name}/${sub.name}`,
          );
          for (const cls of extractClasses(source)) {
            allClasses.add(cls);
          }
        }
      }
    }
  }

  const missing = [...allClasses].filter((cls) => !safelisted.has(cls)).sort();
  assertEquals(
    missing,
    [],
    `SERVER_CLASSES is missing ${missing.length} classes used in source files ` +
      `(run "deno task extract-classes" to fix):\n  ${missing.join("\n  ")}`,
  );
});
