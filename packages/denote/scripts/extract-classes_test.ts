import { assertEquals } from "jsr:@std/assert@1";
import { extractClasses } from "./extract-classes.ts";

Deno.test("extractClasses - static class attribute", () => {
  const source = `<div class="flex items-center gap-2">hello</div>`;
  const result = extractClasses(source);
  assertEquals(result, new Set(["flex", "items-center", "gap-2"]));
});

Deno.test("extractClasses - arbitrary value classes", () => {
  const source =
    `<body class="antialiased text-[var(--denote-text)] bg-[var(--denote-bg)]">`;
  const result = extractClasses(source);
  assertEquals(
    result,
    new Set([
      "antialiased",
      "text-[var(--denote-text)]",
      "bg-[var(--denote-bg)]",
    ]),
  );
});

Deno.test("extractClasses - variant prefixes", () => {
  const source =
    `<a class="hover:text-[var(--denote-text)] sm:flex lg:px-8 focus:z-[100]">`;
  const result = extractClasses(source);
  assertEquals(
    result,
    new Set([
      "hover:text-[var(--denote-text)]",
      "sm:flex",
      "lg:px-8",
      "focus:z-[100]",
    ]),
  );
});

Deno.test("extractClasses - JSX expression with ternary strings", () => {
  const source =
    `<span class={i === 0 ? "text-[var(--denote-text)] font-medium" : ""}>`;
  const result = extractClasses(source);
  assertEquals(
    result,
    new Set(["text-[var(--denote-text)]", "font-medium"]),
  );
});

Deno.test("extractClasses - template literal with interpolation", () => {
  const source =
    '<main class={`lg:[padding-left:var(--denote-sidebar-width)]${showToc ? " xl:[padding-right:var(--denote-toc-width)]" : ""}`}>';
  const result = extractClasses(source);
  assertEquals(
    result,
    new Set([
      "lg:[padding-left:var(--denote-sidebar-width)]",
      "xl:[padding-right:var(--denote-toc-width)]",
    ]),
  );
});

Deno.test("extractClasses - multiple class attributes in one file", () => {
  const source = `
    <div class="flex gap-2">
      <span class="text-sm font-bold">hi</span>
    </div>
  `;
  const result = extractClasses(source);
  assertEquals(result, new Set(["flex", "gap-2", "text-sm", "font-bold"]));
});

Deno.test("extractClasses - ignores non-class attributes", () => {
  const source = `<div class="flex" style="color: red" id="main">`;
  const result = extractClasses(source);
  assertEquals(result, new Set(["flex"]));
});

Deno.test("extractClasses - complex multi-class string", () => {
  const source =
    `<a class="group flex flex-col gap-1 text-sm text-right hover:text-[var(--denote-primary-text)] transition-colors">`;
  const result = extractClasses(source);
  assertEquals(
    result,
    new Set([
      "group",
      "flex",
      "flex-col",
      "gap-1",
      "text-sm",
      "text-right",
      "hover:text-[var(--denote-primary-text)]",
      "transition-colors",
    ]),
  );
});
