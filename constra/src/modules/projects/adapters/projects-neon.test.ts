import { afterAll, describe, expect, it } from "vitest";
import sql from "@/lib/db";
import {
  addStage,
  addTask,
  completeStage,
  createProject,
  getProjectDetail,
  setTask,
} from "./projects-neon";

const created: string[] = [];
afterAll(async () => {
  for (const id of created) {
    await sql`DELETE FROM projects WHERE id = ${id}`;
  }
});

describe("projects adapter (neon)", () => {
  it("creates a project with ordered stages, first one in progress", async () => {
    const id = await createProject({
      name: "__test villa",
      stages: ["Foundation", "Structure"],
    });
    created.push(id);
    const detail = await getProjectDetail(id);
    expect(detail?.project.stages.map((s) => s.status)).toEqual([
      "in_progress",
      "pending",
    ]);
  });

  it("completes a stage and auto-opens the next one", async () => {
    const id = await createProject({
      name: "__test villa 2",
      stages: ["A", "B"],
    });
    created.push(id);
    const before = await getProjectDetail(id);
    const first = before!.project.stages[0].id;
    await completeStage(first);
    const after = await getProjectDetail(id);
    expect(after!.project.stages.map((s) => s.status)).toEqual([
      "completed",
      "in_progress",
    ]);
  });

  it("adds stages and tasks, blocks with delay reason", async () => {
    const id = await createProject({ name: "__test villa 3", stages: [] });
    created.push(id);
    await addStage(id, "Finishing");
    const d1 = await getProjectDetail(id);
    const stageId = d1!.project.stages[0].id;
    await addTask(stageId, "Paint walls", "2026-11-01");
    const d2 = await getProjectDetail(id);
    const taskId = d2!.project.stages[0].tasks[0].id;
    await setTask(taskId, "blocked", "Material delayed");
    const d3 = await getProjectDetail(id);
    const task = d3!.project.stages[0].tasks[0];
    expect(task.status).toBe("blocked");
    expect(task.delayReason).toBe("Material delayed");
  });
});
