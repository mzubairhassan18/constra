import { z } from "zod";

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");
const money = z.number().min(0);

export const vehicleSchema = z.object({
  plateNo: z.string().trim().min(1).max(50),
  type: z.string().trim().min(1).max(100),
  mulkiaExpiry: dateStr.optional().or(z.literal("")),
  insuranceExpiry: dateStr.optional().or(z.literal("")),
});

export const maintenanceSchema = z.object({
  vehicleId: z.string().uuid(),
  date: dateStr,
  cost: money,
  description: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const fineSchema = z.object({
  vehicleId: z.string().uuid(),
  date: dateStr,
  amount: money,
  reason: z.string().trim().max(1000).optional().or(z.literal("")),
  driver: z.string().trim().max(200).optional().or(z.literal("")),
});

export const documentSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().trim().min(1).max(300),
  r2Key: z.string().trim().min(1).max(500),
});

export const quotationStatusSchema = z.enum(["draft", "sent", "accepted", "rejected"]);

export const quotationSchema = z.object({
  clientName: z.string().trim().min(1).max(200),
  projectName: z.string().trim().max(200).optional().or(z.literal("")),
  date: dateStr,
  amount: money,
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});
