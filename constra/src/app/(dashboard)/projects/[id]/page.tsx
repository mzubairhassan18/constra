import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { getProjectDetail } from "@/modules/projects/adapters/projects-neon";
import {
  addStageAction,
  completeStageAction,
  addTaskAction,
  setTaskAction,
} from "../actions";
import { createPortalTokenAction } from "../portal-actions";
import { listPortalTokens } from "@/modules/portal/adapters/portal-neon";

export const instant = false;

const input =
  "rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900";
const btn =
  "rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await getSessionUser())) redirect("/login");
  const { id } = await params;
  const detail = await getProjectDetail(id);
  if (!detail) notFound();
  const { project } = detail;
  const tokens = await listPortalTokens(project.id);

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <p className="text-sm text-zinc-500">
            {[project.clientName, project.location].filter(Boolean).join(" · ")} · {project.status}
          </p>
        </div>
        <Link href="/projects" className="text-sm underline">All projects</Link>
      </header>

      {project.stages.map((s) => (
        <section key={s.id} className="rounded border border-zinc-200 p-4 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">
              {s.position + 1}. {s.name} · {s.status.replace("_", " ")}
            </h2>
            {s.status === "in_progress" && (
              <form action={completeStageAction}>
                <input type="hidden" name="stageId" value={s.id} />
                <input type="hidden" name="projectId" value={project.id} />
                <button className={btn}>Mark complete</button>
              </form>
            )}
          </div>

          <ul className="mt-3 flex flex-col gap-2">
            {s.tasks.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium">{t.title}</span>
                <span className="text-zinc-500">{t.status}</span>
                {t.dueDate && <span className="text-zinc-500">due {t.dueDate}</span>}
                {t.status === "blocked" && t.delayReason && (
                  <span className="text-red-600">— {t.delayReason}</span>
                )}
                <form action={setTaskAction} className="flex items-center gap-1">
                  <input type="hidden" name="taskId" value={t.id} />
                  <select name="status" defaultValue={t.status} className={input}>
                    <option value="todo">todo</option>
                    <option value="in_progress">in progress</option>
                    <option value="blocked">blocked</option>
                    <option value="done">done</option>
                  </select>
                  <input name="delayReason" placeholder="Delay reason (if blocked)" className={input} />
                  <button className={btn}>Set</button>
                </form>
              </li>
            ))}
          </ul>

          <form action={addTaskAction} className="mt-3 flex flex-wrap gap-2">
            <input type="hidden" name="stageId" value={s.id} />
            <input name="title" required maxLength={300} placeholder="New task" className={input} />
            <input name="dueDate" type="date" className={input} />
            <button className={btn}>Add task</button>
          </form>
        </section>
      ))}

      <form action={addStageAction} className="flex gap-2">
        <input type="hidden" name="projectId" value={project.id} />
        <input name="name" required maxLength={200} placeholder="New stage name" className={input} />
        <button className={btn}>Add stage</button>
      </form>

      <section className="rounded border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="font-semibold">Client portal links</h2>
        <form action={createPortalTokenAction} className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <input type="hidden" name="projectId" value={project.id} />
          <label><input type="checkbox" name="showCosts" /> costs</label>
          <label><input type="checkbox" name="showPhotos" defaultChecked /> photos</label>
          <label><input type="checkbox" name="showDelays" defaultChecked /> delays</label>
          <button className={btn}>Create link</button>
        </form>
        <ul className="mt-2 text-sm">
          {tokens.map((t) => (
            <li key={t.token}>
              <a href={`/portal/${t.token}`} target="_blank" className="underline">
                /portal/{t.token.slice(0, 12)}…
              </a>
              <span className="text-zinc-500">
                {t.showCosts ? " costs" : ""}{t.showPhotos ? " photos" : ""}{t.showDelays ? " delays" : ""}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
