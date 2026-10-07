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
  "u-hr": { role: "hr", permissions: ["hr.*"] },
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

  it("notifies the moved employee plus foremen and HR (not admins/clients)", () => {
    const roles = asRolesMap({
      ...ROLES,
      "u-wager": { role: "foreman", permissions: ["operations.report"] },
    });
    const out = buildNotifications(event, roles);
    expect(userIds(out).sort()).toEqual(
      ["u-foreman", "u-foreman-2", "u-hr", "u-super", "u-wager"].sort(),
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

describe("buildNotifications — money + site events", () => {
  it("bill_posted notifies admins + accountants with /bills link", () => {
    const out = buildNotifications(
      { kind: "bill_posted", billId: "b-2", label: "INV-9", gross: 1050 },
      asRolesMap(ROLES),
    );
    expect(userIds(out).sort()).toEqual(["u-acct", "u-admin", "u-super"].sort());
    for (const n of out) expect(n.link).toBe("/bills");
    expectNoDuplicates(out);
  });

  it("invoice_posted + payment_received notify admins + accountants", () => {
    const inv = buildNotifications(
      { kind: "invoice_posted", invoiceId: "i-1", label: "INV-1", gross: 2100 },
      asRolesMap(ROLES),
    );
    expect(userIds(inv).sort()).toEqual(["u-acct", "u-admin", "u-super"].sort());
    const pay = buildNotifications(
      { kind: "payment_received", invoiceId: "i-1", label: "INV-1", amount: 1000 },
      asRolesMap(ROLES),
    );
    expect(userIds(pay).sort()).toEqual(["u-acct", "u-admin", "u-super"].sort());
    expect(userIds(pay)).not.toContain("u-client");
  });

  it("request_filed notifies admins; request_decided notifies foremen + admins", () => {
    const filed = buildNotifications(
      { kind: "request_filed", projectName: "Villa", itemCount: 3 },
      asRolesMap(ROLES),
    );
    expect(userIds(filed).sort()).toEqual(["u-admin", "u-super"].sort());
    const decided = buildNotifications(
      { kind: "request_decided", status: "approved", projectName: "Villa" },
      asRolesMap(ROLES),
    );
    expect(userIds(decided).sort()).toEqual(
      ["u-admin", "u-foreman", "u-foreman-2", "u-super"].sort(),
    );
  });

  it("client_message notifies admins with /client link, never the client", () => {
    const out = buildNotifications(
      { kind: "client_message", fromName: "Client", projectName: "Villa" },
      asRolesMap(ROLES),
    );
    expect(userIds(out).sort()).toEqual(["u-admin", "u-super"].sort());
    expect(userIds(out)).not.toContain("u-client");
    for (const n of out) expect(n.link).toBe("/client");
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
