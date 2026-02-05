/**
 * Redirect /docs to /docs/introduction
 */
export const handler = {
  GET: () =>
    new Response(null, {
      status: 302,
      headers: { Location: "/docs/introduction" },
    }),
};
