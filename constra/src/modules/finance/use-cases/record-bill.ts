import {
  calcLineNet,
  calcLineVat,
  summarizeBill,
  type BillLineInput,
  type TaxCode,
} from "@/modules/finance/domain/vat";
import { validateBalanced } from "@/modules/finance/domain/ledger";

export interface BillLine extends BillLineInput {
  materialId?: string;
  description?: string;
}

export interface BillsPort {
  saveBill(header: {
    invoiceNo?: string;
    supplierId?: string;
    projectId?: string;
    stageId?: string;
    date?: string;
    net: number;
    vatIn: number;
    gross: number;
    lines: (BillLine & { net: number; vat: number })[];
  }): Promise<string>;
  linkBillTransaction(billId: string, txnId: string): Promise<void>;
  saveInvoice(header: {
    projectId: string;
    stageId?: string;
    invoiceNo?: string;
    date?: string;
    net: number;
    vatOut: number;
    gross: number;
  }): Promise<string>;
  linkInvoiceTransaction(invoiceId: string, txnId: string): Promise<void>;
  saveReceipt(input: {
    invoiceId: string;
    date?: string;
    amount: number;
    method?: string;
  }): Promise<string>;
}

export interface PostPort {
  post(entry: {
    ref: string;
    memo?: string;
    lines: { accountId: string; debit: number; credit: number }[];
  }): Promise<string>;
}

export interface AccountsPort {
  control(code: string): Promise<string>;
  stageExpense(stageId: string): Promise<string>;
}

const KNOWN_TAX: TaxCode[] = ["standard", "zero", "exempt", "reverse"];

function checkLines(lines: BillLine[]): void {
  if (lines.length === 0) throw new Error("bill needs at least one line");
  for (const l of lines) {
    if (!KNOWN_TAX.includes(l.taxCode)) throw new Error(`unknown tax code ${l.taxCode}`);
    if (!(l.qty > 0)) throw new Error("qty must be > 0");
  }
}

/** Supplier bill: Dr stage expense (net) + Dr VAT-In / Cr supplier payable (gross). */
export async function recordSupplierBill(
  bills: BillsPort,
  post: PostPort,
  accounts: AccountsPort,
  input: {
    invoiceNo?: string;
    supplierId?: string;
    projectId?: string;
    stageId?: string;
    date?: string;
    lines: BillLine[];
  },
): Promise<string> {
  checkLines(input.lines);
  const computed = input.lines.map((l) => ({
    ...l,
    net: calcLineNet(l),
    vat: calcLineVat(l),
  }));
  const s = summarizeBill(computed, "in");
  const billId = await bills.saveBill({
    invoiceNo: input.invoiceNo,
    supplierId: input.supplierId,
    projectId: input.projectId,
    stageId: input.stageId,
    date: input.date,
    net: s.net,
    vatIn: s.vatIn,
    gross: s.gross,
    lines: computed,
  });
  const [exp, vatIn, payable] = await Promise.all([
    input.stageId ? accounts.stageExpense(input.stageId) : accounts.control("5000"),
    accounts.control("1400"),
    accounts.control("2000"),
  ]);
  const lines = [
    { accountId: exp, debit: s.net, credit: 0 },
    ...(s.vatIn > 0 ? [{ accountId: vatIn, debit: s.vatIn, credit: 0 }] : []),
    { accountId: payable, debit: 0, credit: s.gross },
  ];
  const check = validateBalanced(lines);
  if (!check.ok) throw new Error("internal: unbalanced bill entry");
  const txnId = await post.post({ ref: `bill:${billId}`, memo: input.invoiceNo, lines });
  await bills.linkBillTransaction(billId, txnId);
  return billId;
}

/** Client invoice: Dr receivable (gross) / Cr revenue (net) + Cr VAT-Out. */
export async function recordClientInvoice(
  bills: BillsPort,
  post: PostPort,
  accounts: AccountsPort,
  input: {
    projectId: string;
    stageId?: string;
    invoiceNo?: string;
    date?: string;
    lines: BillLine[];
  },
): Promise<string> {
  checkLines(input.lines);
  const computed = input.lines.map((l) => ({
    ...l,
    net: calcLineNet(l),
    vat: calcLineVat(l),
  }));
  const s = summarizeBill(computed, "out");
  const invoiceId = await bills.saveInvoice({
    projectId: input.projectId,
    stageId: input.stageId,
    invoiceNo: input.invoiceNo,
    date: input.date,
    net: s.net,
    vatOut: s.vatOut,
    gross: s.gross,
  });
  const [recv, revenue, vatOut] = await Promise.all([
    accounts.control("1100"),
    accounts.control("4000"),
    accounts.control("2100"),
  ]);
  const txnId = await post.post({
    ref: `invoice:${invoiceId}`,
    memo: input.invoiceNo,
    lines: [
      { accountId: recv, debit: s.gross, credit: 0 },
      { accountId: revenue, debit: 0, credit: s.net },
      ...(s.vatOut > 0 ? [{ accountId: vatOut, debit: 0, credit: s.vatOut }] : []),
    ],
  });
  await bills.linkInvoiceTransaction(invoiceId, txnId);
  return invoiceId;
}

/** Client payment: Dr cash / Cr receivable. */
export async function recordReceipt(
  bills: BillsPort,
  post: PostPort,
  accounts: AccountsPort,
  input: { invoiceId: string; amount: number; date?: string; method?: string },
): Promise<string> {
  if (!(input.amount > 0)) throw new Error("amount must be > 0");
  const receiptId = await bills.saveReceipt(input);
  const [cash, recv] = await Promise.all([
    accounts.control("1000"),
    accounts.control("1100"),
  ]);
  await post.post({
    ref: `receipt:${receiptId}`,
    lines: [
      { accountId: cash, debit: input.amount, credit: 0 },
      { accountId: recv, debit: 0, credit: input.amount },
    ],
  });
  return receiptId;
}
