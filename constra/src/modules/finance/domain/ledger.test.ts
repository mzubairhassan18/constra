import { describe, expect, it } from "vitest";
import { buildReversal, validateBalanced, type JournalLine } from "./ledger";

const EXP = { accountId: "exp", debit: 105, credit: 0 };
const CASH = { accountId: "cash", debit: 0, credit: 105 };

describe("validateBalanced", () => {
  it("accepts a balanced two-line entry", () => {
    expect(validateBalanced([EXP, CASH])).toEqual({ ok: true });
  });

  it("accepts multi-line entries when totals match", () => {
    const lines: JournalLine[] = [
      { accountId: "a", debit: 60, credit: 0 },
      { accountId: "b", debit: 45.5, credit: 0 },
      { accountId: "c", debit: 0, credit: 105.5 },
    ];
    expect(validateBalanced(lines)).toEqual({ ok: true });
  });

  it("rejects unbalanced totals with the difference", () => {
    const r = validateBalanced([EXP, { accountId: "cash", debit: 0, credit: 100 }]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.diff).toBeCloseTo(5, 2);
  });

  it("rejects empty journals", () => {
    expect(validateBalanced([]).ok).toBe(false);
  });

  it("rejects lines with both debit and credit set", () => {
    expect(validateBalanced([{ accountId: "a", debit: 10, credit: 10 }]).ok).toBe(false);
  });

  it("rejects negative and all-zero lines", () => {
    expect(validateBalanced([{ accountId: "a", debit: -5, credit: 0 }]).ok).toBe(false);
    expect(validateBalanced([{ accountId: "a", debit: 0, credit: 0 }]).ok).toBe(false);
  });
});

describe("buildReversal", () => {
  it("negates the original (debit<->credit) and links reversesId", () => {
    const rev = buildReversal({ id: "txn-1", lines: [EXP, CASH] });
    expect(rev.reversesId).toBe("txn-1");
    expect(rev.lines).toEqual([
      { accountId: "exp", debit: 0, credit: 105 },
      { accountId: "cash", debit: 105, credit: 0 },
    ]);
  });

  it("original + reversal nets to zero per account (no update/delete of posted lines)", () => {
    const original = [EXP, CASH];
    const { lines: reversed } = buildReversal({ id: "txn-1", lines: original });
    const net = (accountId: string) =>
      [...original, ...reversed]
        .filter((l) => l.accountId === accountId)
        .reduce((n, l) => n + l.debit - l.credit, 0);
    expect(net("exp")).toBe(0);
    expect(net("cash")).toBe(0);
  });

  it("reversal of a reversal restores the original direction", () => {
    const once = buildReversal({ id: "txn-1", lines: [EXP, CASH] });
    const twice = buildReversal({ id: "txn-2", lines: once.lines });
    expect(twice.reversesId).toBe("txn-2");
    expect(twice.lines).toEqual([EXP, CASH]);
  });
});
