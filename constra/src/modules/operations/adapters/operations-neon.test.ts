import { afterAll, describe, expect, it } from "vitest";
import sql from "@/lib/db";
import {
  listManpower,
  neonOpsAccounts,
  neonOpsStore,
} from "./operations-neon";
import { postJournalEntry } from "@/modules/finance/adapters/post-entry-neon";
import {
  clearManpowerBalance,
  recordManpower,
} from "../use-cases/operations";

const post = { post: postJournalEntry };

afterAll(async () => {
  // Scoped strictly to __test rows (entry ids are embedded in refs).
  const te = await sql`SELECT id FROM manpower_entries WHERE name LIKE '__test%'`;
  const refs = te.flatMap((r) => [`manpower:${r.id as string}`, `manpower-clear:${r.id as string}`]);
  if (refs.length > 0) {
    await sql`DELETE FROM transaction_lines WHERE transaction_id IN (SELECT id FROM transactions WHERE ref = ANY(${refs}))`;
  }
  await sql`DELETE FROM manpower_entries WHERE name LIKE '__test%'`;
  if (refs.length > 0) {
    await sql`DELETE FROM transactions WHERE ref = ANY(${refs})`;
  }
});

describe("manpower end-to-end (neon)", () => {
  it("records entry with payable balance, then clears it", async () => {
    const id = await recordManpower(neonOpsStore, post, neonOpsAccounts, {
      name: "__test wager",
      rate: 20,
      hours: 8,
      paid: 100,
    });
    const entry = await neonOpsStore.getEntry(id);
    expect(entry?.balance).toBe(60);

    await clearManpowerBalance(neonOpsStore, post, neonOpsAccounts, id, 60);
    const cleared = await neonOpsStore.getEntry(id);
    expect(cleared?.balance).toBe(0);

    const rows = await listManpower(5);
    expect(rows.some((r) => r.id === id)).toBe(true);
  });
});
