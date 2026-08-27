import { createControlPlaneApp } from "./app";

/**
 * Bundled by the production build so Vercel can load one self-contained
 * CommonJS dependency from the catch-all `/api` function.
 */
export const vercelApiHandler = createControlPlaneApp();
