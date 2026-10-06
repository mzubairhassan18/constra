import { describe, expect, it } from "vitest";
import {
  recordClientInvoice,
  recordReceipt,
  recordSupplierBill,
  type AccountsPort,
  type BillsPort,
  type PostPort,
} from "./record-bill";

function fakes() {
  const posted: { ref: string; lines: { accountId: string; debit: number; credit: number }[] }[] = [];
  const bills: BillsPort = {
    async saveBill(h) {
      expect(h.net).toBe(200);
      expect(h.vatIn).toBe(10);
      expect(h.gross).toBe(210);
      return "bill-1";
    },
    async linkBillTransaction(billId, txnId) {
      expect(billId).toBe("bill-1");
      expect(txnId).toBe("txn-1");
    },
    async saveInvoice(h) {
      expect(h.net).toBe(1000);
      expect(h.vatOut).toBe(50);
      expect(h.gross).toBe(1050);
      return "inv-1";
    },
    async linkInvoiceTransaction() {},
    async saveReceipt() {
      return "rcpt-1";
    },
  };
  const post: PostPort = {
    async post(entry) {
      posted.push(entry);
      return "txn-1";
    },
  };
  const accounts: AccountsPort = {
    async control(code: string) {
      return code;
    },
    async stageExpense() {
      return "EXP";
    },
  };
  return { bills, post, accounts, posted };
}

describe("recordSupplierBill", () => {
  it("posts Dr expense + Dr VAT-In / Cr payable (balanced)", async () => {
    const { bills, post, accounts, posted } = fakes();
    const id = await recordSupplierBill(bills, post, accounts, {
      stageId: "stage-1",
      lines: [{ qty: 2, unitPrice: 100, taxCode: "standard" }],
    });
    expect(id).toBe("bill-1");
    expect(posted).toHaveLength(1);
    const e = posted[0];
    const dr = e.lines.reduce((n, l) => n + l.debit, 0);
    const cr = e.lines.reduce((n, l) => n + l.credit, 0);
    expect(dr).toBe(cr);
    expect(e.lines.find((l) => l.accountId === "1400")?.debit).toBe(10);
  });

  it("rejects empty lines and bad tax codes", async () => {
    const { bills, post, accounts } = fakes();
    await expect(recordSupplierBill(bills, post, accounts, { lines: [] })).rejects.toThrow();
    await expect(
      recordSupplierBill(bills, post, accounts, {
        lines: [{ qty: 1, unitPrice: 10, taxCode: "bogus" as never }],
      }),
    ).rejects.toThrow();
  });
});

describe("recordClientInvoice + recordReceipt", () => {
  it("invoice posts Dr receivable / Cr revenue + VAT-Out; receipt Dr cash / Cr receivable", async () => {
    const { bills, post, accounts, posted } = fakes();
    await recordClientInvoice(bills, post, accounts, {
      projectId: "proj-1",
      lines: [{ qty: 1, unitPrice: 1000, taxCode: "standard" }],
    });
    await recordReceipt(bills, post, accounts, { invoiceId: "inv-1", amount: 500 });
    expect(posted).toHaveLength(2);
    const [inv, rcpt] = posted;
    expect(inv.lines.find((l) => l.accountId === "1100")?.debit).toBe(1050);
    expect(inv.lines.find((l) => l.accountId === "2100")?.credit).toBe(50);
    expect(rcpt.lines).toEqual([
      { accountId: "1000", debit: 500, credit: 0 },
      { accountId: "1100", debit: 0, credit: 500 },
    ]);
  });
});
