export const inspectorKinds = ["route", "browser", "console", "network", "accessibility", "performance", "mobile", "visual"] as const;

export type InspectorKind = (typeof inspectorKinds)[number];
export type FindingSeverity = "critical" | "high" | "medium" | "low" | "info";

export type InspectionEvidence = {
  inspector: InspectorKind;
  status: "healthy" | "degraded" | "failed" | "pending";
  observedAt: string;
  summary: string;
  artifacts: Array<{ label: string; href?: string; value?: string }>;
};

export type CorrelatedFinding = {
  id: string;
  severity: FindingSeverity;
  title: string;
  affectedPath: string;
  evidence: InspectionEvidence[];
  confidence: number;
  state: "open" | "candidate" | "resolved" | "accepted-risk";
};
