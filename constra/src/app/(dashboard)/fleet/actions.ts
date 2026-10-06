"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/session";
import { can } from "@/modules/auth/domain/types";
import {
  quotationSchema,
  quotationStatusSchema,
  vehicleSchema,
} from "@/modules/fleet/schema";
import {
  addQuotation,
  addVehicle,
  setQuotationStatus,
} from "@/modules/fleet/adapters/fleet-neon";

async function requireFleet(): Promise<boolean> {
  const user = await getSessionUser();
  return !!user && can(user.permissions, "masters.write");
}

export async function addVehicleAction(formData: FormData) {
  if (!(await requireFleet())) return;
  const parsed = vehicleSchema.safeParse({
    plateNo: formData.get("plateNo"),
    type: formData.get("type"),
    mulkiaExpiry: formData.get("mulkiaExpiry") ?? "",
    insuranceExpiry: formData.get("insuranceExpiry") ?? "",
  });
  if (!parsed.success) return;
  await addVehicle({
    plateNo: parsed.data.plateNo,
    type: parsed.data.type,
    mulkiaExpiry: parsed.data.mulkiaExpiry || undefined,
    insuranceExpiry: parsed.data.insuranceExpiry || undefined,
  });
  revalidatePath("/fleet");
}

export async function addQuotationAction(formData: FormData) {
  if (!(await requireFleet())) return;
  const parsed = quotationSchema.safeParse({
    clientName: formData.get("clientName"),
    projectName: formData.get("projectName") ?? "",
    date: formData.get("date"),
    amount: Number(formData.get("amount")),
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) return;
  await addQuotation({
    clientName: parsed.data.clientName,
    projectName: parsed.data.projectName || undefined,
    date: parsed.data.date,
    amount: parsed.data.amount,
    notes: parsed.data.notes || undefined,
  });
  revalidatePath("/fleet");
}

export async function setQuotationStatusAction(formData: FormData) {
  if (!(await requireFleet())) return;
  const id = String(formData.get("id") ?? "");
  const parsed = quotationStatusSchema.safeParse(formData.get("status"));
  if (!id || !parsed.success) return;
  await setQuotationStatus(id, parsed.data);
  revalidatePath("/fleet");
}
