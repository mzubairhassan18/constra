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
  await sql`DELETE FROM transaction_lines l USING transactions t WHERE l.transaction_id = t.id AND t.ref LIKE 'manpower%'`;
  await sql`DELETE FROM manpower_entries WHERE name LIKE '__test%'`;
  await sql`DELETE FROM transactions WHERE ref LIKE 'manpower%'`;
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
