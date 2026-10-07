"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/session";
import { can } from "@/modules/auth/domain/types";
import { billSchema } from "@/modules/finance/schema";
import { neonAccounts, neonBills, saveBillImage, getBillDetail } from "@/modules/finance/adapters/bills-neon";
import { postJournalEntry } from "@/modules/finance/adapters/post-entry-neon";
import { recordSupplierBill } from "@/modules/finance/use-cases/record-bill";
import { putPhoto, r2Enabled } from "@/lib/r2";

async function requireFinance(): Promise<boolean> {
  const user = await getSessionUser();
  return !!user && can(user.permissions, "finance.write");
}

const MAX_FILE_MB = 10;

function billFileKey(billId: string, filename: string): string {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  const rand = Math.random().toString(36).slice(2, 10);
  return `bills/${billId}/${rand}-${safe}`;
}

export type BillDetail = NonNullable<Awaited<ReturnType<typeof getBillDetail>>>;

export async function getBillDetailAction(billId: string): Promise<BillDetail | null> {
  if (!(await requireFinance())) return null;
  return getBillDetail(billId);
}

export async function createBillAction(
  _prev: { error?: string; warning?: string },
  formData: FormData,
): Promise<{ error?: string; warning?: string }> {
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
  const billId = await recordSupplierBill(
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

  // Receipt attachments (optional). Bill is already posted — upload failures
  // degrade to a warning, never a rollback.
  const files = formData
    .getAll("attachments")
    .filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > 0 && !r2Enabled()) {
    revalidatePath("/bills");
    revalidatePath("/finance");
    return {
      warning: `Bill posted, but ${files.length} attachment(s) were skipped — file storage (R2) is not configured on this environment.`,
    };
  }
  let failed = 0;
  for (const f of files.slice(0, 10)) {
    try {
      if (f.size > MAX_FILE_MB * 1024 * 1024) {
        failed++;
        continue;
      }
      const key = billFileKey(billId, f.name);
      await putPhoto(key, new Uint8Array(await f.arrayBuffer()), f.type || "application/octet-stream");
      await saveBillImage({ billId, key, mime: f.type || "application/octet-stream", size: f.size });
    } catch {
      failed++;
    }
  }
  revalidatePath("/bills");
  revalidatePath("/finance");
  if (failed > 0) {
    return { warning: `Bill posted, but ${failed} attachment(s) failed to upload.` };
  }
  return {};
}
