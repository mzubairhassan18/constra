import { z } from "zod";

export const createEmployeeSchema = z.object({
  kind: z.enum(["permanent", "daily_wager"]),
  name: z.string().trim().min(1, "Name is required").max(200),
  monthlySalary: z.string().trim().regex(/^\d+(\.\d{1,2})?$/, "Invalid amount").optional().or(z.literal("")),
  hourlyRate: z.string().trim().regex(/^\d+(\.\d{1,2})?$/, "Invalid rate").optional().or(z.literal("")),
  dayRate: z.string().trim().regex(/^\d+(\.\d{1,2})?$/, "Invalid rate").optional().or(z.literal("")),
  designation: z.string().trim().max(200).optional().or(z.literal("")),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
});

export const assignSchema = z.object({
  employeeId: z.string().uuid(),
  projectId: z.string().uuid(),
  stageId: z.string().uuid().optional().or(z.literal("")),
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
});

export const attendanceSchema = z.object({
  assignmentId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  hours: z.string().trim().regex(/^\d+(\.\d{1,2})?$/, "Invalid hours"),
});
