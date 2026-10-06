// Pure domain types — no framework imports.
export type ProjectStatus = "active" | "on_hold" | "completed" | "cancelled";
export type StageStatus = "pending" | "in_progress" | "completed";
export type TaskStatus = "todo" | "in_progress" | "blocked" | "done";

export interface Project {
  id: string;
  name: string;
  clientName: string | null;
  location: string | null;
  agreementAmount: string | null;
  status: ProjectStatus;
}

export interface Stage {
  id: string;
  projectId: string;
  name: string;
  position: number;
  status: StageStatus;
  budget: string | null;
  boq: string | null;
}

export interface Task {
  id: string;
  stageId: string;
  title: string;
  status: TaskStatus;
  priority: string;
  dueDate: string | null;
  delayReason: string | null;
}
