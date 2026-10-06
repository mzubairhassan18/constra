import { afterAll, describe, expect, it } from "vitest";
import sql from "@/lib/db";
import {
  logAttendance,
  neonAssignments,
} from "./assignments-neon";
import { assignLabour } from "../use-cases/assign-labour";

let emp = "";
let proj1 = "";
let proj2 = "";
const createdAssignments: string[] = [];

afterAll(async () => {
  for (const id of createdAssignments) {
    await sql`DELETE FROM attendances WHERE assignment_id = ${id}`;
  }
  for (const id of createdAssignments) {
    await sql`DELETE FROM assignments WHERE id = ${id}`;
  }
  if (proj1) await sql`DELETE FROM projects WHERE id = ${proj1}`;
  if (proj2) await sql`DELETE FROM projects WHERE id = ${proj2}`;
  if (emp) await sql`DELETE FROM employees WHERE id = ${emp}`;
});

describe("assignments port (neon)", () => {
  it("moves an employee between projects, closing history", async () => {
    const [e] = await sql`
      INSERT INTO employees (kind, name, hourly_rate) VALUES ('daily_wager', '__test mover', 20) RETURNING id`;
    emp = e.id as string;
    const [p1] = await sql`INSERT INTO projects (name) VALUES ('__test p1') RETURNING id`;
    const [p2] = await sql`INSERT INTO projects (name) VALUES ('__test p2') RETURNING id`;
    proj1 = p1.id as string;
    proj2 = p2.id as string;

    const first = await assignLabour(neonAssignments, {
      employeeId: emp, projectId: proj1, fromDate: "2026-01-01", allocationPct: 100,
    });
    expect(first.ok).toBe(true);
    if (first.ok) createdAssignments.push(first.assignment.id);

    const second = await assignLabour(neonAssignments, {
      employeeId: emp, projectId: proj2, fromDate: "2026-02-01", allocationPct: 100,
    });
    expect(second.ok).toBe(true);
    if (second.ok) createdAssignments.push(second.assignment.id);

    const history = await neonAssignments.listAll(emp);
    expect(history).toHaveLength(2);
    expect(history.find((r) => r.projectId === proj1)?.toDate).toBe("2026-02-01");

    await logAttendance({ assignmentId: history[1].id, date: "2026-02-02", hours: 8 });
    const att = await sql`SELECT hours FROM attendances WHERE assignment_id = ${history[1].id}`;
    expect(Number(att[0].hours)).toBe(8);
  });
});
