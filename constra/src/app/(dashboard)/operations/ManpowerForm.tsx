"use client";

import { useActionState } from "react";
import { createManpowerAction } from "./actions";

const input =
  "rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900";

export default function ManpowerForm({ projects }: { projects: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState<{ error?: string }, FormData>(
    createManpowerAction,
    {},
  );
  return (
    <form action={action} className="flex flex-col gap-3 rounded border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="font-semibold">Daily wager entry (paid + due auto-posted)</h2>
      <div className="grid grid-cols-2 gap-3">
        <input name="name" required maxLength={200} placeholder="Worker name" className={input} />
        <input name="skill" maxLength={100} placeholder="Skill" className={input} />
        <select name="projectId" className={input} defaultValue="">
          <option value="">Project…</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <input name="rate" required inputMode="decimal" placeholder="Rate/hr" className={input} />
        <input name="hours" required inputMode="decimal" placeholder="Hours" defaultValue="8" className={input} />
        <input name="paid" required inputMode="decimal" placeholder="Paid now" defaultValue="0" className={input} />
      </div>
      {state?.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      <button disabled={pending} className="rounded bg-zinc-900 px-3 py-2 text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900">
        {pending ? "Saving…" : "Save entry"}
      </button>
    </form>
  );
}
