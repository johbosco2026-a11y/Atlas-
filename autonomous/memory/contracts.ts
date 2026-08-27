export const memoryKinds = ["incident", "fix", "architecture", "decision"] as const;
export type MemoryKind = (typeof memoryKinds)[number];

export type EngineeringMemory = { id: string; kind: MemoryKind; title: string; pattern: string; summary: string; protected: boolean; createdAt: string; tags: string[] };

export function rankRelevantMemory(query: string, records: EngineeringMemory[]): EngineeringMemory[] {
  const terms = query.toLowerCase().split(/\W+/).filter(Boolean);
  return [...records].map(record => ({ record, score: terms.reduce((score, term) => score + Number(record.summary.toLowerCase().includes(term) || record.pattern.toLowerCase().includes(term)), 0) })).filter(item => item.score > 0).sort((a, b) => b.score - a.score).map(item => item.record);
}
