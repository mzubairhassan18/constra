import { notFound } from "next/navigation";
import { getPortalProject } from "@/modules/portal/adapters/portal-neon";

export const instant = false;

export default async function PortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const project = await getPortalProject(token);
  if (!project) notFound();

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <p className="text-sm text-zinc-500">
          {[project.clientName, project.location].filter(Boolean).join(" · ")}
        </p>
        <p className="mt-1 text-sm">Progress: {project.progressPct}% · Status: {project.status}</p>
      </header>

      <section>
        <h2 className="font-semibold">Stages</h2>
        <ul className="mt-2 flex flex-col gap-2 text-sm">
          {project.stages.map((s) => (
            <li key={s.id} className="rounded border border-zinc-200 p-3 dark:border-zinc-800">
              {s.name} · {s.status.replace("_", " ")}
              {[s.plannedStart, s.plannedEnd].some(Boolean) && (
                <span className="text-zinc-500"> · {s.plannedStart ?? "?"} → {s.plannedEnd ?? "?"}</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      {project.costs && (
        <section className="rounded border border-zinc-200 p-4 text-sm dark:border-zinc-800">
          <h2 className="font-semibold">Costs</h2>
          <p>Actual {project.costs.actual.toFixed(2)} · BOQ {project.costs.boq.toFixed(2)} · Variance {project.costs.variance.toFixed(2)}</p>
        </section>
      )}

      {project.delays && project.delays.length > 0 && (
        <section>
          <h2 className="font-semibold">Delays & dependencies</h2>
          <ul className="mt-2 flex flex-col gap-2 text-sm">
            {project.delays.map((d, i) => (
              <li key={i} className="rounded border border-red-300 p-3 text-red-700">{d.reason}</li>
            ))}
          </ul>
        </section>
      )}

      {project.photos && project.photos.length > 0 && (
        <section>
          <h2 className="font-semibold">Site photos</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {project.photos.map((p, i) => (
              <a key={i} href={p.url} target="_blank" className="text-sm underline">
                Photo {i + 1} ({p.takenAt})
              </a>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-semibold">Billing</h2>
        <ul className="mt-2 flex flex-col gap-2 text-sm">
          {project.invoices.map((i) => (
            <li key={i.id} className="rounded border border-zinc-200 p-3 dark:border-zinc-800">
              Invoice {i.amount} · {i.status}
            </li>
          ))}
        </ul>
        {project.nextPaymentDue && (
          <p className="mt-2 text-sm">Next payment due: <b>{project.nextPaymentDue.amount}</b></p>
        )}
      </section>
    </main>
  );
}
