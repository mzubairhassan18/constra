import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAccess } from "@/lib/access";
import { getProjectDetail } from "@/modules/projects/adapters/projects-neon";
import {
  addStageAction,
  completeStageAction,
  addTaskAction,
  setTaskAction,
} from "../actions";
import { createPortalTokenAction, setProjectClientAction } from "../portal-actions";
import { listPortalTokens } from "@/modules/portal/adapters/portal-neon";
import { listClientUsers, projectClientUser } from "@/modules/client/adapters/client-neon";
import { Card, KpiCard, StatusChip } from "@/ui/cards";

const input = "constra-input";
const btn = "constra-btn-ghost";
const aed = (n: number) => `AED ${Number(n).toLocaleString("en-AE", { maximumFractionDigits: 0 })}`;

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAccess("projects.read");
  const { id } = await params;
  const detail = await getProjectDetail(id);
  if (!detail) notFound();
  const { project } = detail;
  const [tokens, clientUsers, linkedClient] = await Promise.all([
    listPortalTokens(project.id),
    listClientUsers(),
    projectClientUser(project.id),
  ]);
  const done = project.stages.filter((s) => s.status === "completed").length;
  const pct = project.stages.length === 0 ? 0 : Math.round((done / project.stages.length) * 100);
  const tasks = project.stages.flatMap((s) => s.tasks);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-4 md:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
            <Link href="/projects" className="hover:underline">Projects</Link> / {project.name}
          </p>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
            {project.name} <StatusChip status={project.status} />
          </h1>
          <p className="text-sm text-slate-500">
            {[project.clientName, project.location].filter(Boolean).join(" · ")}
          </p>
        </div>
        <Link href="/projects" className={btn}>All projects</Link>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Project metrics">
        <KpiCard label="Progress" value={`${pct}%`} hint={`${done}/${project.stages.length} stages`} />
        <KpiCard label="Tasks" value={String(tasks.length)} hint={`${tasks.filter((t) => t.status === "done").length} done`} />
        <KpiCard
          label="Agreement"
          value={project.agreementAmount != null ? aed(Number(project.agreementAmount)) : "—"}
          hint="contract value"
        />
        <KpiCard label="Portal links" value={String(tokens.length)} hint="magic links issued" />
      </section>

      <div className="mb-1 h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300" style={{ width: `${pct}%` }} />
      </div>

      {project.stages.map((s) => (
        <Card
          key={s.id}
          title={`${s.position + 1}. ${s.name}`}
          action={
            <span className="flex items-center gap-2">
              <StatusChip status={s.status.replace("_", " ")} />
              {s.status === "in_progress" && (
                <form action={completeStageAction}>
                  <input type="hidden" name="stageId" value={s.id} />
                  <input type="hidden" name="projectId" value={project.id} />
                  <button className="constra-btn-primary">Mark complete → next opens</button>
                </form>
              )}
            </span>
          }
        >
          <ul className="flex flex-col gap-2">
            {s.tasks.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 p-2.5 text-sm dark:bg-slate-800/60">
                <span className="font-medium">{t.title}</span>
                <StatusChip status={t.status} />
                {t.dueDate && <span className="text-xs text-slate-500">due {t.dueDate}</span>}
                {t.status === "blocked" && t.delayReason && (
                  <span className="text-xs text-red-600">— {t.delayReason}</span>
                )}
                <form action={setTaskAction} className="ml-auto flex items-center gap-1">
                  <input type="hidden" name="taskId" value={t.id} />
                  <select name="status" defaultValue={t.status} className={`${input} w-28`} aria-label="Task status">
                    <option value="todo">todo</option>
                    <option value="in_progress">in progress</option>
                    <option value="blocked">blocked</option>
                    <option value="done">done</option>
                  </select>
                  <input name="delayReason" placeholder="Delay reason (if blocked)" className={`${input} w-44`} />
                  <button className={btn}>Set</button>
                </form>
              </li>
            ))}
            {s.tasks.length === 0 && <li className="text-sm text-slate-500">No tasks yet.</li>}
          </ul>
          <form action={addTaskAction} className="mt-3 flex flex-wrap gap-2">
            <input type="hidden" name="stageId" value={s.id} />
            <input name="title" required maxLength={300} placeholder="New task" className={input} />
            <input name="dueDate" type="date" className={input} aria-label="Due date" />
            <button className={btn}>Add task</button>
          </form>
        </Card>
      ))}

      <Card title="Add a stage" subtitle="Stages run in order — completing one auto-opens the next">
        <form action={addStageAction} className="flex flex-wrap gap-2">
          <input type="hidden" name="projectId" value={project.id} />
          <input name="name" required maxLength={200} placeholder="New stage name" className={input} />
          <button className="constra-btn-primary">Add stage</button>
        </form>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Client workspace login" subtitle="/client shows progress, dues, updates, messaging">
          <form action={setProjectClientAction} className="flex flex-wrap items-center gap-2 text-sm">
            <input type="hidden" name="projectId" value={project.id} />
            <select name="clientUserId" defaultValue={linkedClient ?? ""} className={input} aria-label="Client login">
              <option value="">No client login…</option>
              {clientUsers.map((u) => (
                <option key={u.id} value={u.id}>{u.displayName} ({u.username})</option>
              ))}
            </select>
            <button className="constra-btn-primary">Link</button>
            {linkedClient && <Link href="/client" className="text-sm font-semibold text-amber-600 hover:underline">Preview workspace →</Link>}
          </form>
        </Card>

        <Card title="Magic-link portal" subtitle="Read-only public view — no login needed">
          <form action={createPortalTokenAction} className="flex flex-wrap items-center gap-2 text-sm">
            <input type="hidden" name="projectId" value={project.id} />
            <label className="flex items-center gap-1"><input type="checkbox" name="showCosts" /> costs</label>
            <label className="flex items-center gap-1"><input type="checkbox" name="showPhotos" defaultChecked /> photos</label>
            <label className="flex items-center gap-1"><input type="checkbox" name="showDelays" defaultChecked /> delays</label>
            <button className={btn}>Create link</button>
          </form>
          <ul className="mt-2 flex flex-col gap-1 text-sm">
            {tokens.map((t) => (
              <li key={t.token}>
                <a href={`/portal/${t.token}`} target="_blank" className="font-semibold text-amber-600 hover:underline">
                  /portal/{t.token.slice(0, 12)}…
                </a>
                <span className="text-xs text-slate-500">
                  {t.showCosts ? " costs" : ""}{t.showPhotos ? " photos" : ""}{t.showDelays ? " delays" : ""}
                </span>
              </li>
            ))}
            {tokens.length === 0 && <li className="text-slate-500">No links yet.</li>}
          </ul>
        </Card>
      </div>
    </main>
  );
}
