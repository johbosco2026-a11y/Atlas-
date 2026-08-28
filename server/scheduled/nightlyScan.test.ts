import type { Request, Response } from "express";
import { afterEach, describe, expect, it } from "vitest";
import {
  isAuthenticatedManusCronUser,
  isValidVercelCronAuthorization,
  nightlyScanHandler,
  safeScheduledErrorPayload,
} from "./nightlyScan";

function createRequest(authorization?: string): Request {
  return {
    method: "GET",
    get: () => authorization,
    originalUrl: "/api/scheduled/nightly-scan",
  } as unknown as Request;
}

function createResponse() {
  return {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
  } as unknown as Response & { statusCode: number; body: unknown };
}

async function expectUnauthorizedCronRequest(authorization?: string) {
  const response = createResponse();
  await nightlyScanHandler(createRequest(authorization), response);
  expect(response.statusCode).toBe(401);
  expect(response.body).toEqual({ error: "invalid-cron-authorization" });
}

describe("Vercel Cron authorization", () => {
  const originalSecret = process.env.CRON_SECRET;

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = originalSecret;
  });

  it("fails closed when the configured secret or authorization header is missing", () => {
    delete process.env.CRON_SECRET;
    expect(isValidVercelCronAuthorization(undefined)).toBe(false);

    process.env.CRON_SECRET = "test-cron-secret";
    expect(isValidVercelCronAuthorization(undefined)).toBe(false);
  });

  it("rejects an incorrect bearer credential using constant-length comparison", () => {
    process.env.CRON_SECRET = "test-cron-secret";

    expect(isValidVercelCronAuthorization("Bearer wrong-secret")).toBe(false);
    expect(isValidVercelCronAuthorization("Basic test-cron-secret")).toBe(false);
    expect(isValidVercelCronAuthorization("Bearer test-cron-secret-extra-long")).toBe(false);
  });

  it("accepts the exact configured bearer credential", () => {
    process.env.CRON_SECRET = "test-cron-secret";

    expect(isValidVercelCronAuthorization("Bearer test-cron-secret")).toBe(true);
  });

  it("returns 401 with the exact body when CRON_SECRET is unset", async () => {
    delete process.env.CRON_SECRET;
    await expectUnauthorizedCronRequest("Bearer test-cron-secret");
  });

  it("returns 401 with the exact body when Authorization is missing", async () => {
    process.env.CRON_SECRET = "test-cron-secret";
    await expectUnauthorizedCronRequest();
  });

  it("returns 401 with the exact body when the bearer secret is wrong", async () => {
    process.env.CRON_SECRET = "test-cron-secret";
    await expectUnauthorizedCronRequest("Bearer wrong-secret");
  });

  it("returns a generic scheduled error payload without stack details", () => {
    const payload = safeScheduledErrorPayload();

    expect(payload.error).toBe("nightly-scan-failed");
    expect(payload).not.toHaveProperty("stack");
    expect(payload).not.toHaveProperty("message");
    expect(payload.timestamp).toMatch(/Z$/);
  });

  it("requires both the cron marker and task UID for Manus Heartbeat callers", () => {
    expect(isAuthenticatedManusCronUser(undefined)).toBe(false);
    expect(isAuthenticatedManusCronUser({ isCron: true })).toBe(false);
    expect(isAuthenticatedManusCronUser({ taskUid: "task-1" })).toBe(false);
    expect(isAuthenticatedManusCronUser({ isCron: false, taskUid: "task-1" })).toBe(false);
    expect(isAuthenticatedManusCronUser({ isCron: true, taskUid: "task-1" })).toBe(true);
  });
});
