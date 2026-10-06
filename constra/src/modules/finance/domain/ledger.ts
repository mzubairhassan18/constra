// Pure double-entry helpers. Posted lines are never mutated —
// corrections are new transactions built by buildReversal.
export interface JournalLine {
  accountId: string;
  debit: number;
  credit: number;
}

export type BalanceCheck =
  | { ok: true }
  | { ok: false; error: string; diff?: number };

export function validateBalanced(lines: JournalLine[]): BalanceCheck {
  if (lines.length === 0) return { ok: false, error: "empty journal" };
  let debit = 0;
  let credit = 0;
  for (const l of lines) {
    if (!(l.debit >= 0) || !(l.credit >= 0))
      return { ok: false, error: "negative amount" };
    const sides = (l.debit > 0 ? 1 : 0) + (l.credit > 0 ? 1 : 0);
    if (sides !== 1) return { ok: false, error: "line must have exactly one side" };
    debit += l.debit;
    credit += l.credit;
  }
  const diff = Math.round((debit - credit) * 100) / 100;
  if (diff !== 0) return { ok: false, error: "unbalanced", diff };
  return { ok: true };
}

export function buildReversal(entry: {
  id: string;
  lines: JournalLine[];
}): { reversesId: string; lines: JournalLine[] } {
  return {
    reversesId: entry.id,
    lines: entry.lines.map((l) => ({
      accountId: l.accountId,
      debit: l.credit,
      credit: l.debit,
    })),
  };
}
