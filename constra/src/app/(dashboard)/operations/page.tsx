import Link from "next/link";
import { requireAccess } from "@/lib/access";
import {
  listDailyReports,
  listManpower,
  listMaterialRequests,
} from "@/modules/operations/adapters/operations-neon";
import { listProjects } from "@/modules/projects/adapters/projects-neon";
import {
  clearBalanceAction,
  setRequestStatusAction,
} from "./actions";
import ManpowerForm from "./ManpowerForm";
import RequestForm from "./RequestForm";
import ReportForm from "./ReportForm";

const btn = "rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700";

export default async function OperationsPage() {
  await requireAccess("operations.read");
  const [entries, requests, reports, projects] = await Promise.all([
    listManpower(),
    listMaterialRequests(),
    listDailyReports(),
    listProjects(),
  ]);

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Operations</h1>
        <Link href="/dashboard" className="text-sm underline">Dashboard</Link>
      </header>

      <ManpowerForm projects={projects.map((p) => ({ id: p.id, name: p.name }))} />

      <section>
        <h2 className="font-semibold">Manpower entries</h2>
        <ul className="mt-2 flex flex-col gap-2 text-sm">
          {entries.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center gap-2 rounded border border-zinc-200 p-3 dark:border-zinc-800">
              <span>{e.date} · <b>{e.name}</b>{e.skill ? ` (${e.skill})` : ""} · {e.hours}h × {e.rate} = {(e.rate * e.hours).toFixed(2)} · paid {e.paid} · <b>due {e.balance}</b></span>
              {e.balance > 0 && (
                <form action={clearBalanceAction} className="flex items-center gap-1">
                  <input type="hidden" name="entryId" value={e.id} />
                  <input type="hidden" name="amount" value={e.balance} />
                  <button className={btn}>Clear due {e.balance}</button>
                </form>
              )}
            </li>
          ))}
          {entries.length === 0 && <p className="text-sm text-zinc-500">No entries yet.</p>}
        </ul>
      </section>

      <RequestForm projects={projects.map((p) => ({ id: p.id, name: p.name }))} />

      <section>
        <h2 className="font-semibold">Material requests</h2>
        <ul className="mt-2 flex flex-col gap-2 text-sm">
          {requests.map((r) => (
            <li key={r.id} className="rounded border border-zinc-200 p-3 dark:border-zinc-800">
              <p>{r.date} · {r.projectName ?? "—"} · <b>{r.status}</b></p>
              <p className="text-zinc-500">{r.lines.map((l) => `${l.materialName} × ${l.qty}`).join(", ")}</p>
              {r.status === "pending" && (
                <span className="flex gap-1">
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
                </span>
              )}
              {r.status === "approved" && (
                <form action={setRequestStatusAction}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="status" value="fulfilled" />
                  <button className={btn}>Mark fulfilled</button>
                </form>
              )}
            </li>
          ))}
        </ul>
      </section>

      <ReportForm projects={projects.map((p) => ({ id: p.id, name: p.name }))} />

      <section>
        <h2 className="font-semibold">Daily reports</h2>
        <ul className="mt-2 flex flex-col gap-2 text-sm">
          {reports.map((r) => (
            <li key={r.id} className="rounded border border-zinc-200 p-3 dark:border-zinc-800">
              <p><b>{r.date}</b> · {r.projectName}</p>
              <p>{r.workDone}</p>
              {r.delays && <p className="text-red-600">Delays: {r.delays}</p>}
              {r.photoKeys.length > 0 && (
                <p className="flex flex-wrap gap-2">
                  {r.photoKeys.map((k) => (
                    <a key={k} href={`/api/photos?key=${encodeURIComponent(k)}`} target="_blank" className="text-sm underline">
                      Photo
                    </a>
                  ))}
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
