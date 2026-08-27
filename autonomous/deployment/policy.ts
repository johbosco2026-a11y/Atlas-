import { evaluatePromotionEligibility, type RepairCandidatePolicyInput } from "../repair/guard";

export function evaluateVercelDeployment(input: RepairCandidatePolicyInput, target: "preview" | "production") {
  if (target === "preview") {
    const allowed = input.baseBranch === "main" && input.branch.startsWith("heal/");
    return { provider: "vercel" as const, target, allowed, explanation: allowed ? "Preview deployment is permitted for an isolated heal/* candidate." : "Preview deployment requires an isolated heal/* branch based on main." };
  }
  const eligibility = evaluatePromotionEligibility(input);
  return { provider: "vercel" as const, target, allowed: eligibility.eligible, explanation: eligibility.eligible ? "Production promotion is allowed after independent review and every required gate passes." : `Production promotion is blocked: ${eligibility.reasons.join(" ")}` };
}
