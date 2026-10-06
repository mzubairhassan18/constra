import { describe, it, expect } from "vitest";
import {
  assignLabour,
  type AssignmentsPort,
  type AssignmentRow,
} from "./assign-labour";

function makeFake(seed: AssignmentRow[] = []) {
  const rows: AssignmentRow[] = seed.map((r) => ({ ...r }));
  const port: AssignmentsPort = {
    async listOpen(employeeId: string) {
      return rows.filter((r) => r.employeeId === employeeId && r.toDate === null);
    },
    async listAll(employeeId: string) {
      return rows.filter((r) => r.employeeId === employeeId);
    },
    async close(id: string, toDate: string) {
      const row = rows.find((r) => r.id === id);
      if (!row) throw new Error("not found");
      row.toDate = toDate;
    },
    async create(input) {
      const row: AssignmentRow = { ...input, id: `a-${rows.length + 1}` };
      rows.push(row);
      return row;
    },
  };
  return { port, rows };
}

describe("assignLabour", () => {
  it("closes the old open assignment and opens a new one; history preserved", async () => {
    const { port } = makeFake([
      {
        id: "a-1",
        employeeId: "emp-1",
        projectId: "proj-1",
        stageId: "stage-1",
        fromDate: "2026-01-01",
        toDate: null,
        allocationPct: 100,
      },
    ]);

    const res = await assignLabour(port, {
      employeeId: "emp-1",
      projectId: "proj-2",
      stageId: "stage-9",
      fromDate: "2026-02-01",
      allocationPct: 100,
    });

    expect(res.ok).toBe(true);
    if (!res.ok) return;

    expect(res.assignment.projectId).toBe("proj-2");
    expect(res.assignment.fromDate).toBe("2026-02-01");

    const history = await port.listAll("emp-1");
    expect(history).toHaveLength(2);

    const old = history.find((r) => r.id === "a-1");
    expect(old?.toDate).toBe("2026-02-01");
  });

  it("creates directly when the employee has no open assignment", async () => {
    const { port } = makeFake([]);

    const res = await assignLabour(port, {
      employeeId: "emp-2",
      projectId: "proj-1",
      fromDate: "2026-01-10",
      allocationPct: 50,
    });

    expect(res.ok).toBe(true);
    const history = await port.listAll("emp-2");
    expect(history).toHaveLength(1);
    expect(history[0].toDate).toBeNull();
  });

  it("rejects allocation outside 1..100 without mutating history", async () => {
    const { port } = makeFake([]);

    const res = await assignLabour(port, {
      employeeId: "emp-3",
      projectId: "proj-1",
      fromDate: "2026-01-10",
      allocationPct: 0,
    });

    expect(res.ok).toBe(false);
    expect(await port.listAll("emp-3")).toHaveLength(0);
  });
});
