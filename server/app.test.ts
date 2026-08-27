import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createControlPlaneApp } from "./app";
import { vercelApiHandler } from "./vercelEntry";

describe("Vercel control-plane API entry", () => {
  it("exports an Express-compatible application handler for the Vercel bundle", () => {
    expect(typeof vercelApiHandler).toBe("function");
  });

  it("creates the shared application without binding a network listener", () => {
    const app = createControlPlaneApp();
    expect(typeof app).toBe("function");
    expect(app.settings["x-powered-by"]).toBe(false);
  });

  it("routes Vercel API requests to the catch-all function alongside static output", () => {
    const config = JSON.parse(readFileSync(path.resolve(process.cwd(), "vercel.json"), "utf8"));
    expect(config.outputDirectory).toBe("dist/public");
    expect(config.rewrites).toContainEqual({
      source: "/api/:path*",
      destination: "/api/[...path]",
    });
    expect(config.functions["api/[...path].ts"].includeFiles).toBe("dist/serverless/**");

    const apiEntrypoint = readFileSync(path.resolve(process.cwd(), "api/[...path].ts"), "utf8");
    expect(apiEntrypoint).toContain("dist/serverless/control-plane.mjs");
    expect(apiEntrypoint).toContain("import(bundleUrl)");
  });

  it("uses Vercel's non-secret bypass-cookie contract for protected browser checks", () => {
    const playwrightConfig = readFileSync(path.resolve(process.cwd(), "playwright.config.ts"), "utf8");
    expect(playwrightConfig).toContain('"x-vercel-protection-bypass": protectionBypass');
    expect(playwrightConfig).toContain('"x-vercel-set-bypass-cookie": "true"');
    expect(playwrightConfig).not.toContain("opeIeg8bOxjpDxF1SNiNSpPWaiZHLP");
  });
});
