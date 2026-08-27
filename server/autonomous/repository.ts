import { desc } from "drizzle-orm";
import { applicationMaps, autonomyConfigurations, engineeringMemoryRecords, experimentRecords, governanceAuditEvents, inspectionFindings, repairCandidates } from "../../drizzle/schema";
import { getDb } from "../db";

export async function loadDurableControlPlaneRecords() {
  const db = await getDb();
  if (!db) return null;
  const [findings, candidates, audits, memory, autonomy, maps, experiments] = await Promise.all([
    db.select().from(inspectionFindings).orderBy(desc(inspectionFindings.updatedAt)).limit(100),
    db.select().from(repairCandidates).orderBy(desc(repairCandidates.updatedAt)).limit(100),
    db.select().from(governanceAuditEvents).orderBy(desc(governanceAuditEvents.createdAt)).limit(100),
    db.select().from(engineeringMemoryRecords).orderBy(desc(engineeringMemoryRecords.updatedAt)).limit(100),
    db.select().from(autonomyConfigurations).orderBy(desc(autonomyConfigurations.updatedAt)).limit(1),
    db.select().from(applicationMaps).orderBy(desc(applicationMaps.generatedAt)).limit(1),
    db.select().from(experimentRecords).orderBy(desc(experimentRecords.updatedAt)).limit(50),
  ]);
  return { findings, candidates, audits, memory, autonomy: autonomy[0] ?? null, map: maps[0] ?? null, experiments };
}

export async function saveFinding(input: typeof inspectionFindings.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(inspectionFindings).values(input).onDuplicateKeyUpdate({ set: { severity: input.severity, title: input.title, affectedPath: input.affectedPath, state: input.state, confidenceBasisPoints: input.confidenceBasisPoints, evidence: input.evidence } });
  return true;
}

export async function saveRepairCandidate(input: typeof repairCandidates.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(repairCandidates).values(input).onDuplicateKeyUpdate({ set: { title: input.title, status: input.status, summary: input.summary, changedFiles: input.changedFiles, gates: input.gates, reviewerDecision: input.reviewerDecision, previewUrl: input.previewUrl } });
  return true;
}

export async function saveAuditEvent(input: typeof governanceAuditEvents.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(governanceAuditEvents).values(input);
  return true;
}

export async function saveAutonomy(level: "observer" | "repair" | "autonomous" | "self-optimizing", nightlyCron = "0 0 2 * * *") {
  const db = await getDb();
  if (!db) return null;
  await db.insert(autonomyConfigurations).values({ autonomyLevel: level, nightlyCron, experimentsEnabled: level === "self-optimizing" ? "true" : "false" });
  return true;
}

export async function saveApplicationMap(sourceRevision: string, manifest: string) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(applicationMaps).values({ sourceRevision, manifest });
  return true;
}

export async function saveEngineeringMemory(input: typeof engineeringMemoryRecords.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(engineeringMemoryRecords).values(input);
  return true;
}

export async function saveExperiment(input: typeof experimentRecords.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(experimentRecords).values(input).onDuplicateKeyUpdate({ set: { status: input.status, decisionRationale: input.decisionRationale } });
  return true;
}
