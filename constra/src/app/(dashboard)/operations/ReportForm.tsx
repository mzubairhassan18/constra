"use client";

import { useActionState } from "react";
import { createReportAction } from "./actions";

const input =
  "rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900";

export default function ReportForm({ projects }: { projects: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState<{ error?: string }, FormData>(
    createReportAction,
    {},
  );
  return (
    <form action={action} className="flex flex-col gap-3 rounded border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="font-semibold">Foreman daily report</h2>
      <select name="projectId" required className={input} defaultValue="">
        <option value="" disabled>Project…</option>
        {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <textarea name="workDone" rows={3} required maxLength={2000} placeholder="Work done today" className={input} />
      <textarea name="delays" rows={2} maxLength={1000} placeholder="Delays / reasons (optional)" className={input} />
      <textarea name="nextDayPlan" rows={2} maxLength={1000} placeholder="Next day plan (optional)" className={input} />
      <input name="photos" type="file" accept="image/*" multiple className="text-sm" />
      {state?.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      <button disabled={pending} className="rounded bg-zinc-900 px-3 py-2 text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900">
        {pending ? "Saving…" : "Submit report"}
      </button>
    </form>
  );
}
