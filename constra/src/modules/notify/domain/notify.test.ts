import { describe, expect, it } from "vitest";
import type { RoleName } from "../../auth/domain/types";
import {
  buildNotifications,
  type BuiltNotification,
  type NotifyEvent,
  type RolesMap,
} from "./notify";

type RoleEntry = { role: RoleName; permissions: string[] };

const ROLES: Record<string, RoleEntry> = {
  "u-super": { role: "super_admin", permissions: ["*"] },
  "u-admin": { role: "admin", permissions: ["projects.*", "finance.*"] },
  "u-acct": { role: "accountant", permissions: ["finance.*"] },
  "u-foreman": { role: "foreman", permissions: ["operations.report"] },
  "u-foreman-2": { role: "foreman", permissions: ["operations.report"] },
  "u-client": { role: "client", permissions: ["portal.read"] },
};

const asRolesMap = (r: Record<string, RoleEntry>): RolesMap =>
  r as RolesMap;

const userIds = (out: BuiltNotification[]): string[] =>
  out.map((n) => n.userId);

const expectNoDuplicates = (out: BuiltNotification[]): void => {
  const ids = userIds(out);
  expect(new Set(ids).size).toBe(ids.length);
};

describe("buildNotifications — bill_due", () => {
  const event: NotifyEvent = {
    kind: "bill_due",
    billId: "b-1",
    supplier: "Al Noor Materials",
    amount: 1250,
    dueDate: "2026-10-10",
  };

  it("notifies admins (incl. super_admin) + accountants only", () => {
    const out = buildNotifications(event, asRolesMap(ROLES));
    expect(userIds(out).sort()).toEqual(
      ["u-acct", "u-admin", "u-super"].sort(),
    );
  });

  it("never notifies foreman or client roles", () => {
    const out = buildNotifications(event, asRolesMap(ROLES));
    expect(userIds(out)).not.toContain("u-foreman");
    expect(userIds(out)).not.toContain("u-foreman-2");
    expect(userIds(out)).not.toContain("u-client");
  });

  it("link points at the bill and every draft has userId/type/title/link", () => {
    const out = buildNotifications(event, asRolesMap(ROLES));
    expect(out.length).toBeGreaterThan(0);
    for (const n of out) {
      expect(n.userId.length).toBeGreaterThan(0);
      expect(n.type.length).toBeGreaterThan(0);
      expect(n.title.length).toBeGreaterThan(0);
      expect(n.link).toContain("b-1");
    }
  });

  it("emits no duplicate userIds", () => {
    const out = buildNotifications(event, asRolesMap(ROLES));
    expectNoDuplicates(out);
  });
});

describe("buildNotifications — payment_overdue", () => {
  const event: NotifyEvent = {
    kind: "payment_overdue",
    invoiceId: "inv-9",
    clientName: "Villa Client",
    amount: 5000,
  };

  it("notifies admins with link /finance", () => {
    const out = buildNotifications(event, asRolesMap(ROLES));
    expect(userIds(out).sort()).toEqual(["u-admin", "u-super"].sort());
    for (const n of out) expect(n.link).toBe("/finance");
  });

  it("never notifies client/accountant/foreman roles", () => {
    const out = buildNotifications(event, asRolesMap(ROLES));
    expect(userIds(out)).not.toContain("u-client");
    expect(userIds(out)).not.toContain("u-acct");
    expect(userIds(out)).not.toContain("u-foreman");
  });

  it("emits no duplicates", () => {
    expectNoDuplicates(buildNotifications(event, asRolesMap(ROLES)));
  });
});

describe("buildNotifications — wager_due", () => {
  const event: NotifyEvent = {
    kind: "wager_due",
    projectId: "p-1",
    dueDate: "2026-10-07",
    wagerCount: 4,
    amount: 800,
  };

  it("notifies admins + accountants, never client", () => {
    const out = buildNotifications(event, asRolesMap(ROLES));
    expect(userIds(out).sort()).toEqual(
      ["u-acct", "u-admin", "u-super"].sort(),
    );
    expect(userIds(out)).not.toContain("u-client");
  });

  it("emits no duplicates", () => {
    expectNoDuplicates(buildNotifications(event, asRolesMap(ROLES)));
  });
});

describe("buildNotifications — stage_completed", () => {
  const event: NotifyEvent = {
    kind: "stage_completed",
    projectId: "p-42",
    stageId: "s-7",
    stageName: "Foundation",
  };

  it("notifies admins with link /projects/<id>", () => {
    const out = buildNotifications(event, asRolesMap(ROLES));
    expect(userIds(out).sort()).toEqual(["u-admin", "u-super"].sort());
    for (const n of out) expect(n.link).toBe("/projects/p-42");
  });

  it("never notifies client role", () => {
    const out = buildNotifications(event, asRolesMap(ROLES));
    expect(userIds(out)).not.toContain("u-client");
  });

  it("emits no duplicates", () => {
    expectNoDuplicates(buildNotifications(event, asRolesMap(ROLES)));
  });
});

describe("buildNotifications — report_filed", () => {
  const event: NotifyEvent = {
    kind: "report_filed",
    projectId: "p-42",
    stageId: "s-7",
    reportKind: "delay",
    filedBy: "u-foreman",
  };

  it("notifies admins, never client", () => {
    const out = buildNotifications(event, asRolesMap(ROLES));
    expect(userIds(out).sort()).toEqual(["u-admin", "u-super"].sort());
    expect(userIds(out)).not.toContain("u-client");
  });

  it("link references the project", () => {
    const out = buildNotifications(event, asRolesMap(ROLES));
    for (const n of out) expect(n.link).toContain("p-42");
  });

  it("emits no duplicates", () => {
    expectNoDuplicates(buildNotifications(event, asRolesMap(ROLES)));
  });
});

describe("buildNotifications — assignment_moved", () => {
  const event: NotifyEvent = {
    kind: "assignment_moved",
    employeeId: "e-5",
    employeeUserId: "u-wager",
    fromProjectId: "p-1",
    toProjectId: "p-2",
  };

  it("notifies the moved employee plus foremen (not admins/clients)", () => {
    const roles = asRolesMap({
      ...ROLES,
      "u-wager": { role: "foreman", permissions: ["operations.report"] },
    });
    const out = buildNotifications(event, roles);
    expect(userIds(out).sort()).toEqual(
      ["u-foreman", "u-foreman-2", "u-wager"].sort(),
    );
    expect(userIds(out)).not.toContain("u-admin");
    expect(userIds(out)).not.toContain("u-client");
  });

  it("dedupes when the moved employee is also a foreman", () => {
    const roles = asRolesMap({
      "u-foreman": { role: "foreman", permissions: ["operations.report"] },
      "u-client": { role: "client", permissions: ["portal.read"] },
    });
    const dup: NotifyEvent = { ...event, employeeUserId: "u-foreman" };
    const out = buildNotifications(dup, roles);
    expect(userIds(out)).toEqual(["u-foreman"]);
    expectNoDuplicates(out);
  });
});

describe("buildNotifications — edge cases", () => {
  it("returns [] for an empty roles map without throwing", () => {
    const event: NotifyEvent = {
      kind: "bill_due",
      billId: "b-x",
      supplier: "Nobody",
      amount: 1,
      dueDate: "2026-10-10",
    };
    expect(buildNotifications(event, asRolesMap({}))).toEqual([]);
  });
});
