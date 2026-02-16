import { assertEquals, assertStringIncludes } from "jsr:@std/assert@1";
import { renderToString } from "preact-render-to-string";
import { EditLink } from "../components/EditLink.tsx";

Deno.test("EditLink - renders nothing when editUrl is not set", () => {
  const html = renderToString(<EditLink slug="introduction" />);
  assertEquals(html, "");
});

Deno.test("EditLink - renders link with correct href when editUrl is set", () => {
  const html = renderToString(
    <EditLink
      editUrl="https://github.com/acme/docs/edit/main/docs/content/docs"
      slug="getting-started"
    />,
  );
  assertStringIncludes(
    html,
    "https://github.com/acme/docs/edit/main/docs/content/docs/getting-started.md",
  );
  assertStringIncludes(html, "Edit this page");
});

Deno.test("EditLink - works with nested slugs", () => {
  const html = renderToString(
    <EditLink
      editUrl="https://github.com/acme/docs/edit/main/docs"
      slug="guides/advanced/deployment"
    />,
  );
  assertStringIncludes(
    html,
    "https://github.com/acme/docs/edit/main/docs/guides/advanced/deployment.md",
  );
});

Deno.test("EditLink - works with non-GitHub hosts", () => {
  const html = renderToString(
    <EditLink
      editUrl="https://gitlab.com/org/repo/-/edit/main/docs"
      slug="setup"
    />,
  );
  assertStringIncludes(
    html,
    "https://gitlab.com/org/repo/-/edit/main/docs/setup.md",
  );
  assertStringIncludes(html, "Edit this page");
});
