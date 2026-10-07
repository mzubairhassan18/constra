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
import { Card, KpiCard, StatusChip } from "@/ui/cards";
import { DataTable } from "@/ui/data-table";
import { Modal } from "@/ui/modal";

const input = "constra-input";
const btn = "constra-btn-ghost";

export default async function UsersPage() {
  const me = await getSessionUser();
  if (!me) redirect("/login");
  if (!(me.role === "super_admin" || can(me.permissions, "users.write"))) {
    redirect("/dashboard");
  }
  const [users, roles] = await Promise.all([listManagedUsers(), listRoles()]);
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-4 md:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
            <Link href="/dashboard" className="hover:underline">Dashboard</Link> / Users
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight">Users & roles</h1>
          <p className="text-sm text-slate-500">Only super-admins grant roles — menus follow automatically.</p>
        </div>
        <Modal title="Invite user" trigger={<button type="button" className="constra-btn-primary">+ Invite user</button>}>
          <NewUserForm roles={roles} />
        </Modal>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="User metrics">
        <KpiCard label="Total users" value={String(users.length)} hint={`${users.filter((u) => u.isActive).length} active`} />
        {roles.map((r) => (
          <KpiCard
            key={r.id}
            label={r.name}
            value={String(users.filter((u) => u.roleName === r.name).length)}
            hint="logins"
          />
        ))}
      </section>

      <Card title="All logins" subtitle="Set role, activate/deactivate, reset password">
        <DataTable
          columns={[
            {
              key: "u",
              header: "User",
              render: (u: (typeof users)[number]) => (
                <span>
                  <b>{u.displayName}</b>
                  <span className="block text-xs text-slate-500">{u.username}{u.email ? ` · ${u.email}` : ""}</span>
                </span>
              ),
            },
            {
              key: "role",
              header: "Role",
              render: (u) => (
                <form action={setRoleAction} className="flex items-center gap-1">
                  <input type="hidden" name="userId" value={u.id} />
                  <select name="roleId" defaultValue={u.roleId ?? ""} className={`${input} w-32`} aria-label={`Role for ${u.username}`}>
                    <option value="" disabled>Role…</option>
                    {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                  <button className={btn}>Set</button>
                </form>
              ),
            },
            {
              key: "st",
              header: "Status",
              render: (u) => <StatusChip status={u.isActive ? "active" : "inactive"} />,
            },
            {
              key: "act",
              header: "",
              render: (u) => (
                <span className="flex gap-1">
                  {u.id !== me.id && (
                    <form action={setActiveAction}>
                      <input type="hidden" name="userId" value={u.id} />
                      <input type="hidden" name="active" value={u.isActive ? "" : "on"} />
                      <button className={btn}>{u.isActive ? "Deactivate" : "Activate"}</button>
                    </form>
                  )}
                  <ResetPasswordForm userId={u.id} />
                </span>
              ),
            },
          ]}
          rows={users}
          empty="No users yet."
        />
      </Card>
    </main>
  );
}
