import { randomBytes } from "node:crypto";
import sql from "@/lib/db";
import { fmtDate } from "@/modules/hr/adapters/employees-neon";
import {
  toPortalProject,
  type FullProject,
  type PortalFlags,
  type PortalProject,
} from "../domain/portal";

export async function createPortalToken(
  projectId: string,
  flags: PortalFlags,
): Promise<string> {
  const token = randomBytes(24).toString("base64url");
  await sql`
    INSERT INTO portal_tokens (token, project_id, show_costs, show_photos, show_delays)
    VALUES (${token}, ${projectId}, ${flags.showCosts}, ${flags.showPhotos}, ${flags.showDelays})`;
  return token;
}

export async function listPortalTokens(projectId: string): Promise<
  { token: string; showCosts: boolean; showPhotos: boolean; showDelays: boolean }[]
> {
  const rows = await sql`
    SELECT token, show_costs, show_photos, show_delays FROM portal_tokens
    WHERE project_id = ${projectId} ORDER BY created_at DESC`;
  return rows.map((r) => ({
    token: r.token as string,
    showCosts: r.show_costs as boolean,
    showPhotos: r.show_photos as boolean,
    showDelays: r.show_delays as boolean,
  }));
}

export async function getPortalProject(token: string): Promise<PortalProject | null> {
  const t = await sql`SELECT * FROM portal_tokens WHERE token = ${token}`;
  if (t.length === 0) return null;
  const projectId = t[0].project_id as string;

  const p = await sql`SELECT * FROM projects WHERE id = ${projectId}`;
  if (p.length === 0) return null;
  const proj = p[0];

  const stages = await sql`
    SELECT id, name, status, planned_start, planned_end FROM stages
    WHERE project_id = ${projectId} ORDER BY position`;
  const done = stages.filter((s) => s.status === "completed").length;

  const invoices = await sql`
    SELECT i.id, i.gross,
      (SELECT COALESCE(SUM(r.amount), 0) FROM client_receipts r WHERE r.invoice_id = i.id) AS paid
    FROM client_invoices i WHERE i.project_id = ${projectId} ORDER BY i.date`;
  const balances = invoices.map((i) => ({
    id: i.id as string,
    amount: Number(i.gross),
    status: Number(i.paid) >= Number(i.gross) ? "paid" : Number(i.paid) > 0 ? "partial" : "unpaid",
    due: Number(i.gross) - Number(i.paid),
    paid: Number(i.paid),
  }));
  const nextDue = balances.filter((b) => b.due > 0).sort((a, b) => b.due - a.due)[0];

  const costs = await sql`
    SELECT COALESCE(SUM(b.gross), 0) AS bills, COALESCE(SUM(m.rate * m.hours), 0) AS manpower
    FROM (SELECT 1) x
    LEFT JOIN bills b ON b.project_id = ${projectId}
    LEFT JOIN manpower_entries m ON m.project_id = ${projectId}`;
  const boq = await sql`
    SELECT COALESCE(SUM(boq), 0) AS boq FROM stages WHERE project_id = ${projectId}`;
  const actual = Number(costs[0].bills) + Number(costs[0].manpower);

  const photos = await sql`
    SELECT unnest(photo_keys) AS key, date FROM daily_reports
    WHERE project_id = ${projectId} AND photo_keys <> '{}' ORDER BY date DESC LIMIT 50`;

  const delays = await sql`
    SELECT t.title, t.delay_reason, s.name AS stage_name FROM tasks t
    JOIN stages s ON s.id = t.stage_id
    WHERE s.project_id = ${projectId} AND t.status = 'blocked'`;

  const receipts = await sql`
    SELECT r.id, r.invoice_id, r.amount FROM client_receipts r
    JOIN client_invoices i ON i.id = r.invoice_id
    WHERE i.project_id = ${projectId}`;

  const full: FullProject = {
    id: projectId,
    name: proj.name as string,
    clientName: proj.client_name as string | null,
    location: proj.location as string | null,
    status: proj.status as string,
    progressPct: stages.length === 0 ? 0 : Math.round((done / stages.length) * 100),
    agreementAmount: proj.agreement_amount != null ? Number(proj.agreement_amount) : null,
    stages: stages.map((s) => ({
      id: s.id as string,
      name: s.name as string,
      status: s.status as string,
      plannedStart: s.planned_start ? fmtDate(s.planned_start) : null,
      plannedEnd: s.planned_end ? fmtDate(s.planned_end) : null,
    })),
    invoices: balances.map((b) => ({ id: b.id, amount: b.amount, status: b.status })),
    receipts: receipts.map((r) => ({
      id: r.id as string,
      invoiceId: r.invoice_id as string,
      amount: Number(r.amount),
    })),
    nextPaymentDue: nextDue ? { amount: nextDue.due, dueDate: "" } : null,
    costs: {
      actual,
      boq: Number(boq[0].boq),
      variance: Math.round((actual - Number(boq[0].boq)) * 100) / 100,
    },
    photos: photos.map((r) => ({
      url: `/api/photos?key=${encodeURIComponent(r.key as string)}&portal=${encodeURIComponent(token)}`,
      caption: "",
      takenAt: fmtDate(r.date),
    })),
    delays: delays.map((d) => ({
      stageId: "",
      reason: `${d.stage_name as string}: ${d.title as string} — ${d.delay_reason as string}`,
      days: 0,
    })),
  };

  return toPortalProject(full, {
    showCosts: t[0].show_costs as boolean,
    showPhotos: t[0].show_photos as boolean,
    showDelays: t[0].show_delays as boolean,
  });
}
