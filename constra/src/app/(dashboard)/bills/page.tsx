import Link from "next/link";
import { listBills } from "@/modules/finance/adapters/bills-neon";
import { listSuppliers } from "@/modules/finance/adapters/ledger-neon";
import { listProjects } from "@/modules/projects/adapters/projects-neon";
import sql from "@/lib/db";
import BillForm from "./BillForm";
import { BillInvoice } from "./BillInvoice";
import { Card, KpiCard } from "@/ui/cards";
import { DataTable } from "@/ui/data-table";
import { Modal } from "@/ui/modal";

const aed = (n: number) =>
  `AED ${n.toLocaleString("en-AE", { maximumFractionDigits: 2 })}`;

export default async function BillsPage() {
  const [bills, suppliers, projects] = await Promise.all([
    listBills(),
    listSuppliers(),
    listProjects(),
  ]);
  const stages = await sql`SELECT id, project_id, name FROM stages ORDER BY project_id, position`;

  const month = new Date().toISOString().slice(0, 7);
  const thisMonth = bills.filter((b) => b.date.startsWith(month));
  const gross = bills.reduce((n, b) => n + b.gross, 0);
  const vatIn = bills.reduce((n, b) => n + b.vatIn, 0);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-4 md:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
            <Link href="/dashboard" className="hover:underline">Dashboard</Link> / Bills
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Supplier bills ({bills.length})
          </h1>
          <p className="text-sm text-slate-500">VAT auto-posts Dr expense + Dr VAT-in / Cr payable</p>
        </div>
        <Modal
          title="New supplier bill"
          trigger={<button type="button" className="constra-btn-primary">+ New bill</button>}
        >
          <BillForm
            suppliers={suppliers}
            projects={projects.map((p) => ({ id: p.id, name: p.name }))}
            stages={(stages as { id: string; project_id: string; name: string }[]).map((s) => ({
              id: s.id,
              projectId: s.project_id,
              name: s.name,
            }))}
          />
        </Modal>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Bill metrics">
        <KpiCard label="Billed this month" value={aed(thisMonth.reduce((n, b) => n + b.gross, 0))} hint={`${thisMonth.length} bills`} />
        <KpiCard label="Total billed" value={aed(gross)} hint="all time gross" />
        <KpiCard label="VAT-in claimable" value={aed(vatIn)} hint="input tax" delta="5%" />
        <KpiCard
          label="With receipts"
          value={String(bills.filter((b) => b.images > 0).length)}
          hint={`${bills.reduce((n, b) => n + b.images, 0)} files attached`}
        />
      </section>

      <Card title="All bills" subtitle="Click 🖨 for the printable invoice with attachments">
        <DataTable
          columns={[
            {
              key: "inv",
              header: "Invoice",
              render: (b: (typeof bills)[number]) => (
                <span>
                  <b>{b.invoiceNo ?? "—"}</b>
                  <span className="block text-xs text-slate-500">{b.date}</span>
                </span>
              ),
            },
            {
              key: "party",
              header: "Supplier / site",
              render: (b) => (
                <span>
                  {b.supplier ?? "—"}
                  <span className="block text-xs text-slate-500">
                    {[b.project, b.stage].filter(Boolean).join(" / ") || "—"}
                  </span>
                </span>
              ),
            },
            { key: "net", header: "Net", align: "right", render: (b) => aed(b.net) },
            { key: "vat", header: "VAT", align: "right", render: (b) => aed(b.vatIn) },
            { key: "gross", header: "Gross", align: "right", render: (b) => <b>{aed(b.gross)}</b> },
            {
              key: "files",
              header: "Files",
              render: (b) => (b.images > 0 ? <span className="constra-chip">📎 {b.images}</span> : <span className="text-slate-400">—</span>),
            },
            {
              key: "print",
              header: "",
              render: (b) => <BillInvoice billId={b.id} label={b.invoiceNo ?? "Invoice"} />,
            },
          ]}
          rows={bills}
          empty="No bills yet — post your first supplier bill above."
        />
      </Card>
    </main>
  );
}
