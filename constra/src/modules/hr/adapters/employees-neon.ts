import sql from "@/lib/db";
import { fmtDate } from "@/lib/format";
import type { Employee } from "../domain/types";

export interface EmployeeRow extends Employee {
  id: string;
  name: string;
  designation?: string;
}

/** Neon may return DATE as Date or string — normalize to YYYY-MM-DD (calendar day, TZ-safe). */
export { fmtDate } from "@/lib/format";

export async function listEmployees(): Promise<EmployeeRow[]> {
  const rows = await sql`
    SELECT id, kind, name, monthly_salary, hourly_rate, day_rate, designation
    FROM employees ORDER BY created_at DESC`;
  return rows.map((r) => ({
    id: r.id as string,
    kind: r.kind as Employee["kind"],
    name: r.name as string,
    monthlySalary: r.monthly_salary != null ? Number(r.monthly_salary) : undefined,
    hourlyRate: r.hourly_rate != null ? Number(r.hourly_rate) : undefined,
    dayRate: r.day_rate != null ? Number(r.day_rate) : undefined,
    designation: (r.designation as string | null) ?? undefined,
  }));
}

export async function createEmployee(input: {
  kind: Employee["kind"];
  name: string;
  monthlySalary?: number;
  hourlyRate?: number;
  dayRate?: number;
  designation?: string;
  phone?: string;
}): Promise<string> {
  const rows = await sql`
    INSERT INTO employees (kind, name, monthly_salary, hourly_rate, day_rate, designation, phone)
    VALUES (${input.kind}, ${input.name}, ${input.monthlySalary ?? null},
            ${input.hourlyRate ?? null}, ${input.dayRate ?? null},
            ${input.designation ?? null}, ${input.phone ?? null})
    RETURNING id`;
  return rows[0].id as string;
}

export async function employeeUserId(employeeId: string): Promise<string | null> {
  const rows = await sql`SELECT user_id FROM employees WHERE id = ${employeeId}`;
  if (rows.length === 0) return null;
  return (rows[0].user_id as string | null) ?? null;
}

export async function getEmployee(id: string): Promise<(EmployeeRow & {  assignments: {
    id: string;
    projectId: string;
    projectName: string;
    stageId: string | null;
    stageName: string | null;
    fromDate: string;
    toDate: string | null;
  }[];
}) | null> {
  const e = await sql`SELECT * FROM employees WHERE id = ${id}`;
  if (e.length === 0) return null;
  const a = await sql`
    SELECT asg.id, asg.project_id, p.name AS project_name,
           asg.stage_id, s.name AS stage_name, asg.from_date, asg.to_date
    FROM assignments asg
    JOIN projects p ON p.id = asg.project_id
    LEFT JOIN stages s ON s.id = asg.stage_id
    WHERE asg.employee_id = ${id} ORDER BY asg.from_date DESC`;
  const row = e[0];
  return {
    id: row.id as string,
    kind: row.kind as Employee["kind"],
    name: row.name as string,
    monthlySalary: row.monthly_salary != null ? Number(row.monthly_salary) : undefined,
    hourlyRate: row.hourly_rate != null ? Number(row.hourly_rate) : undefined,
    dayRate: row.day_rate != null ? Number(row.day_rate) : undefined,
    designation: (row.designation as string | null) ?? undefined,
    assignments: a.map((x) => ({
      id: x.id as string,
      projectId: x.project_id as string,
      projectName: x.project_name as string,
      stageId: x.stage_id as string | null,
      stageName: x.stage_name as string | null,
      fromDate: fmtDate(x.from_date),
      toDate: x.to_date ? fmtDate(x.to_date) : null,
    })),
  };
}
