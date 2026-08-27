import type { Request, Response } from "express";
import { sdk } from "../_core/sdk";
import { assertActionAllowed } from "../autonomous/autonomy";
import { getDurableSnapshot, runDurableInspection } from "../autonomous/service";

export async function nightlyScanHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
    const snapshot = await getDurableSnapshot();
    assertActionAllowed(snapshot.autonomyLevel, "inspect", "automation");
    await runDurableInspection();
    return res.json({ ok: true, taskUid: user.taskUid, state: "completed", autonomyLevel: snapshot.autonomyLevel, policy: "observer-first, preview-first" });
  } catch (error) {
    const serialized = error instanceof Error ? { message: error.message, stack: error.stack } : { message: "Unknown scheduling error" };
    return res.status(500).json({ error: serialized, timestamp: new Date().toISOString(), context: { url: req.originalUrl } });
  }
}
