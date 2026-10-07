import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAccess } from "@/lib/access";
import { getEmployee } from "@/modules/hr/adapters/employees-neon";

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
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{emp.name}</h1>
          <p className="text-sm text-zinc-500">{emp.kind.replace("_", " ")} · {rate}</p>
        </div>
        <Link href="/hr" className="text-sm underline">All staff</Link>
      </header>
      <section>
        <h2 className="font-semibold">Assignment history</h2>
        <ul className="mt-2 flex flex-col gap-2">
          {emp.assignments.map((a) => (
            <li key={a.id} className="rounded border border-zinc-200 p-3 text-sm dark:border-zinc-800">
              {a.projectName}{a.stageName ? ` → ${a.stageName}` : ""} · {a.fromDate} → {a.toDate ?? "open"}
            </li>
          ))}
          {emp.assignments.length === 0 && <p className="text-sm text-zinc-500">Never assigned.</p>}
        </ul>
      </section>
    </main>
  );
}
