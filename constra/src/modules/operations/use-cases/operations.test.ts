import { describe, expect, it } from "vitest";
import {
  clearManpowerBalance,
  recordManpower,
  type OpsAccounts,
  type OpsPost,
  type OpsStore,
} from "./operations";

function fakes() {
  const posted: { ref: string; lines: { accountId: string; debit: number; credit: number }[] }[] = [];
  let balance = 0;
  const store: OpsStore = {
    async saveEntry(e) {
      balance = e.balance;
      expect(e.cost).toBe(160);
      return "mp-1";
    },
    async linkEntryTransaction() {},
    async getEntry() {
      return { balance };
    },
    async addPayment(_id, amount) {
      balance = Math.round((balance - amount) * 100) / 100;
    },
    async saveMaterialRequest() {
      return "mr-1";
    },
    async setRequestStatus() {},
    async saveDailyReport() {
      return "dr-1";
    },
  };
  const post: OpsPost = {
    async post(entry) {
      posted.push(entry);
      return "txn-1";
    },
  };
  const accounts: OpsAccounts = {
    async stageExpense() {
      return "EXP";
    },
    async control(code: string) {
      return code;
    },
    async ensureControl(code: string) {
      return code;
    },
  };
  return { store, post, accounts, posted, getBalance: () => balance };
}

describe("recordManpower", () => {
  it("splits cost into paid cash + payable balance (balanced)", async () => {
    const { store, post, accounts, posted } = fakes();
    const id = await recordManpower(store, post, accounts, {
      name: "Ravi",
      stageId: "stage-1",
      rate: 20,
      hours: 8,
      paid: 100,
    });
    expect(id).toBe("mp-1");
    const e = posted[0];
    expect(e.lines.find((l) => l.accountId === "EXP")?.debit).toBe(160);
    expect(e.lines.find((l) => l.accountId === "1000")?.credit).toBe(100);
    expect(e.lines.find((l) => l.accountId === "2001")?.credit).toBe(60);
  });

  it("rejects overpayment", async () => {
    const { store, post, accounts } = fakes();
    await expect(
      recordManpower(store, post, accounts, { name: "Ravi", rate: 20, hours: 8, paid: 200 }),
    ).rejects.toThrow();
  });
});

describe("clearManpowerBalance", () => {
  it("posts Dr payable / Cr cash and reduces balance", async () => {
    const { store, post, accounts, posted, getBalance } = fakes();
    await recordManpower(store, post, accounts, { name: "Ravi", rate: 20, hours: 8, paid: 100 });
    await clearManpowerBalance(store, post, accounts, "mp-1", 60);
    expect(getBalance()).toBe(0);
    const clr = posted[1];
    expect(clr.lines).toEqual([
      { accountId: "2001", debit: 60, credit: 0 },
      { accountId: "1000", debit: 0, credit: 60 },
    ]);
  });
});
