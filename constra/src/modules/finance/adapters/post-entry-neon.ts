import sql from "@/lib/db";
import { validateBalanced, type JournalLine } from "../domain/ledger";

export interface PostEntryInput {
  ref: string;
  memo?: string;
  date?: string;
  lines: JournalLine[];
}

/** Posts a balanced entry atomically (single statement). Throws on unbalanced input. */
export async function postJournalEntry(input: PostEntryInput): Promise<string> {
  const check = validateBalanced(input.lines);
  if (!check.ok) throw new Error(`unbalanced entry: ${check.error}`);
  const accountIds = input.lines.map((l) => l.accountId);
  const debits = input.lines.map((l) => l.debit);
  const credits = input.lines.map((l) => l.credit);
  const rows = await sql`
    WITH h AS (
      INSERT INTO transactions (date, ref, memo)
      VALUES (COALESCE(${input.date ?? null}::date, CURRENT_DATE), ${input.ref}, ${input.memo ?? null})
      RETURNING id
    )
    INSERT INTO transaction_lines (transaction_id, account_id, debit, credit)
    SELECT h.id, a, d, c FROM h,
      unnest(${accountIds}::uuid[], ${debits}::numeric[], ${credits}::numeric[])
      AS u(a, d, c)
    RETURNING transaction_id AS id`;
  return rows[0].id as string;
}
