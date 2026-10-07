import Link from "next/link";
import { requireAccess } from "@/lib/access";
import {
  listMaterials,
  listSuppliers,
} from "@/modules/finance/adapters/ledger-neon";
import { addMaterialAction, addSupplierAction } from "./actions";
import { Card, KpiCard } from "@/ui/cards";
import { DataTable } from "@/ui/data-table";
import { Modal } from "@/ui/modal";

const input = "constra-input";

export default async function MastersPage() {
  await requireAccess("masters.read");
  const [suppliers, materials] = await Promise.all([listSuppliers(), listMaterials()]);
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-4 md:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
            <Link href="/dashboard" className="hover:underline">Dashboard</Link> / Masters
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight">Suppliers & materials</h1>
          <p className="text-sm text-slate-500">Shared dropdowns for bills and material requests.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Modal title="Add supplier" trigger={<button type="button" className="constra-btn-primary">+ Supplier</button>}>
            <form action={addSupplierAction} className="flex flex-col gap-3">
              <input name="name" required maxLength={200} placeholder="Supplier name" className={input} />
              <input name="phone" maxLength={50} placeholder="Phone" className={input} />
              <input name="trnNo" maxLength={50} placeholder="TRN (required for VAT claims)" className={input} />
              <button className="constra-btn-primary w-full">Add supplier</button>
            </form>
          </Modal>
          <Modal title="Add material" trigger={<button type="button" className="constra-btn-ghost">+ Material</button>}>
            <form action={addMaterialAction} className="flex flex-col gap-3">
              <input name="name" required maxLength={200} placeholder="Material — e.g. Cement 50kg" className={input} />
              <input name="unit" maxLength={20} placeholder="Unit — e.g. bag, kg, m³" className={input} />
              <button className="constra-btn-primary w-full">Add material</button>
            </form>
          </Modal>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3" aria-label="Master metrics">
        <KpiCard label="Suppliers" value={String(suppliers.length)} hint={`${suppliers.filter((s) => s.trnNo).length} with TRN`} />
        <KpiCard label="Materials" value={String(materials.length)} hint="in catalogue" />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Suppliers">
          <DataTable
            columns={[
              { key: "n", header: "Name", render: (s: (typeof suppliers)[number]) => <b>{s.name}</b> },
              { key: "t", header: "TRN", render: (s) => s.trnNo ?? <span className="text-amber-600">missing</span> },
            ]}
            rows={suppliers}
            empty="No suppliers yet."
          />
        </Card>
        <Card title="Materials">
          <DataTable
            columns={[
              { key: "n", header: "Name", render: (m: (typeof materials)[number]) => <b>{m.name}</b> },
              { key: "u", header: "Unit", render: (m) => m.unit ?? "—" },
            ]}
            rows={materials}
            empty="No materials yet."
          />
        </Card>
      </div>
    </main>
  );
}
