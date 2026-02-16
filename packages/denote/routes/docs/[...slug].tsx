import { HttpError, type PageProps } from "fresh";
import { define, type State } from "../../utils.ts";
import {
  buildSearchIndex,
  getBreadcrumbs,
  getDoc,
  getPrevNext,
} from "../../lib/docs.ts";
import { renderDoc } from "../../lib/markdown.ts";
import { DocsLayout } from "../../components/DocsLayout.tsx";
import { Search } from "../../islands/Search.tsx";
import { CopyButton } from "../../islands/CopyButton.tsx";
import { EditLink } from "../../components/EditLink.tsx";
import { getConfig } from "../../lib/config.ts";

/** Docs page component — exported for programmatic routing */
export async function DocsPage(ctx: PageProps<unknown, State>) {
  const config = getConfig();
  const slugParts = ctx.params.slug;
  const slug = Array.isArray(slugParts)
    ? slugParts.join("/")
    : slugParts || "introduction";

  const doc = await getDoc(slug);

  if (!doc) {
    throw new HttpError(404, `Documentation page not found: ${slug}`);
  }

  const { html, toc } = await renderDoc(doc.content);
  const searchIndex = await buildSearchIndex();
  const currentPath = `/docs/${slug}`;
  const { prev, next } = getPrevNext(currentPath);
  const breadcrumbs = getBreadcrumbs(currentPath);

  return (
    <DocsLayout
      title={doc.frontmatter.title}
      description={doc.frontmatter.description}
      toc={toc}
      currentPath={currentPath}
      prev={prev}
      next={next}
      breadcrumbs={breadcrumbs}
    >
      <Search items={searchIndex} />
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
