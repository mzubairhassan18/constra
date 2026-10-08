import sql from "@/lib/db";
import { fmtDate } from "@/lib/format";
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
  {
    id: string;
    invoiceNo: string | null;
    date: string;
    net: number;
    vatIn: number;
    gross: number;
    supplier: string | null;
    project: string | null;
    stage: string | null;
    images: number;
  }[]
> {
  const rows = await sql`
    SELECT b.id, b.invoice_no, b.date, b.net, b.vat_in, b.gross,
      s.name AS supplier, p.name AS project, st.name AS stage,
      (SELECT count(*)::int FROM bill_images i WHERE i.bill_id = b.id) AS images
    FROM bills b
    LEFT JOIN suppliers s ON s.id = b.supplier_id
    LEFT JOIN projects p ON p.id = b.project_id
    LEFT JOIN stages st ON st.id = b.stage_id
    ORDER BY b.created_at DESC LIMIT 100`;
  return rows.map((r) => ({
    id: r.id as string,
    invoiceNo: r.invoice_no as string | null,
    date: fmtDate(r.date),
    net: Number(r.net),
    vatIn: Number(r.vat_in),
    gross: Number(r.gross),
    supplier: (r.supplier as string | null) ?? null,
    project: (r.project as string | null) ?? null,
    stage: (r.stage as string | null) ?? null,
    images: Number(r.images ?? 0),
  }));
}

export async function saveBillImage(input: {
  billId: string;
  key: string;
  mime: string;
  size: number;
}): Promise<string> {
  const r = await sql`
    INSERT INTO bill_images (bill_id, r2_key, mime, size)
    VALUES (${input.billId}, ${input.key}, ${input.mime}, ${input.size})
    RETURNING id`;
  return r[0].id as string;
}

export async function listBillImages(billId: string): Promise<
  { id: string; key: string; mime: string; size: number }[]
> {
  const rows = await sql`
    SELECT id, r2_key, mime, size FROM bill_images WHERE bill_id = ${billId} ORDER BY created_at`;
  return rows.map((r) => ({
    id: r.id as string,
    key: r.r2_key as string,
    mime: r.mime as string,
    size: Number(r.size ?? 0),
  }));
}

export async function getBillDetail(billId: string): Promise<{
  id: string;
  invoiceNo: string | null;
  date: string;
  net: number;
  vatIn: number;
  gross: number;
  supplier: string | null;
  project: string | null;
  stage: string | null;
  lines: { description: string | null; qty: number; unitPrice: number; taxCode: string; net: number; vat: number }[];
  images: { id: string; key: string; mime: string; size: number }[];
} | null> {
  const bills = await sql`
    SELECT b.id, b.invoice_no, b.date, b.net, b.vat_in, b.gross,
      s.name AS supplier, p.name AS project, st.name AS stage
    FROM bills b
    LEFT JOIN suppliers s ON s.id = b.supplier_id
    LEFT JOIN projects p ON p.id = b.project_id
    LEFT JOIN stages st ON st.id = b.stage_id
    WHERE b.id = ${billId}`;
  if (bills.length === 0) return null;
  const b = bills[0];
  const lines = await sql`
    SELECT description, qty, unit_price, tax_code, net, vat FROM bill_lines WHERE bill_id = ${billId} ORDER BY ctid`;
  return {
    id: b.id as string,
    invoiceNo: (b.invoice_no as string | null) ?? null,
    date: fmtDate(b.date),
    net: Number(b.net),
    vatIn: Number(b.vat_in),
    gross: Number(b.gross),
    supplier: (b.supplier as string | null) ?? null,
    project: (b.project as string | null) ?? null,
    stage: (b.stage as string | null) ?? null,
    lines: lines.map((l) => ({
      description: (l.description as string | null) ?? null,
      qty: Number(l.qty),
      unitPrice: Number(l.unit_price),
      taxCode: String(l.tax_code),
      net: Number(l.net),
      vat: Number(l.vat),
    })),
    images: await listBillImages(billId),
  };
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
