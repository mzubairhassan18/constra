import { validateAssignment, type Assignment } from "../domain/types";

export interface AssignmentRow extends Assignment {
  id: string;
}

export interface AssignmentsPort {
  listOpen(employeeId: string): Promise<AssignmentRow[]>;
  listAll(employeeId: string): Promise<AssignmentRow[]>;
  close(id: string, toDate: string): Promise<void>;
  create(input: Omit<AssignmentRow, "id">): Promise<AssignmentRow>;
}

export type AssignResult =
  | { ok: true; assignment: AssignmentRow }
  | { ok: false; error: string };

/** Move employee to a new project/stage: close open rows at fromDate (no gap/overlap), open new. */
export async function assignLabour(
  port: AssignmentsPort,
  input: Omit<AssignmentRow, "id" | "toDate">,
): Promise<AssignResult> {
  const check = validateAssignment({ ...input, toDate: null });
  if (!check.ok) return { ok: false, error: check.error };
  const open = await port.listOpen(input.employeeId);
  for (const row of open) {
    await port.close(row.id, input.fromDate);
  }
  const assignment = await port.create({ ...input, toDate: null });
  return { ok: true, assignment };
}
