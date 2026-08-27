import type { AutonomyLevel } from "./controlPlane";

export type GovernanceActor = "operator" | "automation";
export type GovernedAction = "inspect" | "create-candidate" | "request-promotion" | "run-experiment" | "review";

const automationPermissions: Record<AutonomyLevel, GovernedAction[]> = {
  observer: ["inspect"],
  repair: ["inspect", "create-candidate"],
  autonomous: ["inspect", "create-candidate", "request-promotion"],
  "self-optimizing": ["inspect", "create-candidate", "request-promotion", "run-experiment"],
};

export function isActionAllowed(level: AutonomyLevel, action: GovernedAction, actor: GovernanceActor): boolean {
  if (actor === "operator") return true;
  if (action === "review") return false;
  return automationPermissions[level].includes(action);
}

export function assertActionAllowed(level: AutonomyLevel, action: GovernedAction, actor: GovernanceActor): void {
  if (!isActionAllowed(level, action, actor)) {
    throw new Error(`Autonomy policy blocks ${actor} from performing ${action} while the control plane is in ${level} mode.`);
  }
}
