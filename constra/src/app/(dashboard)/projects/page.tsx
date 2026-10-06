import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { listProjects } from "@/modules/projects/adapters/projects-neon";
import NewProjectForm from "./NewProjectForm";

export const instant = false;

export default async function ProjectsPage() {
  if (!(await getSessionUser())) redirect("/login");
  const projects = await listProjects();
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Link href="/dashboard" className="text-sm underline">Dashboard</Link>
      </header>
      <NewProjectForm />
      <ul className="flex flex-col gap-2">
        {projects.map((p) => (
          <li key={p.id} className="rounded border border-zinc-200 p-3 dark:border-zinc-800">
            <Link href={`/projects/${p.id}`} className="font-semibold underline">
              {p.name}
            </Link>
            <p className="text-sm text-zinc-500">
              {[p.clientName, p.location].filter(Boolean).join(" · ") || "—"} · {p.status}
              {p.agreementAmount ? ` · AED ${p.agreementAmount}` : ""}
            </p>
          </li>
        ))}
        {projects.length === 0 && <p className="text-sm text-zinc-500">No projects yet.</p>}
      </ul>
    </main>
  );
}
