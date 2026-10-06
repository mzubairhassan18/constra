import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { can } from "@/modules/auth/domain/types";
import {
  listManagedUsers,
  listRoles,
} from "@/modules/auth/adapters/users-manage-neon";
import { setActiveAction, setRoleAction } from "./actions";
import NewUserForm from "./NewUserForm";
import ResetPasswordForm from "./ResetPasswordForm";

export const instant = false;

const btn = "rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700";
const input =
  "rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900";

export default async function UsersPage() {
  const me = await getSessionUser();
  if (!me) redirect("/login");
  if (!(me.role === "super_admin" || can(me.permissions, "users.write"))) {
    redirect("/dashboard");
  }
  const [users, roles] = await Promise.all([listManagedUsers(), listRoles()]);
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Users</h1>
        <Link href="/dashboard" className="text-sm underline">Dashboard</Link>
      </header>
      <NewUserForm roles={roles} />
      <ul className="flex flex-col gap-2 text-sm">
        {users.map((u) => (
          <li key={u.id} className="flex flex-wrap items-center gap-2 rounded border border-zinc-200 p-3 dark:border-zinc-800">
            <span>
              <b>{u.displayName}</b> · {u.username} · {u.roleName ?? "no role"} · {u.isActive ? "active" : "inactive"}
            </span>
            <form action={setRoleAction} className="flex items-center gap-1">
              <input type="hidden" name="userId" value={u.id} />
              <select name="roleId" defaultValue={u.roleId ?? ""} className={input}>
                <option value="" disabled>Role…</option>
                {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              <button className={btn}>Set role</button>
            </form>
            {u.id !== me.id && (
              <form action={setActiveAction}>
                <input type="hidden" name="userId" value={u.id} />
                <input type="hidden" name="active" value={u.isActive ? "" : "on"} />
                <button className={btn}>{u.isActive ? "Deactivate" : "Activate"}</button>
              </form>
            )}
            <ResetPasswordForm userId={u.id} />
          </li>
        ))}
      </ul>
    </main>
  );
}
