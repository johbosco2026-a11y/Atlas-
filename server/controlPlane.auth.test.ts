import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createContext(user: TrpcContext["user"]): TrpcContext {
  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("controlPlane governance authorization", () => {
  it("keeps the snapshot read-only query available without a session", async () => {
    const caller = appRouter.createCaller(createContext(null));
    const snapshot = await caller.controlPlane.snapshot();

    expect(snapshot.application.name).toBe("Atlas Control Plane");
  });

  it("rejects governance mutations without an authenticated admin", async () => {
    const caller = appRouter.createCaller(createContext(null));

    await expect(caller.controlPlane.setAutonomy("observer")).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("rejects governance mutations for authenticated non-admin users", async () => {
    const caller = appRouter.createCaller(
      createContext({
        id: 1,
        openId: "sample-user",
        email: "sample@example.com",
        name: "Sample User",
        loginMethod: "manus",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      }),
    );

    await expect(caller.controlPlane.setAutonomy("observer")).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});

// This test intentionally does not exercise an admin mutation. Production promotion
// remains a separate, explicitly approved Git/Vercel operation outside tRPC.
