import sql from "@/lib/db";
import { fmtDate } from "@/modules/hr/adapters/employees-neon";

export interface ClientProject {
  id: string;
  name: string;
  location: string | null;
  status: string;
  progressPct: number;
  agreementAmount: number | null;
  nextDue: number;
  lastUpdate: string | null;
  lastUpdateText: string | null;
}

export async function myProjects(userId: string | null): Promise<ClientProject[]> {
  const rows =
    userId === null
      ? await sql`SELECT id, name, location, status, agreement_amount FROM projects WHERE client_user_id IS NOT NULL ORDER BY created_at DESC`
      : await sql`SELECT id, name, location, status, agreement_amount FROM projects WHERE client_user_id = ${userId} ORDER BY created_at DESC`;
  const out: ClientProject[] = [];
  for (const p of rows) {
    const id = p.id as string;
    const stages = await sql`SELECT status FROM stages WHERE project_id = ${id}`;
    const done = stages.filter((s) => s.status === "completed").length;
    const dues = await sql`
      SELECT i.gross, COALESCE(SUM(r.amount), 0) AS paid FROM client_invoices i
      LEFT JOIN client_receipts r ON r.invoice_id = i.id
      WHERE i.project_id = ${id} GROUP BY i.id`;
    const nextDue = dues.reduce(
      (n, d) => n + Math.max(0, Number(d.gross) - Number(d.paid)),
      0,
    );
    const upd = await sql`
      SELECT date, work_done FROM daily_reports WHERE project_id = ${id}
      ORDER BY date DESC LIMIT 1`;
    out.push({
      id,
      name: p.name as string,
      location: (p.location as string | null) ?? null,
      status: p.status as string,
      progressPct: stages.length === 0 ? 0 : Math.round((done / stages.length) * 100),
      agreementAmount: p.agreement_amount != null ? Number(p.agreement_amount) : null,
      nextDue,
      lastUpdate: upd.length > 0 ? fmtDate(upd[0].date) : null,
      lastUpdateText: (upd.length > 0 ? (upd[0].work_done as string | null) : null) ?? null,
    });
  }
  return out;
}

export async function projectDues(projectId: string): Promise<
  { id: string; invoiceNo: string | null; gross: number; paid: number; due: number }[]
> {
  const rows = await sql`
    SELECT i.id, i.invoice_no, i.gross, COALESCE(SUM(r.amount), 0) AS paid
    FROM client_invoices i LEFT JOIN client_receipts r ON r.invoice_id = i.id
    WHERE i.project_id = ${projectId} GROUP BY i.id ORDER BY i.date`;
  return rows.map((r) => ({
    id: r.id as string,
    invoiceNo: (r.invoice_no as string | null) ?? null,
    gross: Number(r.gross),
    paid: Number(r.paid),
    due: Number(r.gross) - Number(r.paid),
  }));
}

export async function projectStages(projectId: string): Promise<
  { name: string; status: string }[]
> {
  const rows = await sql`
    SELECT name, status FROM stages WHERE project_id = ${projectId} ORDER BY position`;
  return rows.map((r) => ({ name: r.name as string, status: r.status as string }));
}

export async function projectUpdates(projectId: string, limit = 5): Promise<
  { date: string; workDone: string; delays: string | null }[]
> {
  const rows = await sql`
    SELECT date, work_done, delays FROM daily_reports WHERE project_id = ${projectId}
    ORDER BY date DESC LIMIT ${limit}`;
  return rows.map((r) => ({
    date: fmtDate(r.date),
    workDone: r.work_done as string,
    delays: (r.delays as string | null) ?? null,
  }));
}

export async function projectPhotos(projectId: string): Promise<string[]> {
  const rows = await sql`
    SELECT unnest(photo_keys) AS key FROM daily_reports
    WHERE project_id = ${projectId} AND photo_keys <> '{}' ORDER BY date DESC LIMIT 12`;
  return rows.map((r) => r.key as string);
}

export async function listMessages(projectId: string): Promise<
  { id: string; author: string; mine: boolean; body: string; at: string; authorId: string }[]
> {
  const rows = await sql`
    SELECT m.id, m.author_id, m.body, m.created_at, u.display_name FROM client_messages m
    JOIN users u ON u.id = m.author_id
    WHERE m.project_id = ${projectId} ORDER BY m.created_at`;
  return rows.map((r) => ({
    id: r.id as string,
    authorId: r.author_id as string,
    author: r.display_name as string,
    mine: false,
    body: r.body as string,
    at: String(r.created_at),
  }));
}

export async function sendMessage(input: {
  projectId: string;
  authorId: string;
  body: string;
}): Promise<string> {
  const rows = await sql`
    INSERT INTO client_messages (project_id, author_id, body)
    VALUES (${input.projectId}, ${input.authorId}, ${input.body})
    RETURNING id`;
  return rows[0].id as string;
}

export async function projectClientUser(projectId: string): Promise<string | null> {
  const rows = await sql`SELECT client_user_id FROM projects WHERE id = ${projectId}`;
  if (rows.length === 0) return null;
  return (rows[0].client_user_id as string | null) ?? null;
}

export async function setProjectClient(projectId: string, userId: string | null): Promise<void> {
  await sql`UPDATE projects SET client_user_id = ${userId} WHERE id = ${projectId}`;
}

export async function listClientUsers(): Promise<{ id: string; username: string; displayName: string }[]> {
  const rows = await sql`
    SELECT u.id, u.username, u.display_name FROM users u JOIN roles r ON r.id = u.role_id
    WHERE r.name = 'client' AND u.is_active ORDER BY u.username`;
  return rows.map((r) => ({
    id: r.id as string,
    username: r.username as string,
    displayName: r.display_name as string,
  }));
}
