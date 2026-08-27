import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { analyzeFindingWithFounderLayer } from "./autonomous/brain";
import { getSnapshot, validateApplicationContract } from "./autonomous/controlPlane";
import { getApplicationMap } from "./autonomous/discovery";
import { createDurableCandidate, createGovernedExperiment, decideGovernedExperiment, discardDurableCandidate, getDurableSnapshot, persistDiscoveredApplicationMap, requestDurablePromotion, reviewDurableCandidate, runDurableInspection, setDurableAutonomy } from "./autonomous/service";
import { assertActionAllowed, type GovernanceActor } from "./autonomous/autonomy";
import { retrieveRelevantEngineeringMemory } from "./autonomous/memory";

export const controlPlaneRouter = router({
  snapshot: publicProcedure.query(() => getDurableSnapshot()),
  validateConstitution: publicProcedure.query(() => validateApplicationContract()),
  discoverApplication: publicProcedure.query(async () => persistDiscoveredApplicationMap(await getApplicationMap())),
  runInspection: publicProcedure.input(z.object({ actor: z.enum(["operator", "automation"]).default("operator") }).optional()).mutation(async ({ input }) => { const snapshot = await getDurableSnapshot(); assertActionAllowed(snapshot.autonomyLevel, "inspect", input?.actor ?? "operator"); return runDurableInspection(); }),
  setAutonomy: publicProcedure.input(z.enum(["observer", "repair", "autonomous", "self-optimizing"])).mutation(({ input }) => setDurableAutonomy(input)),
  createCandidate: publicProcedure.input(z.object({ findingId: z.string(), title: z.string().min(4).max(100), actor: z.enum(["operator", "automation"]).default("operator") })).mutation(async ({ input }) => { const snapshot = await getDurableSnapshot(); assertActionAllowed(snapshot.autonomyLevel, "create-candidate", input.actor as GovernanceActor); return createDurableCandidate(input.findingId, input.title); }),
  reviewCandidate: publicProcedure.input(z.object({ candidateId: z.string(), decision: z.enum(["approved", "rejected"]), actor: z.literal("operator").default("operator") })).mutation(async ({ input }) => { const snapshot = await getDurableSnapshot(); assertActionAllowed(snapshot.autonomyLevel, "review", input.actor); return reviewDurableCandidate(input.candidateId, input.decision); }),
  discardCandidate: publicProcedure.input(z.object({ candidateId: z.string(), reason: z.string().min(4).max(500), actor: z.literal("operator").default("operator") })).mutation(({ input }) => discardDurableCandidate(input.candidateId, input.reason)),
  requestPromotion: publicProcedure.input(z.object({ candidateId: z.string(), actor: z.enum(["operator", "automation"]).default("operator") })).mutation(async ({ input }) => { const snapshot = await getDurableSnapshot(); assertActionAllowed(snapshot.autonomyLevel, "request-promotion", input.actor as GovernanceActor); return requestDurablePromotion(input.candidateId); }),
  diagnoseFinding: publicProcedure.input(z.object({ findingId: z.string() })).mutation(async ({ input }) => { const finding = (await getDurableSnapshot()).findings.find(item => item.id === input.findingId) ?? getSnapshot().findings.find(item => item.id === input.findingId); if (!finding) throw new Error("Finding not found."); const memory = await retrieveRelevantEngineeringMemory(`${finding.title} ${finding.affectedPath} ${finding.evidence.map(item => item.summary).join(" ")}`); return analyzeFindingWithFounderLayer(finding, memory); }),
  createExperiment: publicProcedure.input(z.object({ hypothesis: z.string().min(10).max(1000), metric: z.string().min(2).max(128), controlDescription: z.string().min(10).max(1000), candidateDescription: z.string().min(10).max(1000), actor: z.enum(["operator", "automation"]).default("operator") })).mutation(async ({ input }) => { const snapshot = await getDurableSnapshot(); assertActionAllowed(snapshot.autonomyLevel, "run-experiment", input.actor as GovernanceActor); return createGovernedExperiment(input); }),
  decideExperiment: publicProcedure.input(z.object({ experimentKey: z.string(), decision: z.enum(["kept", "reverted"]), rationale: z.string().min(10).max(1000), actor: z.literal("operator").default("operator") })).mutation(({ input }) => decideGovernedExperiment(input.experimentKey, input.decision, input.rationale)),
});
