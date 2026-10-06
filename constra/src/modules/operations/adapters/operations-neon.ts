import sql from "@/lib/db";
import type { ManpowerInput, OpsAccounts, OpsStore } from "../use-cases/operations";

export const neonOpsStore: OpsStore = {
  async saveEntry(e) {
    const rows = await sql`
      INSERT INTO manpower_entries (date, name, phone, skill, project_id, stage_id, rate, hours, paid, balance)
      VALUES (COALESCE(${e.date ?? null}::date, CURRENT_DATE), ${e.name}, ${e.phone ?? null},
              ${e.skill ?? null}, ${e.projectId ?? null}, ${e.stageId ?? null},
              ${e.rate}, ${e.hours}, ${e.paid}, ${e.balance})
      RETURNING id`;
    return rows[0].id as string;
  },
  async linkEntryTransaction(entryId, txnId) {
    await sql`UPDATE manpower_entries SET transaction_id = ${txnId} WHERE id = ${entryId}`;
  },
  async getEntry(entryId) {
    const rows = await sql`SELECT balance FROM manpower_entries WHERE id = ${entryId}`;
    if (rows.length === 0) return null;
    return { balance: Number(rows[0].balance) };
  },
  async addPayment(entryId, amount) {
    await sql`
      UPDATE manpower_entries
      SET paid = paid + ${amount}, balance = GREATEST(balance - ${amount}, 0)
      WHERE id = ${entryId}`;
  },
  async saveMaterialRequest(r) {
    const h = await sql`
      INSERT INTO material_requests (project_id, stage_id, requested_by, notes)
      VALUES (${r.projectId ?? null}, ${r.stageId ?? null}, ${r.requestedBy ?? null}, ${r.notes ?? null})
      RETURNING id`;
    const id = h[0].id as string;
    for (const l of r.lines) {
      await sql`
        INSERT INTO material_request_lines (request_id, material_name, qty)
        VALUES (${id}, ${l.materialName}, ${l.qty})`;
    }
    return id;
  },
  async setRequestStatus(id, status) {
    await sql`UPDATE material_requests SET status = ${status} WHERE id = ${id}`;
  },
  async saveDailyReport(r) {
    const rows = await sql`
      INSERT INTO daily_reports (project_id, stage_id, date, work_done, delays, next_day_plan, reported_by, photo_keys)
      VALUES (${r.projectId}, ${r.stageId ?? null}, COALESCE(${r.date ?? null}::date, CURRENT_DATE),
              ${r.workDone}, ${r.delays ?? null}, ${r.nextDayPlan ?? null}, ${r.reportedBy ?? null},
              ${r.photoKeys ?? []})
      ON CONFLICT (project_id, stage_id, date)
      DO UPDATE SET work_done = EXCLUDED.work_done, delays = EXCLUDED.delays,
                    next_day_plan = EXCLUDED.next_day_plan,
                    photo_keys = EXCLUDED.photo_keys
      RETURNING id`;
    return rows[0].id as string;
  },
};

export const neonOpsAccounts: OpsAccounts = {
  async stageExpense(stageId: string) {
    const code = `EXP-${stageId.slice(0, 8)}`;
    const rows = await sql`
      INSERT INTO accounts (code, name, type, category, stage_id)
      VALUES (${code}, ${`Stage expense ${code}`}, 'expense', 'Direct costs', ${stageId})
      ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
      RETURNING id`;
    return rows[0].id as string;
  },
  async control(code: string) {
    const rows = await sql`SELECT id FROM accounts WHERE code = ${code}`;
    if (rows.length === 0) throw new Error(`missing control account ${code}`);
    return rows[0].id as string;
  },
  async ensureControl(code, name, type, category) {
    const rows = await sql`
      INSERT INTO accounts (code, name, type, category)
      VALUES (${code}, ${name}, ${type}, ${category})
      ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
      RETURNING id`;
    return rows[0].id as string;
  },
};

export async function listManpower(limit = 50): Promise<
  { id: string; date: string; name: string; skill: string | null; rate: number; hours: number; paid: number; balance: number }[]
> {
  const rows = await sql`
    SELECT id, date, name, skill, rate, hours, paid, balance
    FROM manpower_entries ORDER BY date DESC, created_at DESC LIMIT ${limit}`;
  return rows.map((r) => ({
    id: r.id as string,
    date: String(r.date).slice(0, 10),
    name: r.name as string,
    skill: r.skill as string | null,
    rate: Number(r.rate),
    hours: Number(r.hours),
    paid: Number(r.paid),
    balance: Number(r.balance),
  }));
}

export async function listMaterialRequests(): Promise<
  { id: string; date: string; projectName: string | null; status: string; lines: { materialName: string; qty: number }[] }[]
> {
  const rows = await sql`
    SELECT r.id, r.date, r.status, p.name AS project_name, l.material_name, l.qty
    FROM material_requests r
    LEFT JOIN projects p ON p.id = r.project_id
    LEFT JOIN material_request_lines l ON l.request_id = r.id
    ORDER BY r.created_at DESC LIMIT 200`;
  const map = new Map<string, { id: string; date: string; projectName: string | null; status: string; lines: { materialName: string; qty: number }[] }>();
  for (const r of rows) {
    const id = r.id as string;
    if (!map.has(id)) {
      map.set(id, {
        id,
        date: String(r.date).slice(0, 10),
        projectName: r.project_name as string | null,
        status: r.status as string,
        lines: [],
      });
    }
    if (r.material_name) {
      map.get(id)!.lines.push({ materialName: r.material_name as string, qty: Number(r.qty) });
    }
  }
  return [...map.values()];
}

export async function listDailyReports(limit = 30): Promise<
  { id: string; date: string; projectName: string; workDone: string; delays: string | null; photoKeys: string[] }[]
> {
  const rows = await sql`
    SELECT d.id, d.date, p.name AS project_name, d.work_done, d.delays, d.photo_keys
    FROM daily_reports d JOIN projects p ON p.id = d.project_id
    ORDER BY d.date DESC LIMIT ${limit}`;
  return rows.map((r) => ({
    id: r.id as string,
    date: String(r.date).slice(0, 10),
    projectName: r.project_name as string,
    workDone: r.work_done as string,
    delays: r.delays as string | null,
    photoKeys: (r.photo_keys as string[] | null) ?? [],
  }));
}

export type { ManpowerInput };
