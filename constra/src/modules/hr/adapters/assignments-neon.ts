import sql from "@/lib/db";
import { fmtDate } from "./employees-neon";
import type {
  AssignmentsPort,
  AssignmentRow,
} from "../use-cases/assign-labour";

const toRow = (r: Record<string, unknown>): AssignmentRow => ({
  id: r.id as string,
  employeeId: r.employee_id as string,
  projectId: r.project_id as string,
  stageId: (r.stage_id as string | null) ?? null,
  fromDate: fmtDate(r.from_date),
  toDate: r.to_date ? fmtDate(r.to_date) : null,
  allocationPct: r.allocation_pct as number,
});

export const neonAssignments: AssignmentsPort = {
  async listOpen(employeeId: string) {
    const rows = await sql`
      SELECT * FROM assignments WHERE employee_id = ${employeeId} AND to_date IS NULL`;
    return rows.map(toRow);
  },
  async listAll(employeeId: string) {
    const rows = await sql`
      SELECT * FROM assignments WHERE employee_id = ${employeeId} ORDER BY from_date`;
    return rows.map(toRow);
  },
  async close(id: string, toDate: string) {
    await sql`UPDATE assignments SET to_date = ${toDate}::date WHERE id = ${id}`;
  },
  async create(input) {
    const rows = await sql`
      INSERT INTO assignments (employee_id, project_id, stage_id, from_date, allocation_pct)
      VALUES (${input.employeeId}, ${input.projectId}, ${input.stageId ?? null},
              ${input.fromDate}::date, ${input.allocationPct})
      RETURNING *`;
    return toRow(rows[0]);
  },
};

export async function logAttendance(input: {
  assignmentId: string;
  date: string;
  hours: number;
  overtimeHours?: number;
}): Promise<void> {
  await sql`
    INSERT INTO attendances (assignment_id, date, hours, overtime_hours)
    VALUES (${input.assignmentId}, ${input.date}::date, ${input.hours}, ${input.overtimeHours ?? 0})
    ON CONFLICT (assignment_id, date)
    DO UPDATE SET hours = EXCLUDED.hours, overtime_hours = EXCLUDED.overtime_hours`;
}

export async function openAssignments(): Promise<
  { id: string; employeeName: string; projectName: string; fromDate: string }[]
> {
  const rows = await sql`
    SELECT asg.id, e.name AS employee_name, p.name AS project_name, asg.from_date
    FROM assignments asg
    JOIN employees e ON e.id = asg.employee_id
    JOIN projects p ON p.id = asg.project_id
    WHERE asg.to_date IS NULL ORDER BY asg.from_date DESC`;
  return rows.map((r) => ({
    id: r.id as string,
    employeeName: r.employee_name as string,
    projectName: r.project_name as string,
    fromDate: fmtDate(r.from_date),
  }));
}

export async function myAssignments(userId: string): Promise<
  {
    id: string;
    employeeName: string;
    projectName: string;
    stageName: string | null;
    fromDate: string;
    allocationPct: number;
  }[]
> {
  const rows = await sql`
    SELECT asg.id, e.name AS employee_name, p.name AS project_name,
      s.name AS stage_name, asg.from_date, asg.allocation_pct
    FROM assignments asg
    JOIN employees e ON e.id = asg.employee_id
    JOIN projects p ON p.id = asg.project_id
    LEFT JOIN stages s ON s.id = asg.stage_id
    WHERE asg.to_date IS NULL AND e.user_id = ${userId}
    ORDER BY asg.from_date DESC`;
  return rows.map((r) => ({
    id: r.id as string,
    employeeName: r.employee_name as string,
    projectName: r.project_name as string,
    stageName: (r.stage_name as string | null) ?? null,
    fromDate: fmtDate(r.from_date),
    allocationPct: Number(r.allocation_pct),
  }));
}
