import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "yaml";
import { evaluatePromotionEligibility, type RepairGate } from "../../autonomous/repair/guard";
import type { CorrelatedFinding, InspectionEvidence, InspectorKind } from "../../autonomous/inspection/contracts";

export type AutonomyLevel = "observer" | "repair" | "autonomous" | "self-optimizing";
export type CandidateStatus = "draft" | "preview-ready" | "reviewing" | "approved" | "rejected" | "discarded" | "promoted";
export type RepairCandidate = { id: string; title: string; branch: string; baseBranch: "main"; status: CandidateStatus; changedFiles: string[]; summary: string; gates: Record<RepairGate, "pending" | "passed" | "failed">; reviewerDecision: "pending" | "approved" | "rejected"; previewUrl: string; createdAt: string };
export type AuditEvent = { id: string; type: "inspection" | "branch" | "preview" | "review" | "promotion" | "rollback" | "memory"; title: string; detail: string; timestamp: string; tone: "success" | "warning" | "neutral" | "danger" };

export const applicationContractPath = resolve(process.cwd(), "autonomous/application-contract.yaml");
export const applicationContractYaml = existsSync(applicationContractPath) ? readFileSync(applicationContractPath, "utf8") : "";

type Contract = { version?: number; routes?: { required?: string[]; critical_paths?: string[] }; architecture?: { protected_boundaries?: string[]; environment_expectations?: string[] }; rules?: Record<string, boolean | string>; repair?: { branch_prefix?: string; required_gates?: string[] }; deployment?: { provider?: string; strategy?: string; production_branch?: string; preview_branch_pattern?: string }; schedule?: { nightly_scan_utc?: string; experiment_policy?: string } };
const contract = parse(applicationContractYaml) as Contract;
const now = new Date();
const isoMinutesAgo = (minutes: number) => new Date(now.getTime() - minutes * 60_000).toISOString();

const initialEvidence: Record<InspectorKind, InspectionEvidence> = {
  route: { inspector: "route", status: "healthy", observedAt: isoMinutesAgo(3), summary: "4 required routes resolved without redirects.", artifacts: [{ label: "Route matrix", value: "4 / 4" }] },
  browser: { inspector: "browser", status: "healthy", observedAt: isoMinutesAgo(5), summary: "Critical navigation, dialog, and form controls are reachable.", artifacts: [{ label: "Playwright run", value: "18 checks" }] },
  console: { inspector: "console", status: "healthy", observedAt: isoMinutesAgo(3), summary: "No unhandled exceptions or hydration errors detected.", artifacts: [{ label: "Console", value: "0 errors" }] },
  network: { inspector: "network", status: "degraded", observedAt: isoMinutesAgo(4), summary: "One image request returned 404 on the gallery route.", artifacts: [{ label: "GET /images/gallery-cover.webp", value: "404" }] },
  accessibility: { inspector: "accessibility", status: "healthy", observedAt: isoMinutesAgo(6), summary: "Keyboard order and labeled controls meet the defined baseline.", artifacts: [{ label: "Violations", value: "0 critical" }] },
  performance: { inspector: "performance", status: "healthy", observedAt: isoMinutesAgo(7), summary: "Largest-contentful-paint is within the configured budget.", artifacts: [{ label: "LCP", value: "1.8s" }] },
  mobile: { inspector: "mobile", status: "healthy", observedAt: isoMinutesAgo(5), summary: "Primary controls remain within the 390px viewport.", artifacts: [{ label: "Viewport", value: "390 × 844" }] },
  visual: { inspector: "visual", status: "healthy", observedAt: isoMinutesAgo(6), summary: "No material baseline deviation was detected.", artifacts: [{ label: "Diff score", value: "0.2%" }] },
};

const findings: CorrelatedFinding[] = [
  { id: "finding-gallery-image", severity: "high", title: "Gallery fallback image is missing", affectedPath: "/gallery", confidence: 0.94, state: "candidate", evidence: [initialEvidence.network, { ...initialEvidence.browser, summary: "Gallery card renders an empty media region after the image request fails." }] },
  { id: "finding-contact-mobile", severity: "low", title: "Contact form label contrast is near threshold", affectedPath: "/contact", confidence: 0.71, state: "open", evidence: [initialEvidence.accessibility, initialEvidence.mobile] },
];

