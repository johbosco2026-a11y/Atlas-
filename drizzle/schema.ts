import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(), openId: varchar("openId", { length: 64 }).notNull().unique(), name: text("name"), email: varchar("email", { length: 320 }), loginMethod: varchar("loginMethod", { length: 64 }), role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(), lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const governanceAuditEvents = mysqlTable("governanceAuditEvents", {
  id: int("id").autoincrement().primaryKey(), eventType: mysqlEnum("eventType", ["inspection", "branch", "preview", "review", "promotion", "rollback", "memory"]).notNull(), title: varchar("title", { length: 255 }).notNull(), detail: text("detail").notNull(), branch: varchar("branch", { length: 128 }), previewUrl: varchar("previewUrl", { length: 512 }), outcome: varchar("outcome", { length: 64 }).notNull(), payload: text("payload"), createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const engineeringMemoryRecords = mysqlTable("engineeringMemoryRecords", {
  id: int("id").autoincrement().primaryKey(), memoryType: mysqlEnum("memoryType", ["incident", "fix", "architecture", "decision"]).notNull(), title: varchar("title", { length: 255 }).notNull(), pattern: text("pattern").notNull(), summary: text("summary").notNull(), tags: text("tags"), protected: mysqlEnum("protected", ["true", "false"]).default("false").notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const autonomyConfigurations = mysqlTable("autonomyConfigurations", {
  id: int("id").autoincrement().primaryKey(), autonomyLevel: mysqlEnum("autonomyLevel", ["observer", "repair", "autonomous", "self-optimizing"]).default("repair").notNull(), nightlyCron: varchar("nightlyCron", { length: 64 }).notNull(), experimentsEnabled: mysqlEnum("experimentsEnabled", ["true", "false"]).default("false").notNull(), scheduleCronTaskUid: varchar("schedule_cron_task_uid", { length: 65 }), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const inspectionFindings = mysqlTable("inspectionFindings", {
  id: int("id").autoincrement().primaryKey(), findingKey: varchar("findingKey", { length: 128 }).notNull().unique(), severity: mysqlEnum("severity", ["critical", "high", "medium", "low", "info"]).notNull(), title: varchar("title", { length: 255 }).notNull(), affectedPath: varchar("affectedPath", { length: 512 }).notNull(), state: mysqlEnum("state", ["open", "candidate", "resolved", "accepted-risk"]).notNull(), confidenceBasisPoints: int("confidenceBasisPoints").notNull(), evidence: text("evidence").notNull(), discoveredAt: timestamp("discoveredAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const repairCandidates = mysqlTable("repairCandidates", {
  id: int("id").autoincrement().primaryKey(), candidateKey: varchar("candidateKey", { length: 128 }).notNull().unique(), title: varchar("title", { length: 255 }).notNull(), branch: varchar("branch", { length: 128 }).notNull().unique(), baseBranch: varchar("baseBranch", { length: 128 }).notNull(), status: mysqlEnum("status", ["draft", "preview-ready", "reviewing", "approved", "rejected", "discarded", "promoted"]).notNull(), summary: text("summary").notNull(), changedFiles: text("changedFiles").notNull(), gates: text("gates").notNull(), reviewerDecision: mysqlEnum("reviewerDecision", ["pending", "approved", "rejected"]).notNull(), previewUrl: varchar("previewUrl", { length: 512 }), createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const applicationMaps = mysqlTable("applicationMaps", {
  id: int("id").autoincrement().primaryKey(), sourceRevision: varchar("sourceRevision", { length: 128 }).notNull(), manifest: text("manifest").notNull(), generatedAt: timestamp("generatedAt").defaultNow().notNull(),
});

export const experimentRecords = mysqlTable("experimentRecords", {
  id: int("id").autoincrement().primaryKey(), experimentKey: varchar("experimentKey", { length: 128 }).notNull().unique(), hypothesis: text("hypothesis").notNull(), metric: varchar("metric", { length: 128 }).notNull(), controlDescription: text("controlDescription").notNull(), candidateDescription: text("candidateDescription").notNull(), status: mysqlEnum("status", ["draft", "preview", "measuring", "kept", "reverted"]).notNull(), decisionRationale: text("decisionRationale"), createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
