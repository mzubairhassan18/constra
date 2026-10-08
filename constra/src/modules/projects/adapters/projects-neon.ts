import sql from "@/lib/db";
import { fmtDate } from "@/lib/format";
import type {
  Project,
  Stage,
  Task,
  StageStatus,
  TaskStatus,
} from "../domain/types";

export async function listProjects(): Promise<Project[]> {
  const rows = await sql`
    SELECT id, name, client_name, location, agreement_amount, status
    FROM projects ORDER BY created_at DESC`;
  return rows.map((r) => ({
    id: r.id as string,
    name: r.name as string,
    clientName: r.client_name as string | null,
    location: r.location as string | null,
    agreementAmount: r.agreement_amount as string | null,
    status: r.status as Project["status"],
  }));
}

export async function createProject(input: {
  name: string;
  clientName?: string;
  location?: string;
  agreementAmount?: string;
  stages: string[];
}): Promise<string> {
  const rows = await sql`
    INSERT INTO projects (name, client_name, location, agreement_amount)
    VALUES (${input.name}, ${input.clientName || null},
            ${input.location || null}, ${input.agreementAmount || null})
    RETURNING id`;
  const projectId = rows[0].id as string;
  for (let i = 0; i < input.stages.length; i++) {
    await sql`
      INSERT INTO stages (project_id, name, position, status)
      VALUES (${projectId}, ${input.stages[i]}, ${i},
              ${i === 0 ? "in_progress" : "pending"})`;
  }
  if (input.stages.length > 0) {
    await sql`
      UPDATE stages SET actual_start = CURRENT_DATE
      WHERE project_id = ${projectId} AND position = 0`;
  }
  return projectId;
}

export async function getProjectDetail(projectId: string): Promise<{
  project: Project & { stages: (Stage & { tasks: Task[] })[] };
} | null> {
  const p = await sql`SELECT * FROM projects WHERE id = ${projectId}`;
  if (p.length === 0) return null;
  const stages = await sql`
    SELECT * FROM stages WHERE project_id = ${projectId} ORDER BY position`;
  const tasks = await sql`
    SELECT t.* FROM tasks t
    JOIN stages s ON s.id = t.stage_id
    WHERE s.project_id = ${projectId} ORDER BY t.position, t.created_at`;
  const byStage = new Map<string, Task[]>();
  for (const t of tasks) {
    const sid = t.stage_id as string;
    if (!byStage.has(sid)) byStage.set(sid, []);
    byStage.get(sid)!.push({
      id: t.id as string,
      stageId: sid,
      title: t.title as string,
      status: t.status as Task["status"],
      priority: t.priority as string,
      dueDate: t.due_date ? fmtDate(t.due_date) : null,
      delayReason: t.delay_reason as string | null,
    });
  }
  const row = p[0];
  return {
    project: {
      id: row.id as string,
      name: row.name as string,
      clientName: row.client_name as string | null,
      location: row.location as string | null,
      agreementAmount: row.agreement_amount as string | null,
      status: row.status as Project["status"],
      stages: stages.map((s) => ({
        id: s.id as string,
        projectId: projectId,
        name: s.name as string,
        position: s.position as number,
        status: s.status as StageStatus,
        budget: s.budget as string | null,
        boq: s.boq as string | null,
        tasks: byStage.get(s.id as string) ?? [],
      })),
    },
  };
}

export async function addStage(projectId: string, name: string): Promise<void> {
  const cur = await sql`
    SELECT COALESCE(MAX(position), -1)::int AS m FROM stages WHERE project_id = ${projectId}`;
  await sql`
    INSERT INTO stages (project_id, name, position)
    VALUES (${projectId}, ${name}, ${(cur[0].m as number) + 1})`;
}

/** Complete a stage and auto-open the next pending one — single atomic statement. */
export async function completeStage(stageId: string): Promise<void> {
  await sql`
    WITH done AS (
      UPDATE stages SET status = 'completed', actual_end = CURRENT_DATE
      WHERE id = ${stageId} AND status <> 'completed'
      RETURNING project_id, position
    ),
    nxt AS (
      SELECT id FROM stages, done
      WHERE stages.project_id = done.project_id
        AND stages.position > done.position
        AND stages.status = 'pending'
      ORDER BY stages.position LIMIT 1
    )
    UPDATE stages SET status = 'in_progress', actual_start = CURRENT_DATE
    WHERE id IN (SELECT id FROM nxt)`;
}

export async function addTask(
  stageId: string,
  title: string,
  dueDate?: string,
): Promise<void> {
  await sql`
    INSERT INTO tasks (stage_id, title, due_date)
    VALUES (${stageId}, ${title}, ${dueDate || null})`;
}

export async function setTask(
  taskId: string,
  status: TaskStatus,
  delayReason?: string,
): Promise<void> {
  await sql`
    UPDATE tasks SET status = ${status},
      delay_reason = ${status === "blocked" ? delayReason || null : null}
    WHERE id = ${taskId}`;
}

export async function stageInfo(
  stageId: string,
): Promise<{ name: string; projectId: string } | null> {
  const rows = await sql`SELECT name, project_id FROM stages WHERE id = ${stageId}`;
  if (rows.length === 0) return null;
  return { name: rows[0].name as string, projectId: rows[0].project_id as string };
}
