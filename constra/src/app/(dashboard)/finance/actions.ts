"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/session";
import { can } from "@/modules/auth/domain/types";
import { invoiceSchema, receiptSchema } from "@/modules/finance/schema";
import {
  neonAccounts,
  neonBills,
} from "@/modules/finance/adapters/bills-neon";
import { postJournalEntry } from "@/modules/finance/adapters/post-entry-neon";
import {
  recordClientInvoice,
  recordReceipt,
} from "@/modules/finance/use-cases/record-bill";

async function requireFinance(): Promise<boolean> {
  const user = await getSessionUser();
  return !!user && can(user.permissions, "finance.write");
}

export async function createInvoiceAction(
  _prev: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  if (!(await requireFinance())) return { error: "Not allowed." };
  let lines: unknown;
  try {
    lines = JSON.parse(String(formData.get("lines") ?? "[]"));
  } catch {
    return { error: "Bad line items." };
  }
  const parsed = invoiceSchema.safeParse({
    projectId: formData.get("projectId"),
    stageId: formData.get("stageId") ?? "",
    invoiceNo: formData.get("invoiceNo") ?? "",
    lines,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const d = parsed.data;
  await recordClientInvoice(neonBills, { post: postJournalEntry }, neonAccounts, {
    projectId: d.projectId,
    stageId: d.stageId || undefined,
    invoiceNo: d.invoiceNo || undefined,
    lines: d.lines.map((l) => ({
      description: l.description || undefined,
      qty: l.qty,
      unitPrice: l.unitPrice,
      discount: l.discount,
      taxCode: l.taxCode,
    })),
  });
  revalidatePath("/finance");
  return {};
}

export async function createReceiptAction(formData: FormData) {
  if (!(await requireFinance())) return;
  const parsed = receiptSchema.safeParse({
    invoiceId: formData.get("invoiceId"),
    amount: formData.get("amount"),
    method: formData.get("method") ?? "",
  });
  if (!parsed.success) return;
  await recordReceipt(neonBills, { post: postJournalEntry }, neonAccounts, {
    invoiceId: parsed.data.invoiceId,
    amount: Number(parsed.data.amount),
    method: parsed.data.method || undefined,
  });
  revalidatePath("/finance");
}
