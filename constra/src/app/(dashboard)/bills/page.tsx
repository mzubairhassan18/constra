import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { listBills } from "@/modules/finance/adapters/bills-neon";
import { listSuppliers } from "@/modules/finance/adapters/ledger-neon";
import { listProjects } from "@/modules/projects/adapters/projects-neon";
import sql from "@/lib/db";
import BillForm from "./BillForm";

export default async function BillsPage() {
  if (!(await getSessionUser())) redirect("/login");
  const [bills, suppliers, projects] = await Promise.all([
    listBills(),
    listSuppliers(),
    listProjects(),
  ]);
  const stages = await sql`SELECT id, project_id, name FROM stages ORDER BY project_id, position`;

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Bills</h1>
        <Link href="/dashboard" className="text-sm underline">Dashboard</Link>
      </header>
      <BillForm
        suppliers={suppliers}
        projects={projects.map((p) => ({ id: p.id, name: p.name }))}
        stages={stages.map((s) => ({
          id: s.id as string,
          projectId: s.project_id as string,
          name: s.name as string,
        }))}
      />
      <section>
        <h2 className="font-semibold">Recent bills</h2>
        <ul className="mt-2 flex flex-col gap-2">
          {bills.map((b) => (
            <li key={b.id} className="rounded border border-zinc-200 p-3 text-sm dark:border-zinc-800">
              {b.invoiceNo ?? "(no no.)"} · {b.date} · net {b.net} + VAT {b.vatIn} = <b>{b.gross}</b>
            </li>
          ))}
          {bills.length === 0 && <p className="text-sm text-zinc-500">No bills yet.</p>}
        </ul>
      </section>
    </main>
  );
}
