"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/session";
import { can } from "@/modules/auth/domain/types";
import { billSchema } from "@/modules/finance/schema";
import { neonAccounts, neonBills } from "@/modules/finance/adapters/bills-neon";
import { postJournalEntry } from "@/modules/finance/adapters/post-entry-neon";
import { recordSupplierBill } from "@/modules/finance/use-cases/record-bill";

async function requireFinance(): Promise<boolean> {
  const user = await getSessionUser();
  return !!user && can(user.permissions, "finance.write");
}

export async function createBillAction(
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
  const parsed = billSchema.safeParse({
    invoiceNo: formData.get("invoiceNo") ?? "",
    supplierId: formData.get("supplierId") ?? "",
    projectId: formData.get("projectId") ?? "",
    stageId: formData.get("stageId") ?? "",
    date: formData.get("date") ?? "",
    lines,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const d = parsed.data;
  await recordSupplierBill(
    neonBills,
    { post: postJournalEntry },
    neonAccounts,
    {
      invoiceNo: d.invoiceNo || undefined,
      supplierId: d.supplierId || undefined,
      projectId: d.projectId || undefined,
      stageId: d.stageId || undefined,
      date: d.date || undefined,
      lines: d.lines.map((l) => ({
        description: l.description || undefined,
        materialId: l.materialId || undefined,
        qty: l.qty,
        unitPrice: l.unitPrice,
        discount: l.discount,
        taxCode: l.taxCode,
      })),
    },
  );
  revalidatePath("/bills");
  revalidatePath("/finance");
  return {};
}
