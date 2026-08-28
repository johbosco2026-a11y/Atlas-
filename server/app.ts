import express, { type Express } from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";
import { registerOAuthRoutes } from "./_core/oauth";
import { registerStorageProxy } from "./_core/storageProxy";
import { nightlyScanHandler } from "./scheduled/nightlyScan";

/**
 * Creates the shared HTTP application for local development and Vercel API
 * functions. Static dashboard delivery is handled by Vite locally and by
 * Vercel's `dist/public` output directory in production.
 */
export function createControlPlaneApp(): Express {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerStorageProxy(app);
  registerOAuthRoutes(app);
  app.post("/api/scheduled/nightly-scan", nightlyScanHandler);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  return app;
}
