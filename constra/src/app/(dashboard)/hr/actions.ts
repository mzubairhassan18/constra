"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { can } from "@/modules/auth/domain/types";
import {
  assignSchema,
  attendanceSchema,
  createEmployeeSchema,
} from "@/modules/hr/schema";
import { createEmployee } from "@/modules/hr/adapters/employees-neon";
import {
  logAttendance,
  neonAssignments,
} from "@/modules/hr/adapters/assignments-neon";
import { assignLabour } from "@/modules/hr/use-cases/assign-labour";
import { employeeUserId } from "@/modules/hr/adapters/employees-neon";
import { fanout } from "@/modules/notify/adapters/notify-neon";

async function requireHr(): Promise<boolean> {
  const user = await getSessionUser();
  return !!user && (can(user.permissions, "hr.write") || can(user.permissions, "hr.attendance"));
}

export async function createEmployeeAction(
  _prev: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  if (!(await requireHr())) return { error: "Not allowed." };
  const parsed = createEmployeeSchema.safeParse({
    kind: formData.get("kind"),
    name: formData.get("name"),
    monthlySalary: formData.get("monthlySalary") ?? "",
    hourlyRate: formData.get("hourlyRate") ?? "",
    dayRate: formData.get("dayRate") ?? "",
    designation: formData.get("designation") ?? "",
    phone: formData.get("phone") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const d = parsed.data;
  if (d.kind === "permanent" && !d.monthlySalary)
    return { error: "Monthly salary is required for permanent staff." };
  if (d.kind === "daily_wager" && !d.hourlyRate && !d.dayRate)
    return { error: "Hourly or day rate is required for daily wagers." };
  const num = (v?: string) => (v ? Number(v) : undefined);
  const id = await createEmployee({
    kind: d.kind,
    name: d.name,
    monthlySalary: num(d.monthlySalary),
    hourlyRate: num(d.hourlyRate),
    dayRate: num(d.dayRate),
    designation: d.designation || undefined,
    phone: d.phone || undefined,
  });
  redirect(`/hr/${id}`);
}

export async function assignAction(formData: FormData) {
  if (!(await requireHr())) return;
  const parsed = assignSchema.safeParse({
    employeeId: formData.get("employeeId"),
    projectId: formData.get("projectId"),
    stageId: formData.get("stageId") ?? "",
    fromDate: formData.get("fromDate"),
  });
  if (!parsed.success) return;
  const res = await assignLabour(neonAssignments, {
    employeeId: parsed.data.employeeId,
    projectId: parsed.data.projectId,
    stageId: parsed.data.stageId || null,
    fromDate: parsed.data.fromDate,
    allocationPct: 100,
  });
  if (res.ok) {
    const userId = await employeeUserId(parsed.data.employeeId);
    await fanout({
      kind: "assignment_moved",
      employeeId: parsed.data.employeeId,
      employeeUserId: userId ?? undefined,
      fromProjectId: "",
      toProjectId: parsed.data.projectId,
    });
  }
  revalidatePath("/hr", "layout");
}

export async function attendanceAction(formData: FormData) {
  if (!(await requireHr())) return;
  const parsed = attendanceSchema.safeParse({
    assignmentId: formData.get("assignmentId"),
    date: formData.get("date"),
    hours: formData.get("hours"),
  });
  if (!parsed.success) return;
  await logAttendance({
    assignmentId: parsed.data.assignmentId,
    date: parsed.data.date,
    hours: Number(parsed.data.hours),
  });
  revalidatePath("/hr", "layout");
}
