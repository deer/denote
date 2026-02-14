/**
 * GA4 Analytics Middleware for Denote
 *
 * Opt-in server-side Google Analytics 4 event reporting using @kitsonk/ga4.
 * Sends page_view events for document responses and exception events on errors.
 */

import type { Context } from "fresh";
import { GA4Report, isDocument, isServerError } from "@kitsonk/ga4";
import type { Event } from "@kitsonk/ga4";

let showedMissingWarning = false;

/**
 * Create a GA4 analytics middleware for Fresh v2.
 *
 * Reads the measurement ID from the `GA4_MEASUREMENT_ID` environment variable.
 */
export function ga4Middleware() {
  const id = Deno.env.get("GA4_MEASUREMENT_ID");

  return async function ga4Handler<T>(ctx: Context<T>): Promise<Response> {
    if (!id) {
      if (!showedMissingWarning) {
        showedMissingWarning = true;
        console.warn(
          "GA4: No measurement ID configured. Google Analytics reporting disabled.",
        );
      }
      return ctx.next();
    }

    let error: unknown;
    let res: Response;

    try {
      res = await ctx.next();
      return res;
    } catch (e) {
      error = e;
      res = new Response("Internal Server Error", { status: 500 });
      throw e;
    } finally {
      // Fire analytics async — don't block the response
      sendGA4(ctx.req, ctx, res!, id, error);
    }
  };
}

function sendGA4<T>(
  request: Request,
  ctx: Context<T>,
  response: Response,
  measurementId: string,
  error?: unknown,
): void {
  Promise.resolve().then(async () => {
    // Only track GET/POST
    if (!/^(GET|POST)$/.test(request.method)) {
      return;
    }

    // Skip non-document requests (assets, fonts, etc.) unless there's an error
    if (!isDocument(request, response) && error == null) {
      return;
    }

    let event: Event | null = null;
    const contentType = response.headers.get("content-type");
    if (/text\/html/.test(contentType ?? "")) {
      event = { name: "page_view", params: {} };
    }

    if (event == null && error == null) {
      return;
    }

    let exceptionEvent: Event | undefined;
    if (error != null) {
      exceptionEvent = {
        name: "exception",
        params: {
          description: String(error),
          fatal: isServerError(response),
        },
      };
    }

    // @ts-ignore GA4Report doesn't use localAddress from conn
    const report = new GA4Report({
      measurementId,
      request,
      response,
      // deno-lint-ignore no-explicit-any
      conn: ctx.info as any,
    });

    report.event = event;

    if (exceptionEvent != null) {
      report.events.push(exceptionEvent);
    }

    await report.send();
  }).catch((err) => {
    console.error("GA4 reporting error:", err);
  });
}
