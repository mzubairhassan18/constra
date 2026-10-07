import Link from "next/link";
import { requireAccess } from "@/lib/access";
import { listProjects } from "@/modules/projects/adapters/projects-neon";
import NewProjectForm from "./NewProjectForm";
import { Card, StatusChip } from "@/ui/cards";
import { DataTable } from "@/ui/data-table";

export default async function ProjectsPage() {
  await requireAccess("projects.read");
  const projects = await listProjects();
  const aed = (n: number) =>
    `AED ${n.toLocaleString("en-AE", { maximumFractionDigits: 0 })}`;
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-4 md:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
            <Link href="/dashboard" className="hover:underline">Dashboard</Link> / Projects
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Projects ({projects.length})
          </h1>
        </div>
        <NewProjectForm />
      </header>
      <Card title="All projects" subtitle="Click a project for stages, bills and portal links">
        <DataTable
          columns={[
            {
              key: "name",
              header: "Project",
              render: (p: (typeof projects)[number]) => (
                <span>
                  <Link href={`/projects/${p.id}`} className="font-semibold hover:underline">
                    {p.name}
                  </Link>
                  <span className="block text-xs text-slate-500">
                    {[p.clientName, p.location].filter(Boolean).join(" · ") || "—"}
                  </span>
                </span>
              ),
            },
            {
              key: "status",
              header: "Status",
              render: (p) => <StatusChip status={p.status} />,
            },
            {
              key: "amount",
              header: "Agreement",
              align: "right",
              render: (p) =>
                p.agreementAmount ? aed(Number(p.agreementAmount)) : "—",
            },
            {
              key: "open",
              header: "",
              render: (p) => (
                <Link href={`/projects/${p.id}`} className="constra-btn-ghost inline-block">
                  Open →
                </Link>
              ),
            },
          ]}
          rows={projects}
          empty="No projects yet — create your first villa project."
        />
      </Card>
    </main>
  );
}
