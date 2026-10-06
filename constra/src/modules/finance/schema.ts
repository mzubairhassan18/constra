import { z } from "zod";

const taxCode = z.enum(["standard", "zero", "exempt", "reverse"]);

export const billLineSchema = z.object({
  description: z.string().trim().max(300).optional().or(z.literal("")),
  materialId: z.string().uuid().optional().or(z.literal("")),
  qty: z.number().positive("qty must be > 0"),
  unitPrice: z.number().min(0),
  discount: z.number().min(0).optional().default(0),
  taxCode,
});

export const billSchema = z.object({
  invoiceNo: z.string().trim().max(100).optional().or(z.literal("")),
  supplierId: z.string().uuid().optional().or(z.literal("")),
  projectId: z.string().uuid().optional().or(z.literal("")),
  stageId: z.string().uuid().optional().or(z.literal("")),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  lines: z.array(billLineSchema).min(1, "Add at least one line").max(100),
});

export const invoiceSchema = z.object({
  projectId: z.string().uuid(),
  stageId: z.string().uuid().optional().or(z.literal("")),
  invoiceNo: z.string().trim().max(100).optional().or(z.literal("")),
  lines: z.array(billLineSchema).min(1).max(100),
});

export const receiptSchema = z.object({
  invoiceId: z.string().uuid(),
  amount: z.string().trim().regex(/^\d+(\.\d{1,2})?$/, "Invalid amount"),
  method: z.string().trim().max(100).optional().or(z.literal("")),
});

export const supplierSchema = z.object({
  name: z.string().trim().min(1).max(200),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  trnNo: z.string().trim().max(50).optional().or(z.literal("")),
});

export const materialSchema = z.object({
  name: z.string().trim().min(1).max(200),
  unit: z.string().trim().max(20).optional().or(z.literal("")),
});
