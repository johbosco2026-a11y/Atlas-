export type RepairGate = "build" | "unit" | "e2e" | "visual" | "preview-browser" | "independent-review";

export type RepairCandidatePolicyInput = {
  branch: string;
  baseBranch: string;
  changedFiles: string[];
  gates: Record<RepairGate, "pending" | "passed" | "failed">;
  reviewerDecision: "pending" | "approved" | "rejected";
};

export type PromotionEligibility = { eligible: boolean; reasons: string[] };

export function isHealBranch(branch: string): boolean {
  return /^heal\/[a-z0-9][a-z0-9-]*$/i.test(branch);
}

export function evaluatePromotionEligibility(input: RepairCandidatePolicyInput): PromotionEligibility {
  const reasons: string[] = [];
  if (input.baseBranch !== "main") reasons.push("Candidates must be based on main.");
  if (!isHealBranch(input.branch)) reasons.push("Candidates must use a durable heal/* branch.");
  if (input.changedFiles.length === 0) reasons.push("A repair candidate must contain a minimal, explicit patch.");
  for (const [gate, status] of Object.entries(input.gates) as Array<[RepairGate, "pending" | "passed" | "failed"]>) {
    if (status !== "passed") reasons.push(`${gate} gate is ${status}.`);
  }
  if (input.reviewerDecision !== "approved") reasons.push("Independent review has not approved the candidate.");
  return { eligible: reasons.length === 0, reasons };
}

export function assertNeverDirectProductionModification(targetBranch: string): void {
  if (targetBranch === "main") throw new Error("Policy violation: repairs must be created on heal/* branches and promoted only after preview validation.");
}
