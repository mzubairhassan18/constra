import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import {
  listQuotations,
  listVehicles,
} from "@/modules/fleet/adapters/fleet-neon";
import { addQuotationAction, addVehicleAction, setQuotationStatusAction } from "./actions";

const input =
  "rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900";
const btn = "rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700";

export default async function FleetPage() {
  if (!(await getSessionUser())) redirect("/login");
  const [vehicles, quotations] = await Promise.all([listVehicles(), listQuotations()]);
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Fleet</h1>
        <Link href="/dashboard" className="text-sm underline">Dashboard</Link>
      </header>
      <section className="rounded border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="font-semibold">Vehicles</h2>
        <form action={addVehicleAction} className="mt-2 flex flex-wrap gap-2">
          <input name="plateNo" required maxLength={50} placeholder="Plate no" className={input} />
          <input name="type" required maxLength={100} placeholder="Type" className={input} />
          <input name="mulkiaExpiry" type="date" className={input} />
          <input name="insuranceExpiry" type="date" className={input} />
          <button className={btn}>Add</button>
        </form>
        <ul className="mt-2 text-sm">
          {vehicles.map((v) => (
            <li key={v.id}>
              {v.plateNo} · {v.type} · maint {v.maintenanceTotal} · fines {v.fineTotal}
              {v.mulkiaExpiry ? ` · mulkia ${v.mulkiaExpiry}` : ""}
              {v.insuranceExpiry ? ` · ins ${v.insuranceExpiry}` : ""}
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="font-semibold">Quotations</h2>
        <form action={addQuotationAction} className="mt-2 flex flex-wrap gap-2">
          <input name="clientName" required maxLength={200} placeholder="Client" className={input} />
          <input name="projectName" maxLength={200} placeholder="Project" className={input} />
          <input name="date" type="date" required className={input} />
          <input name="amount" required inputMode="decimal" placeholder="Amount" className={input} />
          <input name="notes" maxLength={2000} placeholder="Notes" className={input} />
          <button className={btn}>Add</button>
        </form>
        <ul className="mt-2 text-sm">
          {quotations.map((q) => (
            <li key={q.id} className="flex flex-wrap items-center gap-2">
              <span>{q.clientName}{q.projectName ? ` · ${q.projectName}` : ""} · {q.date} · {q.amount} · {q.status}</span>
              <form action={setQuotationStatusAction} className="flex gap-1">
                <input type="hidden" name="id" value={q.id} />
                <select name="status" defaultValue={q.status} className={input}>
                  <option value="draft">draft</option>
                  <option value="sent">sent</option>
                  <option value="accepted">accepted</option>
                  <option value="rejected">rejected</option>
                </select>
                <button className={btn}>Set</button>
              </form>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
