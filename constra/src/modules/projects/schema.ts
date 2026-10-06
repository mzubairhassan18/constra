import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  clientName: z.string().trim().max(200).optional(),
  location: z.string().trim().max(300).optional(),
  agreementAmount: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, "Invalid amount")
    .optional()
    .or(z.literal("")),
  stages: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) =>
      (v ?? "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 50),
    ),
});

export const addStageSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().trim().min(1).max(200),
});

export const addTaskSchema = z.object({
  stageId: z.string().uuid(),
  title: z.string().trim().min(1).max(300),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date").optional().or(z.literal("")),
});

export const setTaskSchema = z.object({
  taskId: z.string().uuid(),
  status: z.enum(["todo", "in_progress", "blocked", "done"]),
  delayReason: z.string().trim().max(500).optional().or(z.literal("")),
});
