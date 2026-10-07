"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { can } from "@/modules/auth/domain/types";
import { putPhoto, r2Enabled, reportPhotoKey } from "@/lib/r2";
import sql from "@/lib/db";
import { fanout } from "@/modules/notify/adapters/notify-neon";
import {
  neonOpsAccounts,
  neonOpsStore,
} from "@/modules/operations/adapters/operations-neon";
import { postJournalEntry } from "@/modules/finance/adapters/post-entry-neon";
import {
  clearManpowerBalance,
  recordManpower,
} from "@/modules/operations/use-cases/operations";

async function requireOps(): Promise<boolean> {
  const user = await getSessionUser();
  return !!user && can(user.permissions, "operations.write");
}

const manpowerSchema = z.object({
  name: z.string().trim().min(1).max(200),
  skill: z.string().trim().max(100).optional().or(z.literal("")),
  projectId: z.string().uuid().optional().or(z.literal("")),
  stageId: z.string().uuid().optional().or(z.literal("")),
  rate: z.string().trim().regex(/^\d+(\.\d{1,2})?$/),
  hours: z.string().trim().regex(/^\d+(\.\d{1,2})?$/),
  paid: z.string().trim().regex(/^\d+(\.\d{1,2})?$/),
});

export async function createManpowerAction(
  _prev: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  if (!(await requireOps())) return { error: "Not allowed." };
  const parsed = manpowerSchema.safeParse({
    name: formData.get("name"),
    skill: formData.get("skill") ?? "",
    projectId: formData.get("projectId") ?? "",
    stageId: formData.get("stageId") ?? "",
    rate: formData.get("rate"),
    hours: formData.get("hours"),
    paid: formData.get("paid"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const d = parsed.data;
  try {
    await recordManpower(neonOpsStore, { post: postJournalEntry }, neonOpsAccounts, {
      name: d.name,
      skill: d.skill || undefined,
      projectId: d.projectId || undefined,
      stageId: d.stageId || undefined,
      rate: Number(d.rate),
      hours: Number(d.hours),
      paid: Number(d.paid),
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to save" };
  }
  revalidatePath("/operations");
  revalidatePath("/finance");
  return {};
}

export async function clearBalanceAction(formData: FormData) {
  if (!(await requireOps())) return;
  const entryId = String(formData.get("entryId") ?? "");
  const amount = Number(formData.get("amount") ?? 0);
  if (!entryId || !(amount > 0)) return;
  try {
    await clearManpowerBalance(neonOpsStore, { post: postJournalEntry }, neonOpsAccounts, entryId, amount);
  } catch {
    return;
  }
  revalidatePath("/operations");
  revalidatePath("/finance");
}

const requestSchema = z.object({
  projectId: z.string().uuid().optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  items: z.string().trim().min(1, "Add at least one item"),
});

export async function createRequestAction(
  _prev: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  if (!(await requireOps())) return { error: "Not allowed." };
  const parsed = requestSchema.safeParse({
    projectId: formData.get("projectId") ?? "",
    notes: formData.get("notes") ?? "",
    items: formData.get("items") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const lines = parsed.data.items
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const m = s.match(/^(.+?)\s+(\d+(\.\d+)?)$/);
      return m
        ? { materialName: m[1], qty: Number(m[2]) }
        : { materialName: s, qty: 1 };
    });
  const user = await getSessionUser();
  await neonOpsStore.saveMaterialRequest({
    projectId: parsed.data.projectId || undefined,
    notes: parsed.data.notes || undefined,
    lines,
  });
  let projectName = "a project";
  if (parsed.data.projectId) {
    const p = await sql`SELECT name FROM projects WHERE id = ${parsed.data.projectId}`;
    if (p.length > 0) projectName = String(p[0].name);
  }
  void user;
  await fanout({ kind: "request_filed", projectName, itemCount: lines.length });
  revalidatePath("/operations");
  return {};
}

export async function setRequestStatusAction(formData: FormData) {
  if (!(await requireOps())) return;
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !["approved", "rejected", "fulfilled"].includes(status)) return;
  await neonOpsStore.setRequestStatus(id, status as "approved" | "rejected" | "fulfilled");
  await fanout({ kind: "request_decided", status, projectName: "site operations" });
  revalidatePath("/operations");
}

const reportSchema = z.object({
  projectId: z.string().uuid("Pick a project"),
  workDone: z.string().trim().min(1, "Describe the work done").max(2000),
  delays: z.string().trim().max(1000).optional().or(z.literal("")),
  nextDayPlan: z.string().trim().max(1000).optional().or(z.literal("")),
});

export async function createReportAction(
  _prev: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  if (!(await requireOps())) return { error: "Not allowed." };
  const parsed = reportSchema.safeParse({
    projectId: formData.get("projectId"),
    workDone: formData.get("workDone"),
    delays: formData.get("delays") ?? "",
    nextDayPlan: formData.get("nextDayPlan") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const photoKeys: string[] = [];
  if (r2Enabled()) {
    const files = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
    if (files.length > 5) return { error: "Max 5 photos." };
    const today = new Date().toISOString().slice(0, 10);
    for (const f of files) {
      if (!f.type.startsWith("image/")) return { error: "Photos must be images." };
      if (f.size > 5 * 1024 * 1024) return { error: "Each photo must be ≤ 5MB." };
      const key = reportPhotoKey(parsed.data.projectId, today, f.name);
      await putPhoto(key, new Uint8Array(await f.arrayBuffer()), f.type);
      photoKeys.push(key);
    }
  }
  await neonOpsStore.saveDailyReport({
    projectId: parsed.data.projectId,
    workDone: parsed.data.workDone,
    delays: parsed.data.delays || undefined,
    nextDayPlan: parsed.data.nextDayPlan || undefined,
    photoKeys,
  });
  await fanout({
    kind: "report_filed",
    projectId: parsed.data.projectId,
    stageId: "",
    reportKind: parsed.data.delays ? "delay" : "progress",
    filedBy: "",
  });
  revalidatePath("/operations");
  return {};
}
