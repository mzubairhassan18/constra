import { afterAll, describe, expect, it } from "vitest";
import sql from "@/lib/db";
import { getBillDetail, listBillImages, neonAccounts, neonBills, saveBillImage } from "./bills-neon";
import { postJournalEntry } from "./post-entry-neon";
import {
  recordClientInvoice,
  recordSupplierBill,
} from "../use-cases/record-bill";

const post = { post: postJournalEntry };

afterAll(async () => {
  // Scoped strictly to __test rows: refs embed the row id, so collect first.
  const bb = await sql`SELECT id FROM bills WHERE invoice_no LIKE '__test%'`;
  const ii = await sql`SELECT id FROM client_invoices WHERE invoice_no LIKE '__test%'`;
  const refs = [
    ...bb.map((r) => `bill:${r.id as string}`),
    ...ii.map((r) => `invoice:${r.id as string}`),
  ];
  if (refs.length > 0) {
    await sql`DELETE FROM transaction_lines WHERE transaction_id IN (SELECT id FROM transactions WHERE ref = ANY(${refs}))`;
  }
  await sql`DELETE FROM bill_lines WHERE bill_id IN (SELECT id FROM bills WHERE invoice_no LIKE '__test%')`;
  await sql`DELETE FROM bill_images WHERE bill_id IN (SELECT id FROM bills WHERE invoice_no LIKE '__test%')`;
  await sql`DELETE FROM bills WHERE invoice_no LIKE '__test%'`;
  await sql`DELETE FROM client_receipts WHERE invoice_id IN (SELECT id FROM client_invoices WHERE invoice_no LIKE '__test%')`;
  await sql`DELETE FROM client_invoices WHERE invoice_no LIKE '__test%'`;
  if (refs.length > 0) {
    await sql`DELETE FROM transactions WHERE ref = ANY(${refs})`;
  }
});

describe("bills end-to-end (neon)", () => {
  it("supplier bill persists with lines + balanced ledger entry", async () => {
    const billId = await recordSupplierBill(neonBills, post, neonAccounts, {
      invoiceNo: "__test-inv-1",
      lines: [{ qty: 2, unitPrice: 100, taxCode: "standard", description: "Cement" }],
    });
    const bills = await sql`SELECT net, vat_in, gross, transaction_id FROM bills WHERE id = ${billId}`;
    expect(Number(bills[0].net)).toBe(200);
    expect(Number(bills[0].vat_in)).toBe(10);
    expect(bills[0].transaction_id).toBeTruthy();
    const trial = await sql`
      SELECT COALESCE(SUM(debit),0) AS d, COALESCE(SUM(credit),0) AS c
      FROM transaction_lines WHERE transaction_id = ${bills[0].transaction_id as string}`;
    expect(Number(trial[0].d)).toBe(Number(trial[0].c));
  });

  it("bill attachments round-trip and appear in detail", async () => {
    const billId = await recordSupplierBill(neonBills, post, neonAccounts, {
      invoiceNo: "__test-inv-img",
      lines: [{ qty: 1, unitPrice: 50, taxCode: "standard", description: "Sand" }],
    });
    await saveBillImage({ billId, key: `bills/${billId}/__test-receipt.jpg`, mime: "image/jpeg", size: 1234 });
    const imgs = await listBillImages(billId);
    expect(imgs).toHaveLength(1);
    expect(imgs[0].key).toContain("__test-receipt.jpg");
    const detail = await getBillDetail(billId);
    expect(detail?.lines).toHaveLength(1);
    expect(detail?.images).toHaveLength(1);
    expect(detail?.gross).toBe(52.5);
  });

  it("client invoice persists with receivable/revenue/VAT-Out entry", async () => {
    const [p] = await sql`INSERT INTO projects (name) VALUES ('__test billproj') RETURNING id`;
    try {
      const invId = await recordClientInvoice(neonBills, post, neonAccounts, {
        projectId: p.id as string,
        invoiceNo: "__test-ci-1",
        lines: [{ qty: 1, unitPrice: 1000, taxCode: "standard" }],
      });
      const inv = await sql`SELECT gross, transaction_id FROM client_invoices WHERE id = ${invId}`;
      expect(Number(inv[0].gross)).toBe(1050);
      expect(inv[0].transaction_id).toBeTruthy();
    } finally {
      await sql`DELETE FROM projects WHERE id = ${p.id as string}`;
    }
  });
});
