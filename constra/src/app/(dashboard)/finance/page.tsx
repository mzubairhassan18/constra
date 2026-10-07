import Link from "next/link";
import { requireAccess } from "@/lib/access";
import {
  recentEntries,
  trialBalance,
  vatPosition,
} from "@/modules/finance/adapters/ledger-neon";
import { listInvoices } from "@/modules/finance/adapters/bills-neon";
import { listProjects } from "@/modules/projects/adapters/projects-neon";
import { createReceiptAction } from "./actions";
import InvoiceForm from "./InvoiceForm";
import { Card, KpiCard } from "@/ui/cards";
import { BarChart, DonutChart } from "@/ui/charts";
import { DataTable } from "@/ui/data-table";
import { Modal } from "@/ui/modal";

const input = "constra-input";
const aed = (n: number) =>
  `AED ${n.toLocaleString("en-AE", { maximumFractionDigits: 2 })}`;

export default async function FinancePage() {
  await requireAccess("finance.read");
  const [entries, trial, vat, invoices, projects] = await Promise.all([
    recentEntries(20),
    trialBalance(),
    vatPosition(),
    listInvoices(),
    listProjects(),
  ]);
  const tDr = trial.reduce((n, t) => n + t.debit, 0);
  const tCr = trial.reduce((n, t) => n + t.credit, 0);
  const balanced = Math.abs(tDr - tCr) < 0.01;
  const receivable = invoices.reduce((n, i) => n + i.balance, 0);

  const topAccounts = [...trial]
    .sort((a, b) => b.debit + b.credit - (a.debit + a.credit))
    .slice(0, 8)
    .map((t, i) => ({
      label: t.code,
      value: Math.round(t.debit + t.credit),
      color: ["#1e4278", "#f59e0b", "#10b981", "#8b5cf6", "#ef4444"][i % 5],
    }));

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-4 md:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
            <Link href="/dashboard" className="hover:underline">Dashboard</Link> / Finance
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight">Ledger Explorer</h1>
          <p className="text-sm text-slate-500">
            <span className={balanced ? "font-semibold text-emerald-600" : "font-semibold text-red-600"}>
              {balanced ? "● Dr = Cr — books balance" : "● OUT OF BALANCE — investigate"}
            </span>
            {" · "}every number below links to its source document
          </p>
        </div>
        <Modal
          title="New client invoice"
          trigger={<button type="button" className="constra-btn-primary">+ New invoice</button>}
        >
          <InvoiceForm projects={projects.map((p) => ({ id: p.id, name: p.name }))} />
        </Modal>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Finance KPIs">
        <KpiCard label="VAT out" value={aed(vat.vatOut)} hint="on client invoices" />
        <KpiCard label="VAT in" value={aed(vat.vatIn)} hint="on supplier bills" />
        <KpiCard label="Net VAT payable" value={aed(vat.net)} hint="out − in, this period" delta="FTA" />
        <KpiCard label="Receivable due" value={aed(receivable)} hint={`${invoices.filter((i) => i.balance > 0).length} open invoices`} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card title="VAT position" subtitle="Output tax vs input tax">
          <DonutChart
            data={[
              { label: "VAT out", value: Math.max(0, vat.vatOut), color: "#1e4278" },
              { label: "VAT in", value: Math.max(0, vat.vatIn), color: "#f59e0b" },
            ]}
            format={aed}
          />
        </Card>
        <Card title="Busiest accounts" subtitle="By total debit + credit movement">
          {topAccounts.length > 0 ? (
            <BarChart data={topAccounts} format={aed} />
          ) : (
            <p className="text-sm text-slate-500">No postings yet.</p>
          )}
        </Card>
      </section>

      <Card
        title="Client invoices"
        subtitle="Record partial payments — due updates instantly"
        action={<span className="constra-chip">{invoices.filter((i) => i.balance > 0).length} open</span>}
      >
        <DataTable
          columns={[
            { key: "no", header: "Invoice", render: (r: (typeof invoices)[number]) => <b>{r.invoiceNo ?? "—"}</b> },
            { key: "gross", header: "Billed", align: "right", render: (r) => aed(r.gross) },
            { key: "paid", header: "Paid", align: "right", render: (r) => aed(r.paid) },
            { key: "due", header: "Due", align: "right", render: (r) => <b className={r.balance > 0 ? "text-amber-700 dark:text-amber-300" : "text-emerald-600"}>{aed(r.balance)}</b> },
            {
              key: "act",
              header: "",
              render: (r) =>
                r.balance > 0 ? (
                  <form action={createReceiptAction} className="flex items-center gap-1">
                    <input type="hidden" name="invoiceId" value={r.id} />
                    <input name="amount" inputMode="decimal" required placeholder="Amount" className={`${input} w-24`} />
                    <input name="method" placeholder="Method" className={`${input} w-28`} />
                    <button className="constra-btn-ghost whitespace-nowrap">Record payment</button>
                  </form>
                ) : (
                  <span className="text-xs text-emerald-600">✓ paid</span>
                ),
            },
          ]}
          rows={invoices}
          empty="No invoices yet — create one above."
        />
      </Card>

      <Card
        title={`Trial balance — Dr ${aed(tDr)} = Cr ${aed(tCr)}`}
        subtitle="One row per ledger account"
      >
        <DataTable
          columns={[
            { key: "code", header: "Code", render: (r: (typeof trial)[number]) => <b>{r.code}</b> },
            { key: "name", header: "Account", render: (r) => r.name },
            { key: "dr", header: "Debit", align: "right", render: (r) => (r.debit ? aed(r.debit) : "—") },
            { key: "cr", header: "Credit", align: "right", render: (r) => (r.credit ? aed(r.credit) : "—") },
          ]}
          rows={trial}
          empty="No postings yet."
        />
      </Card>

      <Card title="Recent journal entries" subtitle="Balanced lines with source references">
        <DataTable
          columns={[
            {
              key: "ref",
              header: "Ref / date",
              render: (r: (typeof entries)[number]) => (
                <span>
                  <b>{r.ref ?? "—"}</b>
                  <span className="block text-xs text-slate-500">{r.date}{r.memo ? ` · ${r.memo}` : ""}</span>
                </span>
              ),
            },
            {
              key: "lines",
              header: "Lines",
              render: (r) => (
                <span className="flex flex-col gap-0.5">
                  {r.lines.map((l, j) => (
                    <span key={j} className="flex justify-between gap-4 text-xs">
                      <span>{l.accountCode} · {l.accountName}</span>
                      <b>{l.debit > 0 ? `Dr ${aed(l.debit)}` : `Cr ${aed(l.credit)}`}</b>
                    </span>
                  ))}
                </span>
              ),
            },
          ]}
          rows={entries}
          empty="No journal entries yet."
        />
      </Card>
    </main>
  );
}
