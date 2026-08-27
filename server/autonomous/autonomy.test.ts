import { describe, expect, it } from "vitest";
import { isActionAllowed } from "./autonomy";

describe("autonomy permissions", () => {
  it("keeps observer mode read-only for automation", () => {
    expect(isActionAllowed("observer", "inspect", "automation")).toBe(true);
    expect(isActionAllowed("observer", "create-candidate", "automation")).toBe(false);
  });
  it("requires an operator for independent review at every level", () => {
    expect(isActionAllowed("self-optimizing", "review", "automation")).toBe(false);
    expect(isActionAllowed("repair", "review", "operator")).toBe(true);
  });
  it("allows autonomous promotion requests only at autonomous levels", () => {
    expect(isActionAllowed("repair", "request-promotion", "automation")).toBe(false);
    expect(isActionAllowed("autonomous", "request-promotion", "automation")).toBe(true);
  });
});
