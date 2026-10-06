import { afterAll, describe, expect, it } from "vitest";
import sql from "../../../lib/db";
import { postJournalEntry } from "./post-entry-neon";

// Targets the 0002_accounting.sql shape:
//   transactions(id, date, ref, memo, reverses_id, ...)
//   transaction_lines(transaction_id, account_id, debit, credit)

const uid = () => `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
const refs: string[] = [];
const tag = () => {
  const r = `__test-${uid()}`;
  refs.push(r);
  return r;
};

async function seedAccount(code: string): Promise<string> {
  const rows = await sql`
    INSERT INTO accounts (code, name, type) VALUES (${code}, ${code}, 'expense')
    ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
    RETURNING id`;
  return rows[0].id as string;
}

async function trialFor(ref: string): Promise<{ debit: number; credit: number }> {
  const rows = await sql`
    SELECT COALESCE(SUM(l.debit), 0) AS debit, COALESCE(SUM(l.credit), 0) AS credit
    FROM transaction_lines l JOIN transactions t ON t.id = l.transaction_id
    WHERE t.ref = ${ref}`;
  return { debit: Number(rows[0].debit), credit: Number(rows[0].credit) };
}

afterAll(async () => {
  if (refs.length === 0) return;
  await sql`
    DELETE FROM transaction_lines l USING transactions t
    WHERE l.transaction_id = t.id AND t.ref LIKE '__test-%'`;
  await sql`DELETE FROM transactions WHERE ref LIKE '__test-%'`;
  await sql`DELETE FROM accounts WHERE code LIKE '__test-%'`;
});

describe("postJournalEntry (Neon integration)", () => {
  it("posts a balanced entry; lines exist and trial sums to zero", async () => {
    const ref = tag();
    const [expId, cashId] = await Promise.all([seedAccount(`__test-exp-${uid()}`), seedAccount(`__test-cash-${uid()}`)]);

    const id = await postJournalEntry({
      ref,
      memo: "it-bal",
      lines: [
        { accountId: expId, debit: 105, credit: 0 },
        { accountId: cashId, debit: 0, credit: 105 },
      ],
    });
    expect(typeof id).toBe("string");

    const persisted = await sql`
      SELECT l.account_id, l.debit, l.credit FROM transaction_lines l
      JOIN transactions t ON t.id = l.transaction_id WHERE t.ref = ${ref}`;
    expect(persisted.length).toBe(2);

    const trial = await trialFor(ref);
    expect(trial.debit).toBeCloseTo(105, 2);
    expect(trial.credit).toBeCloseTo(105, 2);
    expect(trial.debit - trial.credit).toBeCloseTo(0, 2);
  });

  it("rejects an unbalanced entry and persists no header", async () => {
    const ref = tag();
    const [aId, bId] = await Promise.all([seedAccount(`__test-a-${uid()}`), seedAccount(`__test-b-${uid()}`)]);

    await expect(
      postJournalEntry({
        ref,
        memo: "it-unbalanced",
        lines: [
          { accountId: aId, debit: 105, credit: 0 },
          { accountId: bId, debit: 0, credit: 100 },
        ],
      }),
    ).rejects.toThrow();

    const rows = await sql`SELECT id FROM transactions WHERE ref = ${ref}`;
    expect(rows.length).toBe(0);
  });
});
