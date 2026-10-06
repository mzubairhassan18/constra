"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/session";
import { can } from "@/modules/auth/domain/types";
import { materialSchema, supplierSchema } from "@/modules/finance/schema";
import {
  addMaterial,
  addSupplier,
} from "@/modules/finance/adapters/ledger-neon";

async function requireMasters(): Promise<boolean> {
  const user = await getSessionUser();
  return !!user && can(user.permissions, "masters.write");
}

export async function addSupplierAction(formData: FormData) {
  if (!(await requireMasters())) return;
  const parsed = supplierSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") ?? "",
    trnNo: formData.get("trnNo") ?? "",
  });
  if (!parsed.success) return;
  await addSupplier({
    name: parsed.data.name,
    phone: parsed.data.phone || undefined,
    trnNo: parsed.data.trnNo || undefined,
  });
  revalidatePath("/masters");
  revalidatePath("/bills");
}

export async function addMaterialAction(formData: FormData) {
  if (!(await requireMasters())) return;
  const parsed = materialSchema.safeParse({
    name: formData.get("name"),
    unit: formData.get("unit") ?? "",
  });
  if (!parsed.success) return;
  await addMaterial({ name: parsed.data.name, unit: parsed.data.unit || undefined });
  revalidatePath("/masters");
}
