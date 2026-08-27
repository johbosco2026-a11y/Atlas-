import { createRequire } from "node:module";

/**
 * Catch-all Vercel serverless entry for the control-plane API surface.
 * Vercel maps `/api/*` requests to this Express-compatible handler.
 */
const require = createRequire(import.meta.url);
const { vercelApiHandler: handler } = require("../dist/serverless/control-plane.cjs");

export default handler;
