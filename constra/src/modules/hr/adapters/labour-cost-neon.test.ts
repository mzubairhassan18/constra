import { describe, it, expect } from "vitest";
import sql from "@/lib/db";
import { getStageLabourCost } from "./labour-cost-neon";

// Integration: hits Neon. Skipped without DATABASE_URL so unit runs stay offline.
const describeIntegration = process.env.DATABASE_URL ? describe : describe.skip;

describeIntegration("labour-cost-neon: stage labour cost aggregation", () => {
  it("sums hours * effective rate for the stage", async () => {
    const tag = `__test_${Date.now()}`;
    let projectId = "";
    let stageId = "";
    let employeeId = "";
    let assignmentId = "";

    try {
      // Permanent: 26000 / 26 / 8 = 125/hr (default payroll_policy row id=1).
      const [emp] = await sql`
        INSERT INTO employees (kind, name, monthly_salary)
        VALUES ('permanent', ${`${tag} emp`}, 26000)
        RETURNING id`;
      employeeId = emp.id as string;

      const [proj] = await sql`
        INSERT INTO projects (name, status) VALUES (${`${tag} proj`}, 'active')
        RETURNING id`;
      projectId = proj.id as string;

      const [stg] = await sql`
        INSERT INTO stages (project_id, name, position, status)
        VALUES (${projectId}, ${`${tag} stage`}, 0, 'in_progress')
        RETURNING id`;
      stageId = stg.id as string;

      const [asg] = await sql`
        INSERT INTO assignments (employee_id, project_id, stage_id, from_date, allocation_pct)
        VALUES (${employeeId}, ${projectId}, ${stageId}, '2026-01-01', 100)
        RETURNING id`;
      assignmentId = asg.id as string;

      // 8h on this assignment's stage.
      await sql`
        INSERT INTO attendances (assignment_id, date, hours)
        VALUES (${assignmentId}, '2026-01-02', 8)`;

      const cost = await getStageLabourCost(stageId);

      expect(cost.stageId).toBe(stageId);
      expect(cost.totalHours).toBeCloseTo(8, 5);
      // 8h * 125 = 1000
      expect(cost.totalCost).toBeCloseTo(1000, 2);
    } finally {
      // Cleanup in reverse FK order; scoped to rows created above.
      if (assignmentId) await sql`DELETE FROM attendances WHERE assignment_id = ${assignmentId}`;
      if (assignmentId) await sql`DELETE FROM assignments WHERE id = ${assignmentId}`;
      if (stageId) await sql`DELETE FROM stages WHERE id = ${stageId}`;
      if (projectId) await sql`DELETE FROM projects WHERE id = ${projectId}`;
      if (employeeId) await sql`DELETE FROM employees WHERE id = ${employeeId}`;
    }
  });
});
