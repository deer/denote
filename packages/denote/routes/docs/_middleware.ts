import { define } from "../../utils.ts";
import { getDoc } from "../../lib/docs.ts";

export const handler = define.middleware(async (ctx) => {
  const slugParts = ctx.params.slug;
  if (slugParts) {
    const slug = Array.isArray(slugParts) ? slugParts.join("/") : slugParts;

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
