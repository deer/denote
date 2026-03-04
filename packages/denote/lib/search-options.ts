/** MiniSearch options shared between server (build) and client (load). */
export const SEARCH_OPTIONS = {
  idField: "slug" as const,
  fields: ["title", "description", "content", "aiSummary", "aiKeywords"],
  storeFields: ["title", "description", "slug"],
  searchOptions: {
    boost: { title: 4, description: 2, aiSummary: 1.5 },
    fuzzy: 0.2,
    prefix: true,
  },
  extractField: (doc: Record<string, unknown>, fieldName: string): string => {
    if (fieldName === "aiKeywords") {
      return (doc.aiKeywords as string[] | undefined)?.join(" ") ?? "";
    }
    return (doc[fieldName] as string) ?? "";
  },
};
