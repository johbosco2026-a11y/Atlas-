import { describe, expect, it } from "vitest";
import { evaluatePromotionEligibility } from "../../autonomous/repair/guard";
import { applicationContractPath, applicationContractYaml, createCandidate, discardCandidate, validateApplicationContract } from "./controlPlane";

const passedGates = { build: "passed", unit: "passed", e2e: "passed", visual: "passed", "preview-browser": "passed", "independent-review": "passed" } as const;

describe("control-plane constitution", () => {
  it("validates the preview-first Vercel constitution", () => expect(validateApplicationContract()).toMatchObject({ valid: true, errors: [] }));
  it("loads the repository-visible application contract instead of a duplicate inline copy", () => { expect(applicationContractPath).toContain("autonomous/application-contract.yaml"); expect(applicationContractYaml).toContain("preview_then_production"); });
  it("blocks a candidate that attempts direct production modification", () => { const result = evaluatePromotionEligibility({ branch: "main", baseBranch: "main", changedFiles: ["src/app.tsx"], gates: passedGates, reviewerDecision: "approved" }); expect(result.eligible).toBe(false); expect(result.reasons.join(" ")).toContain("heal/*"); });
  it("requires review and every validation gate before promotion", () => { const result = evaluatePromotionEligibility({ branch: "heal/fix-card-image", baseBranch: "main", changedFiles: ["src/Card.tsx"], gates: { ...passedGates, visual: "pending", "independent-review": "pending" }, reviewerDecision: "pending" }); expect(result.eligible).toBe(false); expect(result.reasons).toContain("visual gate is pending."); expect(result.reasons).toContain("Independent review has not approved the candidate."); });
  it("contains a rejected candidate without touching main", () => { const candidate = createCandidate("finding-contact-mobile", "Improve label contrast"); const discarded = discardCandidate(candidate.id, "Independent review rejected the visual change."); expect(discarded.status).toBe("discarded"); expect(discarded.branch).toMatch(/^heal\//); expect(discarded.baseBranch).toBe("main"); });
});
