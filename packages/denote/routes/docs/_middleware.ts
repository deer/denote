import { define } from "../../utils.ts";
import { getDoc } from "../../lib/docs.ts";
import { getDocsBasePath } from "../../lib/config.ts";

export const handler = define.middleware(async (ctx) => {
  // Extract slug from URL pathname (more reliable than ctx.params in wildcard middleware)
  const basePath = getDocsBasePath();
  const pathname = ctx.url.pathname;
  const prefix = basePath + "/";
  const slug = pathname.startsWith(prefix)
    ? pathname.slice(prefix.length).replace(/\/$/, "")
    : null;

  if (slug) {
    const doc = await getDoc(slug);
    if (doc) {
      ctx.state.pageTitle = doc.frontmatter.title;
      ctx.state.pageDescription = doc.frontmatter.description;
    }
  }

  // Set canonical URL for OG tags
  ctx.state.pageUrl = new URL(ctx.url.pathname, ctx.url.origin).href;

  return ctx.next();
});
