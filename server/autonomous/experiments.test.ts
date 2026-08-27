import { describe, expect, it } from "vitest";
import { isActionAllowed } from "./autonomy";

describe("governed experiments", () => {
  it("allows autonomous experiment execution only at the self-optimizing level", () => {
    expect(isActionAllowed("autonomous", "run-experiment", "automation")).toBe(false);
    expect(isActionAllowed("self-optimizing", "run-experiment", "automation")).toBe(true);
  });
});
