"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import {
  projectClientUser,
  sendMessage,
} from "@/modules/client/adapters/client-neon";
import { fanout } from "@/modules/notify/adapters/notify-neon";
import sql from "@/lib/db";

async function canSeeProject(userId: string, role: string, projectId: string): Promise<boolean> {
  if (role === "super_admin" || role === "admin") return true;
  if (role !== "client") return false;
  return (await projectClientUser(projectId)) === userId;
}

const messageSchema = z.object({
  projectId: z.string().uuid(),
  body: z.string().trim().min(1, "Write a message first").max(2000),
});

export async function sendClientMessageAction(
  _prev: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  const user = await getSessionUser();
  if (!user) return { error: "Not allowed." };
  const parsed = messageSchema.safeParse({
    projectId: formData.get("projectId"),
    body: formData.get("body"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  if (!(await canSeeProject(user.id, user.role, parsed.data.projectId))) {
    return { error: "Not allowed." };
  }
  await sendMessage({ projectId: parsed.data.projectId, authorId: user.id, body: parsed.data.body });
  if (user.role === "client") {
    const p = await sql`SELECT name FROM projects WHERE id = ${parsed.data.projectId}`;
    await fanout({
      kind: "client_message",
      fromName: user.displayName,
      projectName: p.length > 0 ? String(p[0].name) : "your project",
    });
  }
  revalidatePath("/client");
  return {};
}
