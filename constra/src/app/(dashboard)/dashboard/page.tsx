import Link from "next/link";
import { requireAccess } from "@/lib/access";
import { logoutAction } from "@/app/(auth)/login/actions";
import { unreadCount } from "@/modules/notify/adapters/notify-neon";
import { trialBalance, vatPosition } from "@/modules/finance/adapters/ledger-neon";
import { listInvoices } from "@/modules/finance/adapters/bills-neon";
import sql from "@/lib/db";
import { Card, KpiCard, StatusChip } from "@/ui/cards";
import { BarChart, DonutChart } from "@/ui/charts";
import { DataTable } from "@/ui/data-table";

const aed = (n: number) =>
  `AED ${n.toLocaleString("en-AE", { maximumFractionDigits: 0 })}`;

export default async function DashboardPage() {
  const user = await requireAccess();

  const [projects, employees, stages, unread, trial, vat, invoices, recentBills] =
    await Promise.all([
      sql`SELECT count(*)::int AS n FROM projects`,
      sql`SELECT count(*)::int AS n FROM employees`,
      sql`SELECT status, count(*)::int AS n FROM stages GROUP BY status`,
      unreadCount(user.id),
      trialBalance(),
      vatPosition(),
      listInvoices(),
      sql`SELECT b.id, b.invoice_no, b.gross AS total, b.created_at, s.name AS supplier
          FROM bills b LEFT JOIN suppliers s ON s.id = b.supplier_id
          ORDER BY b.created_at DESC LIMIT 6`,
    ]);

  const stageRows = stages as { status: string; n: number }[];
  const inProgress = stageRows.find((s) => s.status === "in_progress")?.n ?? 0;
  const receivable = invoices.reduce((n, i) => n + i.balance, 0);
  const tDr = trial.reduce((n, t) => n + t.debit, 0);
  const balanced = Math.abs(tDr - trial.reduce((n, t) => n + t.credit, 0)) < 0.01;

  const stageChart = stageRows.map((s, i) => ({
    label: s.status.replace("_", " "),
    value: s.n,
    color: ["#1e4278", "#f59e0b", "#10b981", "#8b5cf6"][i % 4],
  }));

  const vatChart = [
    { label: "VAT out", value: Math.max(0, vat.vatOut), color: "#1e4278" },
    { label: "VAT in", value: Math.max(0, vat.vatIn), color: "#f59e0b" },
  ];

  const projectRows = (await sql`
    SELECT p.id, p.name, p.status, p.agreement_amount,
      (SELECT count(*)::int FROM stages s WHERE s.project_id = p.id AND s.status = 'completed') AS done,
      (SELECT count(*)::int FROM stages s WHERE s.project_id = p.id) AS total
    FROM projects p ORDER BY p.created_at DESC LIMIT 5
  `) as {
    id: string;
    name: string;
    status: string;
    agreement_amount: number | null;
    done: number;
    total: number;
  }[];

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-4 md:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Good day, {user.displayName} 👋
          </h1>
          <p className="text-sm text-slate-500">
            {user.role} ·{" "}
            <Link href="/notifications" className="font-semibold text-amber-600 hover:underline">
              {unread > 0 ? `${unread} unread notifications` : "All caught up"}
            </Link>
            {" · "}
            <span className={balanced ? "text-emerald-600" : "text-red-600"}>
              {balanced ? "● Ledger balanced" : "● Ledger OUT OF BALANCE"}
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/projects" className="constra-btn-primary">
            + New project
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="constra-btn-ghost">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Key metrics">
        <KpiCard label="Projects" value={String(projects[0].n)} hint="across all statuses" />
        <KpiCard label="Employees" value={String(employees[0].n)} hint="permanent + daily wage" />
        <KpiCard label="Stages in progress" value={String(inProgress)} hint={`${stageRows.reduce((n, s) => n + s.n, 0)} total stages`} />
        <KpiCard label="Receivable due" value={aed(receivable)} hint={`${invoices.length} open invoices`} delta={receivable > 0 ? "collect" : undefined} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card
          title="Stages by status"
          subtitle="Where site effort sits right now"
          action={<Link href="/projects" className="text-sm font-semibold text-amber-600 hover:underline">Projects →</Link>}
        >
          {stageChart.length > 0 ? (
            <BarChart data={stageChart} format={(v) => String(v)} />
          ) : (
            <p className="text-sm text-slate-500">No stages yet — create a project to begin.</p>
          )}
        </Card>
        <Card
          title="VAT position"
          subtitle={`Net payable ${aed(vat.net)}`}
          action={<Link href="/finance" className="text-sm font-semibold text-amber-600 hover:underline">Finance →</Link>}
        >
          <DonutChart data={vatChart} format={(v) => aed(v)} />
        </Card>
      </section>

      <Card
        title="Latest projects"
        subtitle="Progress = completed stages / total stages"
        action={<Link href="/projects" className="text-sm font-semibold text-amber-600 hover:underline">View all →</Link>}
      >
        <DataTable
          columns={[
            {
              key: "name",
              header: "Project",
              render: (r) => (
                <Link href={`/projects/${r.id}`} className="font-semibold hover:underline">
                  {r.name}
                </Link>
              ),
            },
            {
              key: "progress",
              header: "Progress",
              render: (r) => {
                const pct = r.total ? Math.round((r.done / r.total) * 100) : 0;
                return (
                  <span className="flex min-w-28 items-center gap-2">
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <span className="block h-full rounded-full bg-amber-500" style={{ width: `${pct}%` }} />
                    </span>
                    <span className="text-xs text-slate-500">{pct}%</span>
                  </span>
                );
              },
            },
            {
              key: "status",
              header: "Status",
              render: (r) => <StatusChip status={r.status} />,
            },
            {
              key: "amount",
              header: "Agreement",
              align: "right",
              render: (r) => (r.agreement_amount ? aed(Number(r.agreement_amount)) : "—"),
            },
          ]}
          rows={projectRows}
          empty="No projects yet. Create your first villa project above."
        />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card
          title="Latest supplier bills"
          action={<Link href="/bills" className="text-sm font-semibold text-amber-600 hover:underline">Bills →</Link>}
        >
          <DataTable
            columns={[
              { key: "inv", header: "Invoice", render: (r: (typeof recentBills)[number]) => String(r.invoice_no ?? "—") },
              { key: "sup", header: "Supplier", render: (r) => String(r.supplier ?? "—") },
              { key: "tot", header: "Total", align: "right", render: (r) => aed(Number(r.total ?? 0)) },
            ]}
            rows={recentBills}
            empty="No bills posted yet."
          />
        </Card>
        <Card
          title="Invoices needing collection"
          action={<Link href="/finance" className="text-sm font-semibold text-amber-600 hover:underline">Finance →</Link>}
        >
          <DataTable
            columns={[
              { key: "inv", header: "Invoice", render: (r: (typeof invoices)[number]) => String(r.invoiceNo ?? "—") },
              { key: "due", header: "Due", align: "right", render: (r) => <b>{aed(r.balance)}</b> },
              { key: "st", header: "Status", render: (r) => <StatusChip status={r.balance <= 0 ? "paid" : r.paid > 0 ? "partial" : "issued"} /> },
            ]}
            rows={invoices.filter((i) => i.balance > 0).slice(0, 6)}
            empty="Nothing due — all invoices collected. 🎉"
          />
        </Card>
      </div>

      <Card title="Ask Constra AI" subtitle="Dues, stage costs, survival forecast — with sources and charts">
        <div className="flex flex-wrap gap-2">
          {["What invoices are due?", "Stage costs for latest project?", "Survival forecast?"].map((q) => (
            <Link key={q} href={`/ask?q=${encodeURIComponent(q)}`} className="constra-btn-ghost">
              “{q}”
            </Link>
          ))}
          <Link href="/ask" className="constra-btn-primary">Open AI ask →</Link>
        </div>
      </Card>
    </main>
  );
}
