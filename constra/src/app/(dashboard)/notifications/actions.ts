"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { markAllRead } from "@/modules/notify/adapters/notify-neon";

export async function readAllAction(): Promise<void> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  await markAllRead(user.id);
  revalidatePath("/notifications");
}
