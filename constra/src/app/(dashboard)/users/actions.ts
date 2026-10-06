"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hash } from "bcryptjs";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { can } from "@/modules/auth/domain/types";
import {
  createUser,
  resetUserPassword,
  setUserActive,
  setUserRole,
} from "@/modules/auth/adapters/users-manage-neon";

async function requireAdmin(): Promise<boolean> {
  const user = await getSessionUser();
  return !!user && (user.role === "super_admin" || can(user.permissions, "users.write"));
}

export async function setRoleAction(formData: FormData) {
  if (!(await requireAdmin())) return;
  const userId = String(formData.get("userId") ?? "");
  const roleId = String(formData.get("roleId") ?? "");
  if (!userId || !roleId) return;
  await setUserRole(userId, roleId);
  revalidatePath("/users");
}

export async function setActiveAction(formData: FormData) {
  if (!(await requireAdmin())) return;
  const userId = String(formData.get("userId") ?? "");
  if (!userId) return;
  const me = await getSessionUser();
  if (me?.id === userId) return; // cannot deactivate self
  await setUserActive(userId, formData.get("active") === "on");
  revalidatePath("/users");
}

const newUserSchema = z.object({
  username: z.string().trim().toLowerCase().min(3).max(100).regex(/^[a-z0-9._-]+$/),
  displayName: z.string().trim().min(1).max(200),
  email: z.string().trim().email().optional().or(z.literal("")),
  roleId: z.string().uuid(),
  password: z.string().min(8).max(200),
});

export async function createUserAction(
  _prev: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  if (!(await requireAdmin())) return { error: "Not allowed." };
  const parsed = newUserSchema.safeParse({
    username: formData.get("username"),
    displayName: formData.get("displayName"),
    email: formData.get("email") ?? "",
    roleId: formData.get("roleId"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  try {
    await createUser({
      username: parsed.data.username,
      displayName: parsed.data.displayName,
      email: parsed.data.email || undefined,
      roleId: parsed.data.roleId,
      hash: await hash(parsed.data.password, 10),
    });
  } catch {
    return { error: "Username or email already taken." };
  }
  revalidatePath("/users");
  return {};
}

export async function resetPasswordAction(
  _prev: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  if (!(await requireAdmin())) return { error: "Not allowed." };
  const userId = String(formData.get("userId") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!userId || password.length < 8) return { error: "Min 8 characters." };
  await resetUserPassword(userId, await hash(password, 10));
  revalidatePath("/users");
  return {};
}
