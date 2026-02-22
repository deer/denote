import { define } from "../../utils.ts";
import { getDoc } from "../../lib/docs.ts";

export const handler = define.middleware(async (ctx) => {
  const denoteContext = ctx.state.denote;
  const config = denoteContext.config;

  // Extract slug from URL pathname (more reliable than ctx.params in wildcard middleware)
  const basePath = denoteContext.docsBasePath;
  const pathname = ctx.url.pathname;
  const prefix = basePath + "/";
  const slug = pathname.startsWith(prefix)
    ? pathname.slice(prefix.length).replace(/\/$/, "")
    : null;

  if (slug) {
    const doc = await getDoc(slug, denoteContext);
    if (doc) {
      ctx.state.pageTitle = doc.frontmatter.title;
      ctx.state.pageDescription = doc.frontmatter.description;
      if (doc.frontmatter.image) {
        ctx.state.pageImage = doc.frontmatter.image;
      }
    }
  }

  // Set canonical URL — prefer seo.url for a stable domain
  const seoBase = config.seo?.url?.replace(/\/$/, "");
  const origin = seoBase || ctx.url.origin;
  ctx.state.pageUrl = `${origin}${ctx.url.pathname}`;

  return ctx.next();
});
