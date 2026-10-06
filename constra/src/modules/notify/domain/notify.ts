// Pure notification fan-out — no framework imports.
import type { RoleName } from "../../auth/domain/types";

export type NotifyEvent =
  | { kind: "bill_due"; billId: string; supplier: string; amount: number; dueDate: string }
  | { kind: "payment_overdue"; invoiceId: string; clientName: string; amount: number }
  | { kind: "wager_due"; projectId: string; dueDate: string; wagerCount: number; amount: number }
  | { kind: "stage_completed"; projectId: string; stageId: string; stageName: string }
  | { kind: "report_filed"; projectId: string; stageId: string; reportKind: string; filedBy: string }
  | { kind: "assignment_moved"; employeeId: string; employeeUserId?: string; fromProjectId: string; toProjectId: string };

export interface BuiltNotification {
  userId: string;
  type: string;
  title: string;
  link: string;
}

export type RolesMap = Record<string, { role: RoleName; permissions: string[] }>;

const isAdmin = (r: { role: RoleName }): boolean =>
  r.role === "super_admin" || r.role === "admin";
const isAccountant = (r: { role: RoleName }): boolean =>
  r.role === "accountant" || r.role === "super_admin";
const isForeman = (r: { role: RoleName }): boolean =>
  r.role === "foreman";

/** Pure fan-out: event + roles → per-user drafts (deduped). Persisting is the adapter's job. */
export function buildNotifications(
  event: NotifyEvent,
  roles: RolesMap,
): BuiltNotification[] {
  const out: BuiltNotification[] = [];
  const push = (userId: string, type: string, title: string, link: string): void => {
    if (!out.some((n) => n.userId === userId)) out.push({ userId, type, title, link });
  };

  switch (event.kind) {
    case "bill_due": {
      for (const [id, r] of Object.entries(roles)) {
        if (isAdmin(r) || r.role === "accountant") {
          push(id, "bill_due",
            `Bill due: ${event.supplier} AED ${event.amount} (${event.dueDate})`,
            `/bills?bill=${event.billId}`);
        }
      }
      break;
    }
    case "payment_overdue": {
      for (const [id, r] of Object.entries(roles)) {
        if (isAdmin(r)) {
          push(id, "payment_overdue",
            `Payment overdue: ${event.clientName} AED ${event.amount}`,
            "/finance");
        }
      }
      break;
    }
    case "wager_due": {
      for (const [id, r] of Object.entries(roles)) {
        if (isAdmin(r) || r.role === "accountant") {
          push(id, "wager_due",
            `${event.wagerCount} wager payouts due AED ${event.amount} (${event.dueDate})`,
            "/operations");
        }
      }
      break;
    }
    case "stage_completed": {
      for (const [id, r] of Object.entries(roles)) {
        if (isAdmin(r)) {
          push(id, "stage_completed",
            `Stage completed: ${event.stageName}`,
            `/projects/${event.projectId}`);
        }
      }
      break;
    }
    case "report_filed": {
      for (const [id, r] of Object.entries(roles)) {
        if (isAdmin(r)) {
          push(id, "report_filed",
            `Daily report filed (${event.reportKind})`,
            `/projects/${event.projectId}`);
        }
      }
      break;
    }
    case "assignment_moved": {
      if (event.employeeUserId) {
        push(event.employeeUserId, "assignment_moved",
          "You were assigned to a new project", "/dashboard");
      }
      for (const [id, r] of Object.entries(roles)) {
        if (isForeman(r)) {
          push(id, "assignment_moved",
            "Labour moved between projects", "/hr");
        }
      }
      break;
    }
  }
  return out;
}
