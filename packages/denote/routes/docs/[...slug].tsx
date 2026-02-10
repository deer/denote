import type { PageProps } from "fresh";
import { define, type State } from "../../utils.ts";
import {
  buildSearchIndex,
  getBreadcrumbs,
  getDoc,
  getPrevNext,
} from "../../lib/docs.ts";
import { markdownToHtml } from "../../lib/markdown.ts";
import { DocsLayout } from "../../components/DocsLayout.tsx";
import { Search } from "../../islands/Search.tsx";
import { CopyButton } from "../../islands/CopyButton.tsx";

/** Docs page component — exported for programmatic routing */
export async function DocsPage(ctx: PageProps<unknown, State>) {
  const slugParts = ctx.params.slug;
  const slug = Array.isArray(slugParts)
    ? slugParts.join("/")
    : slugParts || "introduction";

  const doc = await getDoc(slug);

  if (!doc) {
    return (
      <DocsLayout
        title="Not Found"
        description="This page doesn't exist"
        currentPath={`/docs/${slug}`}
      >
        <div class="text-center py-12">
          <h2 class="text-2xl font-semibold mb-4">Page Not Found</h2>
          <p class="text-gray-600 dark:text-gray-400 mb-6">
            The documentation page you're looking for doesn't exist.
          </p>
          <a
            href="/docs/introduction"
            class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            Go to Introduction
          </a>
        </div>
      </DocsLayout>
    );
  }

  const html = await markdownToHtml(doc.content);
  const searchIndex = await buildSearchIndex();
  const currentPath = `/docs/${slug}`;
  const { prev, next } = getPrevNext(currentPath);
  const breadcrumbs = getBreadcrumbs(currentPath);

  return (
    <DocsLayout
      title={doc.frontmatter.title}
      description={doc.frontmatter.description}
      toc={doc.toc}
      currentPath={currentPath}
      prev={prev}
      next={next}
      breadcrumbs={breadcrumbs}
    >
      <Search items={searchIndex} />
      <CopyButton />
      <div
        class="doc-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </DocsLayout>
  );
}

/** Default export for fsRoutes compatibility */
export default define.page(DocsPage);
