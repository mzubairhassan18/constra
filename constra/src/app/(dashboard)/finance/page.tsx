import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import {
  recentEntries,
  trialBalance,
  vatPosition,
} from "@/modules/finance/adapters/ledger-neon";
import { listInvoices } from "@/modules/finance/adapters/bills-neon";
import { listProjects } from "@/modules/projects/adapters/projects-neon";
import { createInvoiceAction, createReceiptAction } from "./actions";
import InvoiceForm from "./InvoiceForm";

export const instant = false;

const input =
  "rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900";
const btn = "rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700";

export default async function FinancePage() {
  if (!(await getSessionUser())) redirect("/login");
  const [entries, trial, vat, invoices, projects] = await Promise.all([
    recentEntries(20),
    trialBalance(),
    vatPosition(),
    listInvoices(),
    listProjects(),
  ]);
  const tDr = trial.reduce((n, t) => n + t.debit, 0);
  const tCr = trial.reduce((n, t) => n + t.credit, 0);

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Finance</h1>
        <Link href="/dashboard" className="text-sm underline">Dashboard</Link>
      </header>

      <section className="grid grid-cols-3 gap-4">
        <div className="rounded border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-2xl font-bold">{vat.vatOut.toFixed(2)}</p>
          <p className="text-sm text-zinc-500">VAT out</p>
        </div>
        <div className="rounded border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-2xl font-bold">{vat.vatIn.toFixed(2)}</p>
          <p className="text-sm text-zinc-500">VAT in</p>
        </div>
        <div className="rounded border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-2xl font-bold">{vat.net.toFixed(2)}</p>
          <p className="text-sm text-zinc-500">Net VAT payable</p>
        </div>
      </section>

      <InvoiceForm projects={projects.map((p) => ({ id: p.id, name: p.name }))} />

      <section>
        <h2 className="font-semibold">Client invoices (receivable)</h2>
        <ul className="mt-2 flex flex-col gap-2">
          {invoices.map((i) => (
            <li key={i.id} className="flex flex-wrap items-center gap-2 rounded border border-zinc-200 p-3 text-sm dark:border-zinc-800">
              <span>{i.invoiceNo ?? "(no no.)"} · billed <b>{i.gross}</b> · paid {i.paid} · <b>due {i.balance}</b></span>
              {i.balance > 0 && (
                <form action={createReceiptAction} className="flex items-center gap-1">
                  <input type="hidden" name="invoiceId" value={i.id} />
                  <input name="amount" inputMode="decimal" required placeholder="Amount" className={`${input} w-24`} />
                  <input name="method" placeholder="Method" className={`${input} w-28`} />
                  <button className={btn}>Record payment</button>
                </form>
              )}
            </li>
          ))}
          {invoices.length === 0 && <p className="text-sm text-zinc-500">No invoices yet.</p>}
        </ul>
      </section>

      <section>
        <h2 className="font-semibold">Trial balance (Dr {tDr.toFixed(2)} = Cr {tCr.toFixed(2)})</h2>
        <ul className="mt-2 flex flex-col gap-1 text-sm">
          {trial.map((t) => (
            <li key={t.code} className="flex justify-between rounded border border-zinc-200 px-3 py-1 dark:border-zinc-800">
              <span>{t.code} · {t.name}</span>
              <span>Dr {t.debit.toFixed(2)} / Cr {t.credit.toFixed(2)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-semibold">Recent journal entries</h2>
        <ul className="mt-2 flex flex-col gap-2 text-sm">
          {entries.map((e) => (
            <li key={e.id} className="rounded border border-zinc-200 p-3 dark:border-zinc-800">
              <p className="text-zinc-500">{e.date} · {e.ref ?? "—"}{e.memo ? ` · ${e.memo}` : ""}</p>
              {e.lines.map((l, j) => (
                <p key={j} className="flex justify-between">
                  <span>{l.accountCode} · {l.accountName}</span>
                  <span>{l.debit > 0 ? `Dr ${l.debit}` : `Cr ${l.credit}`}</span>
                </p>
              ))}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
