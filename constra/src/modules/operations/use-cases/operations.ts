import { validateBalanced } from "@/modules/finance/domain/ledger";

export interface ManpowerInput {
  date?: string;
  name: string;
  phone?: string;
  skill?: string;
  projectId?: string;
  stageId?: string;
  rate: number;
  hours: number;
  paid: number;
}

export interface OpsStore {
  saveEntry(e: ManpowerInput & { cost: number; balance: number }): Promise<string>;
  linkEntryTransaction(entryId: string, txnId: string): Promise<void>;
  getEntry(entryId: string): Promise<{ balance: number } | null>;
  addPayment(entryId: string, amount: number): Promise<void>;
  saveMaterialRequest(r: {
    projectId?: string;
    stageId?: string;
    requestedBy?: string;
    notes?: string;
    lines: { materialName: string; qty: number }[];
  }): Promise<string>;
  setRequestStatus(id: string, status: "approved" | "rejected" | "fulfilled"): Promise<void>;
  saveDailyReport(r: {
    projectId: string;
    stageId?: string;
    date?: string;
    workDone: string;
    delays?: string;
    nextDayPlan?: string;
    reportedBy?: string;
  }): Promise<string>;
}

export interface OpsPost {
  post(entry: {
    ref: string;
    memo?: string;
    lines: { accountId: string; debit: number; credit: number }[];
  }): Promise<string>;
}

export interface OpsAccounts {
  stageExpense(stageId: string): Promise<string>;
  control(code: string): Promise<string>;
  ensureControl(code: string, name: string, type: string, category: string): Promise<string>;
}

/** Site manpower: cost = rate×hours; paid now vs owed. Dr expense / Cr cash + Cr manpower-payable. */
export async function recordManpower(
  store: OpsStore,
  post: OpsPost,
  accounts: OpsAccounts,
  input: ManpowerInput,
): Promise<string> {
  if (!(input.rate >= 0) || !(input.hours > 0)) throw new Error("invalid rate/hours");
  if (!(input.paid >= 0)) throw new Error("invalid paid amount");
  const cost = Math.round(input.rate * input.hours * 100) / 100;
  if (input.paid > cost) throw new Error("paid exceeds cost");
  const balance = Math.round((cost - input.paid) * 100) / 100;
  const entryId = await store.saveEntry({ ...input, cost, balance });
  if (cost === 0) return entryId; // nothing to post
  const [exp, cash, payable] = await Promise.all([
    input.stageId ? accounts.stageExpense(input.stageId) : accounts.control("5000"),
    accounts.control("1000"),
    accounts.ensureControl("2001", "Manpower Payable", "liability", "Payables"),
  ]);
  const lines = [
    { accountId: exp, debit: cost, credit: 0 },
    ...(input.paid > 0 ? [{ accountId: cash, debit: 0, credit: input.paid }] : []),
    ...(balance > 0 ? [{ accountId: payable, debit: 0, credit: balance }] : []),
  ];
  const check = validateBalanced(lines);
  if (!check.ok) throw new Error("internal: unbalanced manpower entry");
  const txnId = await post.post({ ref: `manpower:${entryId}`, memo: input.name, lines });
  await store.linkEntryTransaction(entryId, txnId);
  return entryId;
}

/** Settle owed balance: Dr payable / Cr cash. */
export async function clearManpowerBalance(
  store: OpsStore,
  post: OpsPost,
  accounts: OpsAccounts,
  entryId: string,
  amount: number,
): Promise<void> {
  const entry = await store.getEntry(entryId);
  if (!entry) throw new Error("entry not found");
  if (!(amount > 0) || amount > entry.balance + 1e-9) throw new Error("invalid clear amount");
  const [cash, payable] = await Promise.all([
    accounts.control("1000"),
    accounts.ensureControl("2001", "Manpower Payable", "liability", "Payables"),
  ]);
  await post.post({
    ref: `manpower-clear:${entryId}`,
    lines: [
      { accountId: payable, debit: amount, credit: 0 },
      { accountId: cash, debit: 0, credit: amount },
    ],
  });
  await store.addPayment(entryId, amount);
}
