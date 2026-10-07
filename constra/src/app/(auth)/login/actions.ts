"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { login } from "@/modules/auth/use-cases/login";
import { neonUsers } from "@/modules/auth/adapters/users-neon";
import { createSession, destroySession } from "@/lib/session";
import { homeFor } from "@/lib/access";

const credentials = z.object({
  username: z.string().trim().min(1, "Username is required").max(100),
  password: z.string().min(1, "Password is required").max(200),
});

export interface LoginState {
  error?: string;
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = credentials.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  // Authorization is also enforced per use-case/page — proxy is only the outer gate.
  const result = await login(
    neonUsers,
    parsed.data.username,
    parsed.data.password,
  );
  if (!result.ok) {
    return {
      error:
        result.error === "inactive"
          ? "Account is deactivated. Contact admin."
          : "Invalid username or password.",
    };
  }
  await createSession(result.user);
  redirect(homeFor(result.user));
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}
