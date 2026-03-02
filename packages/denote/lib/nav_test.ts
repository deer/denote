import { assertEquals } from "jsr:@std/assert@1";
import { findFirstHref, flattenNav } from "./nav.ts";

Deno.test("findFirstHref - returns first leaf href", () => {
  assertEquals(
    findFirstHref([
      {
        title: "Section",
        children: [{ title: "Page", href: "/docs/page" }],
      },
    ]),
    "/docs/page",
  );
});

Deno.test("findFirstHref - returns null for empty nav", () => {
  assertEquals(findFirstHref([]), null);
});

Deno.test("findFirstHref - returns null for sections without hrefs", () => {
  assertEquals(
    findFirstHref([{ title: "Empty Section", children: [] }]),
    null,
  );
});

Deno.test("findFirstHref - prefers shallow href over nested", () => {
  assertEquals(
    findFirstHref([
      { title: "Top", href: "/top" },
      {
        title: "Section",
        children: [{ title: "Nested", href: "/nested" }],
      },
    ]),
    "/top",
  );
});

Deno.test("findFirstHref - finds deeply nested href", () => {
  assertEquals(
    findFirstHref([
      {
        title: "L1",
        children: [
          {
            title: "L2",
            children: [{ title: "L3", href: "/deep" }],
          },
        ],
      },
    ]),
    "/deep",
  );
});

Deno.test("flattenNav - flattens nested structure", () => {
  assertEquals(
    flattenNav([
      {
        title: "Section",
        children: [{ title: "A", href: "/a" }],
      },
      { title: "B", href: "/b" },
    ]),
    [
      { title: "A", href: "/a" },
      { title: "B", href: "/b" },
    ],
  );
});

Deno.test("flattenNav - returns empty for empty nav", () => {
  assertEquals(flattenNav([]), []);
});

Deno.test("flattenNav - skips sections without hrefs", () => {
  assertEquals(
    flattenNav([
      { title: "Section", children: [] },
      { title: "Page", href: "/page" },
    ]),
    [{ title: "Page", href: "/page" }],
  );
});

Deno.test("flattenNav - includes section href and children", () => {
  assertEquals(
    flattenNav([
      {
        title: "Section",
        href: "/section",
        children: [{ title: "Child", href: "/child" }],
      },
    ]),
    [
      { title: "Section", href: "/section" },
      { title: "Child", href: "/child" },
    ],
  );
});
