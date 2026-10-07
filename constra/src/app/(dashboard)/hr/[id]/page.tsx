import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAccess } from "@/lib/access";
import { getEmployee } from "@/modules/hr/adapters/employees-neon";
import { Card, KpiCard, StatusChip } from "@/ui/cards";
import { DataTable } from "@/ui/data-table";

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAccess("hr.read");
  const { id } = await params;
  const emp = await getEmployee(id);
  if (!emp) notFound();
  const rate =
    emp.kind === "permanent"
      ? emp.monthlySalary != null ? `AED ${emp.monthlySalary}/mo → ${(emp.monthlySalary / 26 / 8).toFixed(2)}/hr` : "—"
      : emp.hourlyRate != null ? `${emp.hourlyRate}/hr` : emp.dayRate != null ? `${emp.dayRate}/day` : "—";
  const open = emp.assignments.filter((a) => !a.toDate);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-5 p-4 md:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
            <Link href="/hr" className="hover:underline">HR</Link> / {emp.name}
          </p>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
            {emp.name} <StatusChip status={emp.kind.replace("_", " ")} />
          </h1>
          <p className="text-sm text-slate-500">{rate}{emp.designation ? ` · ${emp.designation}` : ""}</p>
        </div>
        <Link href="/hr" className="constra-btn-ghost">All staff</Link>
      </header>

      <section className="grid grid-cols-2 gap-3" aria-label="Employee metrics">
        <KpiCard label="Assignments" value={String(emp.assignments.length)} hint={`${open.length} open`} />
        <KpiCard label="Rate" value={rate.split(" ")[0]} hint={emp.kind === "permanent" ? "monthly → hourly /26/8" : "wager rate"} />
      </section>

      <Card title="Assignment history" subtitle="Closing a posting keeps history — costs stay split correctly">
        <DataTable
          columns={[
            {
              key: "site",
              header: "Site",
              render: (a: (typeof emp.assignments)[number]) => (
                <span><b>{a.projectName}</b>{a.stageName ? ` → ${a.stageName}` : ""}</span>
              ),
            },
            { key: "from", header: "From", render: (a) => a.fromDate },
            { key: "to", header: "To", render: (a) => a.toDate ?? <StatusChip status="open" /> },
          ]}
          rows={emp.assignments}
          empty="Never assigned."
        />
      </Card>
    </main>
  );
}
