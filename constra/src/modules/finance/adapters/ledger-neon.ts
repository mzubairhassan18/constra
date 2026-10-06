import sql from "@/lib/db";

export async function listSuppliers(): Promise<
  { id: string; name: string; trnNo: string | null }[]
> {
  const rows = await sql`SELECT id, name, trn_no FROM suppliers ORDER BY name`;
  return rows.map((r) => ({ id: r.id as string, name: r.name as string, trnNo: r.trn_no as string | null }));
}

export async function addSupplier(input: { name: string; phone?: string; trnNo?: string }): Promise<string> {
  const rows = await sql`
    INSERT INTO suppliers (name, phone, trn_no) VALUES (${input.name}, ${input.phone ?? null}, ${input.trnNo ?? null})
    RETURNING id`;
  return rows[0].id as string;
}

export async function listMaterials(): Promise<
  { id: string; name: string; unit: string | null }[]
> {
  const rows = await sql`SELECT id, name, unit FROM materials ORDER BY name`;
  return rows.map((r) => ({ id: r.id as string, name: r.name as string, unit: r.unit as string | null }));
}

export async function addMaterial(input: { name: string; unit?: string }): Promise<string> {
  const rows = await sql`
    INSERT INTO materials (name, unit) VALUES (${input.name}, ${input.unit ?? null})
    RETURNING id`;
  return rows[0].id as string;
}

export interface LedgerEntry {
  id: string;
  date: string;
  ref: string | null;
  memo: string | null;
  lines: { accountCode: string; accountName: string; debit: number; credit: number }[];
}

export async function recentEntries(limit = 50): Promise<LedgerEntry[]> {
  const rows = await sql`
    SELECT t.id, t.date, t.ref, t.memo, a.code, a.name,
           l.debit, l.credit, t.created_at
    FROM transactions t
    JOIN transaction_lines l ON l.transaction_id = t.id
    JOIN accounts a ON a.id = l.account_id
    ORDER BY t.created_at DESC LIMIT ${limit * 4}`;
  const map = new Map<string, LedgerEntry>();
  for (const r of rows.slice(0, limit * 4)) {
    const id = r.id as string;
    if (!map.has(id)) {
      map.set(id, {
        id,
        date: String(r.date).slice(0, 10),
        ref: r.ref as string | null,
        memo: r.memo as string | null,
        lines: [],
      });
    }
    map.get(id)!.lines.push({
      accountCode: r.code as string,
      accountName: r.name as string,
      debit: Number(r.debit),
      credit: Number(r.credit),
    });
    if (map.size >= limit) break;
  }
  return [...map.values()];
}

export async function trialBalance(): Promise<
  { code: string; name: string; debit: number; credit: number }[]
> {
  const rows = await sql`
    SELECT a.code, a.name,
           COALESCE(SUM(l.debit), 0) AS debit, COALESCE(SUM(l.credit), 0) AS credit
    FROM accounts a LEFT JOIN transaction_lines l ON l.account_id = a.id
    GROUP BY a.code, a.name HAVING COALESCE(SUM(l.debit),0) <> 0 OR COALESCE(SUM(l.credit),0) <> 0
    ORDER BY a.code`;
  return rows.map((r) => ({
    code: r.code as string,
    name: r.name as string,
    debit: Number(r.debit),
    credit: Number(r.credit),
  }));
}

export async function vatPosition(from?: string, to?: string): Promise<{
  vatOut: number;
  vatIn: number;
  net: number;
}> {
  const rows = await sql`
    SELECT COALESCE(SUM(i.vat_out), 0) AS out, COALESCE(SUM(b.vat_in), 0) AS inn
    FROM (SELECT 1) x
    LEFT JOIN client_invoices i ON (i.date >= COALESCE(${from ?? null}::date, i.date) AND i.date <= COALESCE(${to ?? null}::date, i.date))
    LEFT JOIN bills b ON (b.date >= COALESCE(${from ?? null}::date, b.date) AND b.date <= COALESCE(${to ?? null}::date, b.date))`;
  const out = Number(rows[0].out);
  const inn = Number(rows[0].inn);
  return { vatOut: out, vatIn: inn, net: Math.round((out - inn) * 100) / 100 };
}
