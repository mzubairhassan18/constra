import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { logoutAction } from "@/app/(auth)/login/actions";
import sql from "@/lib/db";

export const instant = false;

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [projects, employees, stages] = await Promise.all([
    sql`SELECT count(*)::int AS n FROM projects`,
    sql`SELECT count(*)::int AS n FROM employees`,
    sql`SELECT count(*)::int AS n FROM stages WHERE status = 'in_progress'`,
  ]);

  const cards = [
    { label: "Projects", value: projects[0].n },
    { label: "Employees", value: employees[0].n },
    { label: "Stages in progress", value: stages[0].n },
  ];

  const links = ["projects", "hr", "bills", "finance", "masters"];

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-zinc-500">
            {user.displayName} · {user.role}
          </p>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded border border-zinc-300 px-3 py-1.5 text-sm"
          >
            Sign out
          </button>
        </form>
      </header>
      <nav className="flex flex-wrap gap-2">
        {links.map((l) => (
          <a key={l} href={`/${l}`} className="rounded border border-zinc-300 px-3 py-1.5 text-sm capitalize">
            {l}
          </a>
        ))}
      </nav>
      <section className="grid grid-cols-3 gap-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <p className="text-3xl font-bold">{c.value}</p>
            <p className="text-sm text-zinc-500">{c.label}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
