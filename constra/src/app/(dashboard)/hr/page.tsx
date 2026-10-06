import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { listEmployees } from "@/modules/hr/adapters/employees-neon";
import { openAssignments } from "@/modules/hr/adapters/assignments-neon";
import { listProjects } from "@/modules/projects/adapters/projects-neon";
import { assignAction, attendanceAction } from "./actions";
import NewEmployeeForm from "./NewEmployeeForm";

export const instant = false;

const input =
  "rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900";
const btn = "rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700";

export default async function HrPage() {
  if (!(await getSessionUser())) redirect("/login");
  const [employees, open, projects] = await Promise.all([
    listEmployees(),
    openAssignments(),
    listProjects(),
  ]);
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">HR</h1>
        <Link href="/dashboard" className="text-sm underline">Dashboard</Link>
      </header>
      <NewEmployeeForm />
      <section>
        <h2 className="font-semibold">Employees</h2>
        <ul className="mt-2 flex flex-col gap-2">
          {employees.map((e) => (
            <li key={e.id} className="rounded border border-zinc-200 p-3 text-sm dark:border-zinc-800">
              <Link href={`/hr/${e.id}`} className="font-semibold underline">{e.name}</Link>
              <span className="text-zinc-500"> · {e.kind.replace("_", " ")}{e.designation ? ` · ${e.designation}` : ""}</span>
            </li>
          ))}
          {employees.length === 0 && <p className="text-sm text-zinc-500">No employees yet.</p>}
        </ul>
      </section>
      <section className="rounded border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="font-semibold">Assign to project</h2>
        <form action={assignAction} className="mt-2 flex flex-wrap gap-2">
          <select name="employeeId" required className={input} defaultValue="">
            <option value="" disabled>Employee…</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <select name="projectId" required className={input} defaultValue="">
            <option value="" disabled>Project…</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input name="fromDate" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className={input} />
          <button className={btn}>Assign</button>
        </form>
        <p className="mt-1 text-xs text-zinc-500">Assigning closes any open assignment on the start date — history is kept.</p>
      </section>
      <section>
        <h2 className="font-semibold">Open assignments — log attendance</h2>
        <ul className="mt-2 flex flex-col gap-2">
          {open.map((o) => (
            <li key={o.id} className="flex flex-wrap items-center gap-2 rounded border border-zinc-200 p-3 text-sm dark:border-zinc-800">
              <span><b>{o.employeeName}</b> → {o.projectName} (since {o.fromDate})</span>
              <form action={attendanceAction} className="flex items-center gap-1">
                <input type="hidden" name="assignmentId" value={o.id} />
                <input name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className={input} />
                <input name="hours" inputMode="decimal" required placeholder="Hours" className={`${input} w-20`} />
                <button className={btn}>Log</button>
              </form>
            </li>
          ))}
          {open.length === 0 && <p className="text-sm text-zinc-500">No open assignments.</p>}
        </ul>
      </section>
    </main>
  );
}
