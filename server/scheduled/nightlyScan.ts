import { createHash, timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";
import { sdk } from "../_core/sdk";
import { assertActionAllowed } from "../autonomous/autonomy";
import { getDurableSnapshot, runDurableInspection } from "../autonomous/service";

export function isValidVercelCronAuthorization(
  authorization: string | undefined,
  secret = process.env.CRON_SECRET,
): boolean {
  const expected = createHash("sha256").update("Bearer " + (secret ?? "")).digest();
  const actual = createHash("sha256").update(authorization ?? "").digest();
  const matches = timingSafeEqual(expected, actual);
  return Boolean(secret) && Boolean(authorization) && matches;
}

export function isAuthenticatedManusCronUser(
  user: { isCron?: boolean; taskUid?: string } | null | undefined,
): boolean {
  return Boolean(user?.isCron && user.taskUid);
}

export function safeScheduledErrorPayload() {
  return { error: "nightly-scan-failed", timestamp: new Date().toISOString() };
}

export async function nightlyScanHandler(req: Request, res: Response) {
  try {
    const isVercelCron = req.method === "GET";
    if (isVercelCron && !isValidVercelCronAuthorization(req.get("authorization"))) {
      return res.status(401).json({ error: "invalid-cron-authorization" });
    }

    let taskUid: string | undefined;
    if (!isVercelCron) {
      const user = await sdk.authenticateRequest(req);
      if (!isAuthenticatedManusCronUser(user)) return res.status(403).json({ error: "cron-only" });
      taskUid = user.taskUid;
    }

    const snapshot = await getDurableSnapshot();
    assertActionAllowed(snapshot.autonomyLevel, "inspect", "automation");
    await runDurableInspection();

    return res.json({
      ok: true,
      taskUid: taskUid ?? null,
      trigger: isVercelCron ? "vercel-cron" : "manus-heartbeat",
      state: "completed",
      autonomyLevel: snapshot.autonomyLevel,
      policy: "observer-first, preview-first",
    });
  } catch (error) {
    console.error("[NightlyScan] failed", error);
    return res.status(500).json(safeScheduledErrorPayload());
  }
}
