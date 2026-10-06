"use client";

import { useActionState } from "react";
import { createProjectAction } from "./actions";

export default function NewProjectForm() {
  const [state, action, pending] = useActionState<{ error?: string }, FormData>(
    createProjectAction,
    {},
  );
  return (
    <form action={action} className="flex flex-col gap-3 rounded border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="font-semibold">New project</h2>
      <input name="name" required maxLength={200} placeholder="Project name — e.g. Villa, Palm Jumeirah"
        className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900" />
      <div className="grid grid-cols-2 gap-3">
        <input name="clientName" maxLength={200} placeholder="Client name"
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900" />
        <input name="location" maxLength={300} placeholder="Location — e.g. Dubai"
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900" />
      </div>
      <input name="agreementAmount" inputMode="decimal" placeholder="Agreement amount (AED)"
        className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900" />
      <textarea name="stages" rows={4} placeholder={"Stages, one per line:\nFoundation\nStructure\nMEP\nFinishing"}
        className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900" />
      {state?.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      <button disabled={pending} className="rounded bg-zinc-900 px-3 py-2 text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900">
        {pending ? "Creating…" : "Create project"}
      </button>
    </form>
  );
}
