import Link from "next/link";
import { requireAccess } from "@/lib/access";
import {
  listQuotations,
  listVehicles,
} from "@/modules/fleet/adapters/fleet-neon";
import { addQuotationAction, addVehicleAction, setQuotationStatusAction } from "./actions";
import { Card, KpiCard, StatusChip } from "@/ui/cards";
import { DataTable } from "@/ui/data-table";
import { Modal } from "@/ui/modal";

const input = "constra-input";
const btn = "constra-btn-ghost";

export default async function FleetPage() {
  await requireAccess("fleet.read");
  const [vehicles, quotations] = await Promise.all([listVehicles(), listQuotations()]);
  const maint = vehicles.reduce((n, v) => n + Number(v.maintenanceTotal ?? 0), 0);
  const fines = vehicles.reduce((n, v) => n + Number(v.fineTotal ?? 0), 0);
  const expiring = vehicles.filter((v) => v.mulkiaExpiry ?? v.insuranceExpiry).length;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-4 md:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
            <Link href="/dashboard" className="hover:underline">Dashboard</Link> / Fleet
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight">Fleet & quotations</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Modal title="Add vehicle" trigger={<button type="button" className="constra-btn-primary">+ Vehicle</button>}>
            <form action={addVehicleAction} className="flex flex-col gap-3">
              <input name="plateNo" required maxLength={50} placeholder="Plate no — e.g. DUBAI 12345" className={input} />
              <input name="type" required maxLength={100} placeholder="Type — e.g. Pickup, Crane" className={input} />
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm">Mulkia expiry<input name="mulkiaExpiry" type="date" className={input} /></label>
                <label className="text-sm">Insurance expiry<input name="insuranceExpiry" type="date" className={input} /></label>
              </div>
              <button className="constra-btn-primary w-full">Add vehicle</button>
            </form>
          </Modal>
          <Modal title="New quotation" trigger={<button type="button" className={btn}>+ Quotation</button>}>
            <form action={addQuotationAction} className="flex flex-col gap-3">
              <input name="clientName" required maxLength={200} placeholder="Client" className={input} />
              <input name="projectName" maxLength={200} placeholder="Project" className={input} />
              <input name="date" type="date" required className={input} aria-label="Date" />
              <input name="amount" required inputMode="decimal" placeholder="Amount (AED)" className={input} />
              <input name="notes" maxLength={2000} placeholder="Notes" className={input} />
              <button className="constra-btn-primary w-full">Save quotation</button>
            </form>
          </Modal>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Fleet metrics">
        <KpiCard label="Vehicles" value={String(vehicles.length)} hint="registered" />
        <KpiCard label="Maintenance" value={`AED ${maint.toFixed(0)}`} hint="total spend" />
        <KpiCard label="Fines" value={`AED ${fines.toFixed(0)}`} hint="total" delta={fines > 0 ? "review" : undefined} />
        <KpiCard label="With expiries" value={String(expiring)} hint="mulkia / insurance set" />
      </section>

      <Card title="Vehicles" subtitle="Plate, type, running costs and document expiries">
        <DataTable
          columns={[
            {
              key: "v",
              header: "Vehicle",
              render: (v: (typeof vehicles)[number]) => (
                <span><b>{v.plateNo}</b><span className="block text-xs text-slate-500">{v.type}</span></span>
              ),
            },
            { key: "m", header: "Maintenance", align: "right", render: (v) => `AED ${Number(v.maintenanceTotal ?? 0).toFixed(0)}` },
            { key: "f", header: "Fines", align: "right", render: (v) => `AED ${Number(v.fineTotal ?? 0).toFixed(0)}` },
            { key: "doc", header: "Documents", render: (v) => (
              <span className="text-xs">{v.mulkiaExpiry ? `Mulkia ${v.mulkiaExpiry} ` : ""}{v.insuranceExpiry ? `Ins ${v.insuranceExpiry}` : ""}{!v.mulkiaExpiry && !v.insuranceExpiry && "—"}</span>
            ) },
          ]}
          rows={vehicles}
          empty="No vehicles yet."
        />
      </Card>

      <Card title="Quotations" subtitle="Draft → sent → accepted / rejected">
        <DataTable
          columns={[
            {
              key: "q",
              header: "Quotation",
              render: (q: (typeof quotations)[number]) => (
                <span><b>{q.clientName}</b>{q.projectName ? ` · ${q.projectName}` : ""}<span className="block text-xs text-slate-500">{q.date} · AED {q.amount}</span></span>
              ),
            },
            { key: "st", header: "Status", render: (q) => <StatusChip status={q.status} /> },
            {
              key: "act",
              header: "",
              render: (q) => (
                <form action={setQuotationStatusAction} className="flex gap-1">
                  <input type="hidden" name="id" value={q.id} />
                  <select name="status" defaultValue={q.status} className={`${input} w-28`} aria-label="Status">
                    <option value="draft">draft</option>
                    <option value="sent">sent</option>
                    <option value="accepted">accepted</option>
                    <option value="rejected">rejected</option>
                  </select>
                  <button className={btn}>Set</button>
                </form>
              ),
            },
          ]}
          rows={quotations}
          empty="No quotations yet."
        />
      </Card>
    </main>
  );
}
