import sql from "@/lib/db";
import type {
  AccountsPort,
  BillsPort,
} from "../use-cases/record-bill";

export const neonBills: BillsPort = {
  async saveBill(h) {
    const b = await sql`
      INSERT INTO bills (invoice_no, supplier_id, project_id, stage_id, date, net, vat_in, gross)
      VALUES (${h.invoiceNo ?? null}, ${h.supplierId ?? null}, ${h.projectId ?? null},
              ${h.stageId ?? null}, COALESCE(${h.date ?? null}::date, CURRENT_DATE),
              ${h.net}, ${h.vatIn}, ${h.gross})
      RETURNING id`;
    const billId = b[0].id as string;
    for (const l of h.lines) {
      await sql`
        INSERT INTO bill_lines (bill_id, material_id, description, qty, unit_price, discount, tax_code, net, vat)
        VALUES (${billId}, ${l.materialId ?? null}, ${l.description ?? null},
                ${l.qty}, ${l.unitPrice}, ${l.discount ?? 0}, ${l.taxCode}, ${l.net}, ${l.vat})`;
    }
    return billId;
  },
  async linkBillTransaction(billId, txnId) {
    await sql`UPDATE bills SET transaction_id = ${txnId} WHERE id = ${billId}`;
  },
  async saveInvoice(h) {
    const r = await sql`
      INSERT INTO client_invoices (project_id, stage_id, invoice_no, date, net, vat_out, gross)
      VALUES (${h.projectId}, ${h.stageId ?? null}, ${h.invoiceNo ?? null},
              COALESCE(${h.date ?? null}::date, CURRENT_DATE), ${h.net}, ${h.vatOut}, ${h.gross})
      RETURNING id`;
    return r[0].id as string;
  },
  async linkInvoiceTransaction(invoiceId, txnId) {
    await sql`UPDATE client_invoices SET transaction_id = ${txnId} WHERE id = ${invoiceId}`;
  },
  async saveReceipt(input) {
    const r = await sql`
      INSERT INTO client_receipts (invoice_id, date, amount, method)
      VALUES (${input.invoiceId}, COALESCE(${input.date ?? null}::date, CURRENT_DATE),
              ${input.amount}, ${input.method ?? null})
      RETURNING id`;
    return r[0].id as string;
  },
};

export const neonAccounts: AccountsPort = {
  async control(code: string) {
    const rows = await sql`SELECT id FROM accounts WHERE code = ${code}`;
    if (rows.length === 0) throw new Error(`missing control account ${code}`);
    return rows[0].id as string;
  },
  async stageExpense(stageId: string) {
    const code = `EXP-${stageId.slice(0, 8)}`;
    const rows = await sql`
      INSERT INTO accounts (code, name, type, category, stage_id)
      VALUES (${code}, ${`Stage expense ${code}`}, 'expense', 'Direct costs', ${stageId})
      ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
      RETURNING id`;
    return rows[0].id as string;
  },
};

export async function listBills(): Promise<
  { id: string; invoiceNo: string | null; date: string; net: number; vatIn: number; gross: number }[]
> {
  const rows = await sql`
    SELECT id, invoice_no, date, net, vat_in, gross FROM bills ORDER BY created_at DESC LIMIT 100`;
  return rows.map((r) => ({
    id: r.id as string,
    invoiceNo: r.invoice_no as string | null,
    date: String(r.date).slice(0, 10),
    net: Number(r.net),
    vatIn: Number(r.vat_in),
    gross: Number(r.gross),
  }));
}

export async function listInvoices(): Promise<
  { id: string; invoiceNo: string | null; gross: number; paid: number; balance: number }[]
> {
  const rows = await sql`
    SELECT i.id, i.invoice_no, i.gross, COALESCE(SUM(r.amount), 0) AS paid
    FROM client_invoices i LEFT JOIN client_receipts r ON r.invoice_id = i.id
    GROUP BY i.id ORDER BY i.created_at DESC LIMIT 100`;
  return rows.map((r) => ({
    id: r.id as string,
    invoiceNo: r.invoice_no as string | null,
    gross: Number(r.gross),
    paid: Number(r.paid),
    balance: Number(r.gross) - Number(r.paid),
  }));
}
