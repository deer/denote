import { HttpError, type PageProps } from "fresh";
import { define, isDev, type State } from "../../utils.ts";
import { getBreadcrumbs, getPrevNext, getRenderedDoc } from "../../lib/docs.ts";
import { DocsLayout } from "../../components/DocsLayout.tsx";
import { Search } from "../../islands/Search.tsx";
import { CopyButton } from "../../islands/CopyButton.tsx";
import { EditLink } from "../../components/EditLink.tsx";

/** Docs page component — exported for programmatic routing */
export async function DocsPage(ctx: PageProps<unknown, State>) {
  const denoteContext = ctx.state.denote;
  const config = denoteContext.config;
  const slugParts = ctx.params.slug;
  const slug = Array.isArray(slugParts)
    ? slugParts.join("/")
    : slugParts || "introduction";

  const rendered = await getRenderedDoc(slug, denoteContext, ctx.state.doc);

  if (!rendered) {
    if (isDev()) {
      return (
        <div class="min-h-screen bg-[var(--denote-bg)] flex items-center justify-center p-8">
          <div class="max-w-md text-center">
            <div class="text-5xl mb-4">📄</div>
            <h1 class="text-xl font-semibold text-[var(--denote-text)] mb-2">
              No content found
            </h1>
            <p class="text-[var(--denote-text-secondary)] mb-4">
              Create{" "}
              <code class="text-sm bg-[var(--denote-bg-tertiary)] px-1.5 py-0.5 rounded">
                content/docs/{slug}.md
              </code>{" "}
              to see this page.
            </p>
            <p class="text-sm text-[var(--denote-text-muted)]">
              This message only appears in development.
            </p>
          </div>
        </div>
      );
    }
    throw new HttpError(404, "Documentation page not found");
  }

  const { doc, html, toc } = rendered;
  const currentPath = `${denoteContext.docsBasePath}/${slug}`;
  const { prev, next } = getPrevNext(currentPath, denoteContext);
  const breadcrumbs = getBreadcrumbs(currentPath, denoteContext);

  return (
    <DocsLayout
      config={config}
      description={doc.frontmatter.description}
      toc={toc}
      currentPath={currentPath}
      prev={prev}
      next={next}
      breadcrumbs={breadcrumbs}
    >
      {config.search?.enabled !== false && (
        <Search docsBasePath={denoteContext.docsBasePath} />
      )}
      <CopyButton />
      <div
        class="markdown-body"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <EditLink editUrl={config.editUrl} slug={slug} />
    </DocsLayout>
  );
}

/** Default export for fsRoutes compatibility */
export default define.page(DocsPage);
