import { desc } from "drizzle-orm";
import { engineeringMemoryRecords } from "../../drizzle/schema";
import { rankRelevantMemory, type EngineeringMemory } from "../../autonomous/memory/contracts";
import { getDb } from "../db";

export async function retrieveRelevantEngineeringMemory(query: string): Promise<EngineeringMemory[]> {
  const db = await getDb();
  if (!db) return [];
  const records = await db.select().from(engineeringMemoryRecords).orderBy(desc(engineeringMemoryRecords.updatedAt)).limit(100);
  const mapped: EngineeringMemory[] = records.map(record => ({ id: String(record.id), kind: record.memoryType, title: record.title, pattern: record.pattern, summary: record.summary, protected: record.protected === "true", createdAt: record.createdAt.toISOString(), tags: record.tags?.split(",").map(tag => tag.trim()).filter(Boolean) ?? [] }));
  return rankRelevantMemory(query, mapped);
}
