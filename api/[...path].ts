import type { IncomingMessage, ServerResponse } from "node:http";

/**
 * Catch-all Vercel serverless entry for the control-plane API surface.
 * Vercel maps `/api/*` requests to this Express-compatible handler.
 */
type ExpressHandler = (request: IncomingMessage, response: ServerResponse) => unknown;

const bundleUrl = new URL("../dist/serverless/control-plane.mjs", import.meta.url).href;
let handlerPromise: Promise<ExpressHandler> | undefined;

function loadHandler() {
  handlerPromise ??= import(bundleUrl).then(({ vercelApiHandler }) => {
    if (typeof vercelApiHandler !== "function") {
      throw new Error("The bundled Atlas Vercel API handler is unavailable.");
    }
    return vercelApiHandler as ExpressHandler;
  });
  return handlerPromise;
}

export default async function vercelApiHandler(request: IncomingMessage, response: ServerResponse) {
  const handler = await loadHandler();
  return handler(request, response);
}
