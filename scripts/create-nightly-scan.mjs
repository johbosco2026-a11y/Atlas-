import { execFileSync } from "node:child_process";

const args = [
  "create",
  "--name", "atlas-nightly-scan",
  "--cron", "0 0 2 * * *",
  "--path", "/api/scheduled/nightly-scan",
  "--description", "Nightly autonomous application inspection for the Atlas Control Plane",
];

execFileSync("manus-heartbeat", args, { stdio: "inherit" });
