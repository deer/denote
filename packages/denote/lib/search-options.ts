/**
 * MiniSearch options shared between server (build) and client (load).
 *
 * @module
 *
 * Extracted into its own module so the Search island can import it without
 * pulling in the full docs/markdown pipeline (which would bloat the client
 * bundle). The server imports this via `lib/docs.ts` re-export.
 */
export const SEARCH_OPTIONS = {
  idField: "slug" as const,
  fields: ["title", "description", "content", "aiSummary", "aiKeywords"],
  storeFields: ["title", "description"],
  searchOptions: {
    boost: { title: 4, description: 2, aiSummary: 1.5 },
    fuzzy: 0.2,
    prefix: true,
  },
};
