import Link from "next/link";
import { requireAccess } from "@/lib/access";
import { can } from "@/modules/auth/domain/types";
import {
  listDailyReports,
  listManpower,
  listMaterialRequests,
} from "@/modules/operations/adapters/operations-neon";
import { myAssignments } from "@/modules/hr/adapters/assignments-neon";
import { listProjects } from "@/modules/projects/adapters/projects-neon";
import {
  clearBalanceAction,
  setRequestStatusAction,
} from "./actions";
import { attendanceAction } from "../hr/actions";
import ManpowerForm from "./ManpowerForm";
import RequestForm from "./RequestForm";
import ReportForm from "./ReportForm";
import { Card, KpiCard, StatusChip } from "@/ui/cards";
import { DataTable } from "@/ui/data-table";
import { Modal } from "@/ui/modal";

const btn = "constra-btn-ghost";
const input = "constra-input";
const today = () => new Date().toISOString().slice(0, 10);
const aed = (n: number) => `AED ${Number(n).toFixed(2)}`;

export default async function OperationsPage() {
  const user = await requireAccess("operations.read");
  const [entries, requests, reports, projects, mine] = await Promise.all([
    listManpower(),
    listMaterialRequests(),
    listDailyReports(),
    listProjects(),
    myAssignments(user.id),
  ]);
  const pending = requests.filter((r) => r.status === "pending").length;
  const due = entries.reduce((n, e) => n + e.balance, 0);
  const showAttendance = can(user.permissions, "hr.attendance") || can(user.permissions, "hr.write");

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-4 md:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
            <Link href="/dashboard" className="hover:underline">Dashboard</Link> / Operations
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight">Site operations</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Modal title="Daily site report" trigger={<button type="button" className="constra-btn-primary">+ Daily report</button>}>
            <ReportForm projects={projects.map((p) => ({ id: p.id, name: p.name }))} />
          </Modal>
          <Modal title="Material request" trigger={<button type="button" className={btn}>+ Material request</button>}>
            <RequestForm projects={projects.map((p) => ({ id: p.id, name: p.name }))} />
          </Modal>
          <Modal title="Log manpower" trigger={<button type="button" className={btn}>+ Manpower</button>}>
            <ManpowerForm projects={projects.map((p) => ({ id: p.id, name: p.name }))} />
          </Modal>
        </div>
      </header>

      <Card
        title={`My work — ${user.displayName}`}
        subtitle="Your current postings. Update progress with a daily report, log attendance, request material."
      >
        {mine.length > 0 ? (
          <DataTable
            columns={[
              {
                key: "site",
                header: "Posting",
                render: (m: (typeof mine)[number]) => (
                  <span>
                    <b>{m.projectName}</b>
                    {m.stageName && <span className="text-slate-500"> / {m.stageName}</span>}
                    <span className="block text-xs text-slate-500">since {m.fromDate} · {m.allocationPct}%</span>
                  </span>
                ),
              },
              ...(showAttendance
                ? [{
                    key: "att",
                    header: "Attendance",
                    render: (m: (typeof mine)[number]) => (
                      <form action={attendanceAction} className="flex items-center gap-1">
                        <input type="hidden" name="assignmentId" value={m.id} />
                        <input name="date" type="date" required defaultValue={today()} className={`${input} w-32`} aria-label="Date" />
                        <input name="hours" inputMode="decimal" required placeholder="Hrs" className={`${input} w-20`} aria-label="Hours" />
                        <button className="constra-btn-ghost whitespace-nowrap">Log</button>
                      </form>
                    ),
                  }]
                : []),
            ]}
            rows={mine}
            empty="—"
          />
        ) : (
          <p className="text-sm text-slate-500">
            No open posting linked to your login. HR can link you to an employee
            record — then your sites, attendance and tasks appear here. Use the
            buttons above to file reports and requests in the meantime.
          </p>
        )}
      </Card>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Operations metrics">
        <KpiCard label="Pending requests" value={String(pending)} hint="need a decision" />
        <KpiCard label="Wager dues" value={aed(due)} hint="unpaid manpower" />
        <KpiCard label="Reports filed" value={String(reports.length)} hint="daily site reports" />
        <KpiCard label="Manpower entries" value={String(entries.length)} hint="logged shifts" />
      </section>

      <Card title="Material requests" subtitle="Approve → fulfilled. Foremen are notified of decisions.">
        <DataTable
          columns={[
            {
              key: "req",
              header: "Request",
              render: (r: (typeof requests)[number]) => (
                <span>
                  <b>{r.projectName ?? "—"}</b>
                  <span className="block text-xs text-slate-500">{r.date} · {r.lines.map((l) => `${l.materialName} × ${l.qty}`).join(", ")}</span>
                </span>
              ),
            },
            { key: "st", header: "Status", render: (r) => <StatusChip status={r.status} /> },
            {
              key: "act",
              header: "",
              render: (r) => (
                <span className="flex gap-1">
                  {r.status === "pending" && (
                    <>
                      <form action={setRequestStatusAction}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="status" value="approved" />
                        <button className={btn}>Approve</button>
                      </form>
                      <form action={setRequestStatusAction}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="status" value="rejected" />
                        <button className={btn}>Reject</button>
                      </form>
                    </>
                  )}
                  {r.status === "approved" && (
                    <form action={setRequestStatusAction}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="status" value="fulfilled" />
                      <button className={btn}>Mark fulfilled</button>
                    </form>
                  )}
                </span>
              ),
            },
          ]}
          rows={requests}
          empty="No material requests."
        />
      </Card>

      <Card title="Daily reports" subtitle="Progress, delays and site photos">
        <ul className="flex flex-col gap-3">
          {reports.map((r) => (
            <li key={r.id} className="constra-card p-4">
              <p className="text-xs font-semibold text-slate-500">{r.date} · {r.projectName}</p>
              <p className="mt-1 text-sm">{r.workDone}</p>
              {r.delays && <p className="mt-1 text-sm text-red-600">Delays: {r.delays}</p>}
              {r.photoKeys.length > 0 && (
                <p className="mt-2 flex flex-wrap gap-2">
                  {r.photoKeys.map((k) => (
                    <a key={k} href={`/api/photos?key=${encodeURIComponent(k)}`} target="_blank" className="text-sm font-semibold text-amber-600 hover:underline">
                      📷 Photo
                    </a>
                  ))}
                </p>
              )}
            </li>
          ))}
          {reports.length === 0 && <p className="text-sm text-slate-500">No reports yet — file the first one above.</p>}
        </ul>
      </Card>

      <Card title="Manpower entries" subtitle="Daily-wage shifts with dues">
        <DataTable
          columns={[
            {
              key: "who",
              header: "Worker",
              render: (e: (typeof entries)[number]) => (
                <span><b>{e.name}</b>{e.skill ? ` (${e.skill})` : ""}<span className="block text-xs text-slate-500">{e.date} · {e.hours}h × {aed(e.rate)}</span></span>
              ),
            },
            { key: "paid", header: "Paid", align: "right", render: (e) => aed(e.paid) },
            { key: "due", header: "Due", align: "right", render: (e) => <b className={e.balance > 0 ? "text-amber-700" : "text-emerald-600"}>{aed(e.balance)}</b> },
            {
              key: "act",
              header: "",
              render: (e) =>
                e.balance > 0 ? (
                  <form action={clearBalanceAction} className="flex items-center gap-1">
                    <input type="hidden" name="entryId" value={e.id} />
                    <input type="hidden" name="amount" value={e.balance} />
                    <button className={btn}>Clear {aed(e.balance)}</button>
                  </form>
                ) : (
                  <span className="text-xs text-emerald-600">✓ settled</span>
                ),
            },
          ]}
          rows={entries}
          empty="No manpower entries yet."
        />
      </Card>
    </main>
  );
}
