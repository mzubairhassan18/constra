// Pure notification fan-out — no framework imports.
import type { RoleName } from "../../auth/domain/types";

export type NotifyEvent =
  | { kind: "bill_due"; billId: string; supplier: string; amount: number; dueDate: string }
  | { kind: "payment_overdue"; invoiceId: string; clientName: string; amount: number }
  | { kind: "wager_due"; projectId: string; dueDate: string; wagerCount: number; amount: number }
  | { kind: "stage_completed"; projectId: string; stageId: string; stageName: string }
  | { kind: "report_filed"; projectId: string; stageId: string; reportKind: string; filedBy: string }
  | { kind: "bill_posted"; billId: string; label: string; gross: number }
  | { kind: "invoice_posted"; invoiceId: string; label: string; gross: number }
  | { kind: "payment_received"; invoiceId: string; label: string; amount: number }
  | { kind: "request_filed"; projectName: string; itemCount: number }
  | { kind: "request_decided"; status: string; projectName: string }
  | { kind: "client_message"; fromName: string; projectName: string }
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
const isHr = (r: { role: RoleName }): boolean =>
  r.role === "hr" || r.role === "super_admin";

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
        if (isForeman(r) || isHr(r)) {
          push(id, "assignment_moved",
            "Labour moved between projects", "/hr");
        }
      }
      break;
    }
    case "bill_posted": {
      for (const [id, r] of Object.entries(roles)) {
        if (isAdmin(r) || isAccountant(r)) {
          push(id, "bill_posted",
            `Bill posted: ${event.label} — AED ${event.gross}`,
            "/bills");
        }
      }
      break;
    }
    case "invoice_posted": {
      for (const [id, r] of Object.entries(roles)) {
        if (isAdmin(r) || isAccountant(r)) {
          push(id, "invoice_posted",
            `Client invoice issued: ${event.label} — AED ${event.gross}`,
            "/finance");
        }
      }
      break;
    }
    case "payment_received": {
      for (const [id, r] of Object.entries(roles)) {
        if (isAdmin(r) || isAccountant(r)) {
          push(id, "payment_received",
            `Payment received: ${event.label} — AED ${event.amount}`,
            "/finance");
        }
      }
      break;
    }
    case "request_filed": {
      for (const [id, r] of Object.entries(roles)) {
        if (isAdmin(r)) {
          push(id, "request_filed",
            `Material request: ${event.itemCount} item(s) for ${event.projectName}`,
            "/operations");
        }
      }
      break;
    }
    case "request_decided": {
      for (const [id, r] of Object.entries(roles)) {
        if (isForeman(r) || isAdmin(r)) {
          push(id, "request_decided",
            `Material request ${event.status}: ${event.projectName}`,
            "/operations");
        }
      }
      break;
    }
    case "client_message": {
      for (const [id, r] of Object.entries(roles)) {
        if (isAdmin(r)) {
          push(id, "client_message",
            `Client message from ${event.fromName} (${event.projectName})`,
            "/client");
        }
      }
      break;
    }
  }
  return out;
}
