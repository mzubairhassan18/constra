"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/session";
import { can } from "@/modules/auth/domain/types";
import { createPortalToken } from "@/modules/portal/adapters/portal-neon";

export async function createPortalTokenAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user || !can(user.permissions, "projects.write")) return;
  const projectId = String(formData.get("projectId") ?? "");
  if (!projectId) return;
  await createPortalToken(projectId, {
    showCosts: formData.get("showCosts") === "on",
    showPhotos: formData.get("showPhotos") !== "off",
    showDelays: formData.get("showDelays") !== "off",
  });
  revalidatePath(`/projects/${projectId}`);
}
