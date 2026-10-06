"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { can } from "@/modules/auth/domain/types";
import {
  createProjectSchema,
  addStageSchema,
  addTaskSchema,
  setTaskSchema,
} from "@/modules/projects/schema";
import {
  createProject,
  addStage,
  completeStage,
  addTask,
  setTask,
  stageInfo,
} from "@/modules/projects/adapters/projects-neon";
import { fanout } from "@/modules/notify/adapters/notify-neon";

async function requireWrite(): Promise<boolean> {
  const user = await getSessionUser();
  return !!user && can(user.permissions, "projects.write");
}

export async function createProjectAction(
  _prev: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  if (!(await requireWrite())) return { error: "Not allowed." };
  const parsed = createProjectSchema.safeParse({
    name: formData.get("name"),
    clientName: formData.get("clientName") ?? "",
    location: formData.get("location") ?? "",
    agreementAmount: formData.get("agreementAmount") ?? "",
    stages: formData.get("stages") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const id = await createProject({
    name: parsed.data.name,
    clientName: parsed.data.clientName || undefined,
    location: parsed.data.location || undefined,
    agreementAmount: parsed.data.agreementAmount || undefined,
    stages: parsed.data.stages,
  });
  redirect(`/projects/${id}`);
}

export async function addStageAction(formData: FormData) {
  if (!(await requireWrite())) return;
  const parsed = addStageSchema.safeParse({
    projectId: formData.get("projectId"),
    name: formData.get("name"),
  });
  if (!parsed.success) return;
  await addStage(parsed.data.projectId, parsed.data.name);
  revalidatePath(`/projects/${parsed.data.projectId}`);
}

export async function completeStageAction(formData: FormData) {
  if (!(await requireWrite())) return;
  const stageId = String(formData.get("stageId") ?? "");
  const projectId = String(formData.get("projectId") ?? "");
  if (!stageId) return;
  await completeStage(stageId);
  const info = await stageInfo(stageId);
  if (info) {
    await fanout({
      kind: "stage_completed",
      projectId: info.projectId,
      stageId,
      stageName: info.name,
    });
  }
  revalidatePath(`/projects/${projectId}`);
}

export async function addTaskAction(formData: FormData) {
  if (!(await requireWrite())) return;
  const parsed = addTaskSchema.safeParse({
    stageId: formData.get("stageId"),
    title: formData.get("title"),
    dueDate: formData.get("dueDate") ?? "",
  });
  if (!parsed.success) return;
  await addTask(
    parsed.data.stageId,
    parsed.data.title,
    parsed.data.dueDate || undefined,
  );
  revalidatePath("/projects", "layout");
}

export async function setTaskAction(formData: FormData) {
  if (!(await requireWrite())) return;
  const parsed = setTaskSchema.safeParse({
    taskId: formData.get("taskId"),
    status: formData.get("status"),
    delayReason: formData.get("delayReason") ?? "",
  });
  if (!parsed.success) return;
  await setTask(
    parsed.data.taskId,
    parsed.data.status,
    parsed.data.delayReason || undefined,
  );
  revalidatePath("/projects", "layout");
}
