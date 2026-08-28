import { afterEach, describe, expect, it, vi } from "vitest";
import { requireDurableControlPlaneStore } from "./repository";

describe("durable control-plane storage", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("refuses state-changing work when DATABASE_URL is unavailable", async () => {
    vi.stubEnv("DATABASE_URL", "");

    await expect(requireDurableControlPlaneStore()).rejects.toThrow(
      "Durable control-plane storage is unavailable; refusing an in-memory-only mutation.",
    );
  });
});
