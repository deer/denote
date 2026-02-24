import { assertEquals } from "jsr:@std/assert@1";
import { SERVER_CLASSES } from "./lib/server_classes.ts";

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
