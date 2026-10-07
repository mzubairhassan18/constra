import Link from "next/link";
import { requireAccess } from "@/lib/access";
import { listEmployees } from "@/modules/hr/adapters/employees-neon";
import { openAssignments } from "@/modules/hr/adapters/assignments-neon";
import { listProjects } from "@/modules/projects/adapters/projects-neon";
import { assignAction, attendanceAction } from "./actions";
import NewEmployeeForm from "./NewEmployeeForm";
import { Card, KpiCard, StatusChip } from "@/ui/cards";
import { DataTable } from "@/ui/data-table";
import { Modal } from "@/ui/modal";

const input = "constra-input";
const today = () => new Date().toISOString().slice(0, 10);

export default async function HrPage() {
  await requireAccess("hr.read");
  const [employees, open, projects] = await Promise.all([
    listEmployees(),
    openAssignments(),
    listProjects(),
  ]);
  const perm = employees.filter((e) => e.kind === "permanent").length;
  const wager = employees.length - perm;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-4 md:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
            <Link href="/dashboard" className="hover:underline">Dashboard</Link> / HR
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight">People & attendance</h1>
        </div>
        <Modal
          title="Add employee"
          trigger={<button type="button" className="constra-btn-primary">+ Add employee</button>}
        >
          <NewEmployeeForm />
        </Modal>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="HR metrics">
        <KpiCard label="Employees" value={String(employees.length)} hint={`${perm} permanent · ${wager} daily wage`} />
        <KpiCard label="On assignment" value={String(open.length)} hint="open postings" />
        <KpiCard label="Projects staffed" value={String(new Set(open.map((o) => o.projectName)).size)} hint="with labour aboard" />
        <KpiCard label="Attendance" value="Today" hint="log hours per row below" />
      </section>

      <Card title="Employees" subtitle="Open a profile for visas, salary, documents">
        <DataTable
          columns={[
            {
              key: "name",
              header: "Name",
              render: (e: (typeof employees)[number]) => (
                <Link href={`/hr/${e.id}`} className="font-semibold hover:underline">{e.name}</Link>
              ),
            },
            {
              key: "kind",
              header: "Type",
              render: (e) => <StatusChip status={e.kind.replace("_", " ")} />,
            },
            { key: "role", header: "Designation", render: (e) => e.designation ?? "—" },
            {
              key: "open",
              header: "",
              render: (e) => (
                <Link href={`/hr/${e.id}`} className="constra-btn-ghost inline-block">Open →</Link>
              ),
            },
          ]}
          rows={employees}
          empty="No employees yet — add your first hire above."
        />
      </Card>

      <Card title="Assign to project" subtitle="Assigning closes any open posting on the start date — history is kept">
        <form action={assignAction} className="flex flex-wrap gap-2">
          <select name="employeeId" required className={input} defaultValue="">
            <option value="" disabled>Employee…</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <select name="projectId" required className={input} defaultValue="">
            <option value="" disabled>Project…</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input name="fromDate" type="date" required defaultValue={today()} className={input} aria-label="Start date" />
          <button className="constra-btn-primary">Assign</button>
        </form>
      </Card>

      <Card title="Open assignments — log attendance" subtitle="Hours feed stage labour cost automatically">
        <DataTable
          columns={[
            {
              key: "who",
              header: "Employee → site",
              render: (o: (typeof open)[number]) => (
                <span><b>{o.employeeName}</b> <span className="text-slate-500">→ {o.projectName} · since {o.fromDate}</span></span>
              ),
            },
            {
              key: "log",
              header: "Log hours",
              render: (o) => (
                <form action={attendanceAction} className="flex items-center gap-1">
                  <input type="hidden" name="assignmentId" value={o.id} />
                  <input name="date" type="date" required defaultValue={today()} className={`${input} w-32`} aria-label="Date" />
                  <input name="hours" inputMode="decimal" required placeholder="Hrs" className={`${input} w-20`} aria-label="Hours" />
                  <button className="constra-btn-ghost whitespace-nowrap">Log</button>
                </form>
              ),
            },
          ]}
          rows={open}
          empty="No open assignments."
        />
      </Card>
    </main>
  );
}