const candidates: RepairCandidate[] = [{ id: "candidate-gallery-fallback", title: "Guard missing gallery image source", branch: "heal/fix-broken-gallery", baseBranch: "main", status: "reviewing", changedFiles: ["src/components/GalleryCard.tsx", "tests/e2e/gallery-fallback.spec.ts"], summary: "Add a null-safe image resolver and a local visual fallback without changing gallery data contracts.", gates: { build: "passed", unit: "passed", e2e: "passed", visual: "passed", "preview-browser": "passed", "independent-review": "pending" }, reviewerDecision: "pending", previewUrl: "https://heal-fix-broken-gallery.vercel.app", createdAt: isoMinutesAgo(18) }];

const auditEvents: AuditEvent[] = [
  { id: "event-1", type: "inspection", title: "Nightly inspection completed", detail: "8 inspectors reported correlated evidence across 4 critical paths.", timestamp: isoMinutesAgo(3), tone: "success" },
  { id: "event-2", type: "branch", title: "Repair branch created", detail: "heal/fix-broken-gallery is isolated from main.", timestamp: isoMinutesAgo(18), tone: "neutral" },
  { id: "event-3", type: "preview", title: "Vercel Preview re-inspected", detail: "Build, browser, visual, and network gates passed on the candidate preview.", timestamp: isoMinutesAgo(11), tone: "success" },
  { id: "event-4", type: "review", title: "Independent review pending", detail: "The Reviewer must approve before the candidate can be promoted.", timestamp: isoMinutesAgo(2), tone: "warning" },
];
let autonomyLevel: AutonomyLevel = "repair";

export function validateApplicationContract() {
  const errors: string[] = [];
  if (contract.version !== 1) errors.push("The constitution must declare version 1.");
  if (contract.deployment?.provider !== "vercel") errors.push("Vercel must be the deployment provider.");
  if (contract.deployment?.strategy !== "preview_then_production") errors.push("Deployment must remain preview-first.");
  if (contract.deployment?.production_branch !== "main") errors.push("main must be the production branch.");
  if (contract.rules?.direct_production_modification !== "forbidden") errors.push("Direct production modification must be forbidden.");
  if (!contract.routes?.required?.includes("/")) errors.push("The root route must be defined as required.");
  if (!contract.routes?.critical_paths?.includes("preview-validation")) errors.push("Preview validation must be a critical path.");
  if (!contract.architecture?.protected_boundaries?.includes("authentication")) errors.push("Authentication must remain a protected boundary.");
  if (!contract.architecture?.environment_expectations?.includes("vercel-preview-url")) errors.push("Vercel Preview must be an environment expectation.");
  if (contract.repair?.branch_prefix !== "heal/") errors.push("Repair branches must use the heal/ prefix.");
  if (!contract.repair?.required_gates?.includes("independent-review")) errors.push("Independent review must be a required repair gate.");
  if (contract.deployment?.preview_branch_pattern !== "heal/*") errors.push("Preview branches must follow the heal/* pattern.");
  if (contract.schedule?.nightly_scan_utc !== "0 0 2 * * *") errors.push("Nightly scan cadence must remain explicit and UTC-based.");
  return { valid: errors.length === 0, errors, contract: applicationContractYaml };
}

export function getSnapshot() {
  const candidate = candidates[0];
  const eligibility = candidate ? evaluatePromotionEligibility(candidate) : { eligible: false, reasons: ["No candidate exists."] };
  return { application: { name: "Atlas Control Plane", environment: "Production guarded", productionBranch: "main", provider: "Vercel" }, autonomyLevel, contract: validateApplicationContract(), inspectors: Object.values(initialEvidence), findings, candidates, auditEvents, promotion: eligibility, memory: [{ kind: "incident", title: "Missing gallery image source", summary: "Undefined image URL produces an empty media region and a network 404.", protected: false }, { kind: "fix", title: "Null-safe media resolver", summary: "Use a fallback asset only at component boundaries; preserve API contracts.", protected: false }, { kind: "decision", title: "Do not modify authentication", summary: "Authentication is a protected boundary requiring operator escalation.", protected: true }, { kind: "architecture", title: "Preview-first Vercel delivery", summary: "main is production; heal/* branches produce a preview before promotion.", protected: true }], schedule: { enabled: true, cron: "0 0 2 * * *", timezone: "UTC", nextRun: "02:00 UTC" } };
}

