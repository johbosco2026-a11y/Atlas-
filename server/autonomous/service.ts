import type { CorrelatedFinding } from "../../autonomous/inspection/contracts";
import { createCandidate, discardCandidate, getSnapshot, requestPromotion, reviewCandidate, runInspection, setAutonomyLevel, type AutonomyLevel, type RepairCandidate } from "./controlPlane";
import { loadDurableControlPlaneRecords, requireDurableControlPlaneStore, saveApplicationMap, saveAuditEvent, saveAutonomy, saveEngineeringMemory, saveExperiment, saveFinding, saveRepairCandidate } from "./repository";

let seeded = false;

function persistCandidate(candidate: RepairCandidate) {
  return saveRepairCandidate({ candidateKey: candidate.id, title: candidate.title, branch: candidate.branch, baseBranch: candidate.baseBranch, status: candidate.status, summary: candidate.summary, changedFiles: JSON.stringify(candidate.changedFiles), gates: JSON.stringify(candidate.gates), reviewerDecision: candidate.reviewerDecision, previewUrl: candidate.previewUrl });
}

function persistFinding(finding: CorrelatedFinding) {
  return saveFinding({ findingKey: finding.id, severity: finding.severity, title: finding.title, affectedPath: finding.affectedPath, state: finding.state, confidenceBasisPoints: Math.round(finding.confidence * 10_000), evidence: JSON.stringify(finding.evidence) });
}

async function persistLatestAudit() {
  const event = getSnapshot().auditEvents[0];
  if (!event) return null;
  return saveAuditEvent({ eventType: event.type, title: event.title, detail: event.detail, outcome: event.tone, payload: JSON.stringify(event) });
}

async function ensureDurableSeed() {
  if (seeded) return;
  const current = await loadDurableControlPlaneRecords();
  if (!current || current.findings.length > 0) { seeded = true; return; }
  const snapshot = getSnapshot();
  await Promise.all([
    ...snapshot.findings.map(persistFinding),
    ...snapshot.candidates.map(persistCandidate),
    ...snapshot.auditEvents.map(event => saveAuditEvent({ eventType: event.type, title: event.title, detail: event.detail, outcome: event.tone, payload: JSON.stringify(event) })),
    ...snapshot.memory.map(record => saveEngineeringMemory({ memoryType: record.kind as "incident" | "fix" | "architecture" | "decision", title: record.title, pattern: record.title, summary: record.summary, protected: record.protected ? "true" : "false" })),
    saveAutonomy(snapshot.autonomyLevel),
  ]);
  seeded = true;
}

export async function getDurableSnapshot() {
  await ensureDurableSeed();
  const base = getSnapshot();
  const stored = await loadDurableControlPlaneRecords();
  if (!stored) return base;
  const findings = stored.findings.map(row => ({ id: row.findingKey, severity: row.severity, title: row.title, affectedPath: row.affectedPath, confidence: row.confidenceBasisPoints / 10_000, state: row.state, evidence: JSON.parse(row.evidence) })) as CorrelatedFinding[];
  const candidates = stored.candidates.map(row => ({ id: row.candidateKey, title: row.title, branch: row.branch, baseBranch: row.baseBranch as "main", status: row.status, changedFiles: JSON.parse(row.changedFiles), summary: row.summary, gates: JSON.parse(row.gates), reviewerDecision: row.reviewerDecision, previewUrl: row.previewUrl ?? "Pending Vercel Preview", createdAt: row.createdAt.toISOString() })) as RepairCandidate[];
  const auditEvents = stored.audits.map(row => ({ id: String(row.id), type: row.eventType, title: row.title, detail: row.detail, timestamp: row.createdAt.toISOString(), tone: row.outcome as "success" | "warning" | "neutral" | "danger" }));
  const memory = stored.memory.map(row => ({ kind: row.memoryType, title: row.title, summary: row.summary, protected: row.protected === "true" }));
  return { ...base, autonomyLevel: (stored.autonomy?.autonomyLevel ?? base.autonomyLevel) as AutonomyLevel, findings, candidates, auditEvents, memory, schedule: { ...base.schedule, cron: stored.autonomy?.nightlyCron ?? base.schedule.cron }, applicationMap: stored.map ? JSON.parse(stored.map.manifest) : null, experiments: stored.experiments };
}

export async function runDurableInspection() { await requireDurableControlPlaneStore(); const result = runInspection(); await persistLatestAudit(); return getDurableSnapshot(); }
export async function setDurableAutonomy(level: AutonomyLevel) { await requireDurableControlPlaneStore(); setAutonomyLevel(level); await saveAutonomy(level); await persistLatestAudit(); return getDurableSnapshot(); }
export async function createDurableCandidate(findingId: string, title: string) { await requireDurableControlPlaneStore(); const candidate = createCandidate(findingId, title); const finding = getSnapshot().findings.find(item => item.id === findingId); await Promise.all([persistCandidate(candidate), finding ? persistFinding(finding) : Promise.resolve(null), persistLatestAudit()]); return candidate; }
export async function reviewDurableCandidate(candidateId: string, decision: "approved" | "rejected") { await requireDurableControlPlaneStore(); const result = reviewCandidate(candidateId, decision); await Promise.all([persistCandidate(result.candidate), persistLatestAudit()]); return result; }
export async function discardDurableCandidate(candidateId: string, reason: string) { await requireDurableControlPlaneStore(); const candidate = discardCandidate(candidateId, reason); await Promise.all([persistCandidate(candidate), persistLatestAudit()]); return candidate; }
export async function requestDurablePromotion(candidateId: string) { await requireDurableControlPlaneStore(); const result = requestPromotion(candidateId); const candidate = getSnapshot().candidates.find(item => item.id === candidateId); await Promise.all([candidate ? persistCandidate(candidate) : Promise.resolve(null), persistLatestAudit()]); return result; }
export async function persistDiscoveredApplicationMap<T>(manifest: T): Promise<T> { await requireDurableControlPlaneStore(); await saveApplicationMap(`workspace-${Date.now()}`, JSON.stringify(manifest)); return manifest; }
export async function createGovernedExperiment(input: { hypothesis: string; metric: string; controlDescription: string; candidateDescription: string }) { await requireDurableControlPlaneStore(); const experimentKey = `experiment-${Date.now()}`; await saveExperiment({ experimentKey, hypothesis: input.hypothesis, metric: input.metric, controlDescription: input.controlDescription, candidateDescription: input.candidateDescription, status: "draft" }); await saveAuditEvent({ eventType: "memory", title: "Governed experiment drafted", detail: `Experiment ${experimentKey} is awaiting preview measurement and an explicit keep-or-revert decision.`, outcome: "neutral", payload: JSON.stringify({ experimentKey, ...input }) }); return { experimentKey, status: "draft" as const }; }
export async function decideGovernedExperiment(experimentKey: string, decision: "kept" | "reverted", rationale: string) { await requireDurableControlPlaneStore(); await saveExperiment({ experimentKey, hypothesis: "Recorded in existing experiment", metric: "Recorded in existing experiment", controlDescription: "Recorded in existing experiment", candidateDescription: "Recorded in existing experiment", status: decision, decisionRationale: rationale }); await saveAuditEvent({ eventType: "memory", title: `Experiment ${decision}`, detail: rationale, outcome: decision === "kept" ? "success" : "warning", payload: JSON.stringify({ experimentKey, decision }) }); return { experimentKey, status: decision, rationale }; }
