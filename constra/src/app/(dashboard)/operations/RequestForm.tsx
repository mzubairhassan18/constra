"use client";

import { useActionState } from "react";
import { createRequestAction } from "./actions";

const input =
  "rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900";

export default function RequestForm({ projects }: { projects: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState<{ error?: string }, FormData>(
    createRequestAction,
    {},
  );
  return (
    <form action={action} className="flex flex-col gap-3 rounded border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="font-semibold">Material request</h2>
      <select name="projectId" className={input} defaultValue="">
        <option value="">Project…</option>
        {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <textarea name="items" rows={3} required placeholder={"One per line: material + qty\nCement 50\nSand 50"} className={input} />
      <input name="notes" maxLength={500} placeholder="Notes" className={input} />
      {state?.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      <button disabled={pending} className="rounded bg-zinc-900 px-3 py-2 text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900">
        {pending ? "Sending…" : "Send request"}
      </button>
    </form>
  );
}
