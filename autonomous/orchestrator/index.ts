import { evaluatePromotionEligibility, type RepairCandidatePolicyInput } from "../repair/guard";
import type { CorrelatedFinding } from "../inspection/contracts";

export type OrchestrationDecision = { action: "observe" | "create-candidate" | "request-approval" | "promote" | "discard"; reason: string };

export function decideNextAction(finding: CorrelatedFinding, candidate?: RepairCandidatePolicyInput): OrchestrationDecision {
  if (!candidate) return finding.severity === "critical" || finding.severity === "high" ? { action: "create-candidate", reason: "A high-confidence material finding needs an isolated repair candidate." } : { action: "observe", reason: "The finding is retained for monitoring until its evidence or priority increases." };
  const eligibility = evaluatePromotionEligibility(candidate);
  if (candidate.reviewerDecision === "rejected" || Object.values(candidate.gates).includes("failed")) return { action: "discard", reason: "A failed gate or rejected review requires candidate discard and incident retention." };
  if (!eligibility.eligible) return { action: "request-approval", reason: eligibility.reasons.join(" ") };
  return { action: "promote", reason: "Every policy gate is satisfied and independent review has approved promotion." };
}