export function setAutonomyLevel(level: AutonomyLevel) { autonomyLevel = level; auditEvents.unshift({ id: `event-${Date.now()}`, type: "memory", title: "Autonomy policy updated", detail: `Control plane entered ${level} mode.`, timestamp: new Date().toISOString(), tone: "neutral" }); return getSnapshot(); }
export function runInspection() { auditEvents.unshift({ id: `event-${Date.now()}`, type: "inspection", title: "Inspection queued", detail: "Route, browser, console, network, accessibility, performance, mobile, and visual inspectors are correlating evidence.", timestamp: new Date().toISOString(), tone: "success" }); return getSnapshot(); }

export function createCandidate(findingId: string, title: string): RepairCandidate {
  const finding = findings.find(item => item.id === findingId);
  if (!finding) throw new Error("Finding not found.");
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 52) || "safe-repair";
  const candidate: RepairCandidate = { id: `candidate-${Date.now()}`, title, branch: `heal/${slug}`, baseBranch: "main", status: "draft", changedFiles: ["src/components/TargetComponent.tsx", "tests/smoke/target-repair.spec.ts"], summary: `Minimal safe repair candidate for ${finding.title}.`, gates: { build: "pending", unit: "pending", e2e: "pending", visual: "pending", "preview-browser": "pending", "independent-review": "pending" }, reviewerDecision: "pending", previewUrl: "Pending Vercel Preview", createdAt: new Date().toISOString() };
  candidates.unshift(candidate); finding.state = "candidate";
  auditEvents.unshift({ id: `event-${Date.now()}`, type: "branch", title: "Repair candidate created", detail: `${candidate.branch} is an isolated candidate; main remains unchanged.`, timestamp: new Date().toISOString(), tone: "neutral" });
  return candidate;
}

export function reviewCandidate(candidateId: string, decision: "approved" | "rejected") {
  const candidate = candidates.find(item => item.id === candidateId);
  if (!candidate) throw new Error("Candidate not found.");
  candidate.reviewerDecision = decision; candidate.gates["independent-review"] = decision === "approved" ? "passed" : "failed"; candidate.status = decision === "approved" ? "approved" : "rejected";
  auditEvents.unshift({ id: `event-${Date.now()}`, type: "review", title: `Reviewer ${decision} candidate`, detail: `${candidate.branch} ${decision === "approved" ? "may be evaluated for production promotion" : "will be discarded and retained as an incident record"}.`, timestamp: new Date().toISOString(), tone: decision === "approved" ? "success" : "danger" });
  return { candidate, eligibility: evaluatePromotionEligibility(candidate) };
}

export function requestPromotion(candidateId: string) {
  const candidate = candidates.find(item => item.id === candidateId);
  if (!candidate) throw new Error("Candidate not found.");
  const eligibility = evaluatePromotionEligibility(candidate);
  if (!eligibility.eligible) { auditEvents.unshift({ id: `event-${Date.now()}`, type: "promotion", title: "Production promotion blocked", detail: eligibility.reasons.join(" "), timestamp: new Date().toISOString(), tone: "warning" }); return { promoted: false, eligibility }; }
  candidate.status = "promoted"; auditEvents.unshift({ id: `event-${Date.now()}`, type: "promotion", title: "Promotion request recorded", detail: `${candidate.branch} passed policy gates and is ready for the Vercel production promotion action.`, timestamp: new Date().toISOString(), tone: "success" }); return { promoted: true, eligibility };
}

export function discardCandidate(candidateId: string, reason: string) {
  const candidate = candidates.find(item => item.id === candidateId);
  if (!candidate) throw new Error("Candidate not found.");
  candidate.status = "discarded";
  candidate.reviewerDecision = "rejected";
  candidate.gates["independent-review"] = "failed";
  auditEvents.unshift({ id: `event-${Date.now()}`, type: "rollback", title: "Candidate discarded", detail: `${candidate.branch} was contained and discarded. ${reason}`, timestamp: new Date().toISOString(), tone: "danger" });
  return candidate;
}
