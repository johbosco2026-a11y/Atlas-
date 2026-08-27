import { createControlPlaneApp } from "../server/app";



/**

 * Catch-all Vercel serverless entry for the control-plane API surface.

 * Vercel maps `/api/*` requests to this Express-compatible handler.

 */

const handler = createControlPlaneApp();



export default handler;

