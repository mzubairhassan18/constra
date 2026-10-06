"use client";

import { useActionState } from "react";
import { createUserAction } from "./actions";

const input =
  "rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900";

export default function NewUserForm({ roles }: { roles: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState<{ error?: string }, FormData>(
    createUserAction,
    {},
  );
  return (
    <form action={action} className="flex flex-col gap-3 rounded border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="font-semibold">New user</h2>
      <div className="grid grid-cols-2 gap-3">
        <input name="username" required maxLength={100} placeholder="username" className={input} />
        <input name="displayName" required maxLength={200} placeholder="Display name" className={input} />
        <input name="email" type="email" maxLength={200} placeholder="Email (optional)" className={input} />
        <select name="roleId" required className={input} defaultValue="">
          <option value="" disabled>Role…</option>
          {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </div>
      <input name="password" type="password" required minLength={8} placeholder="Temporary password (min 8)" className={input} />
      {state?.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      <button disabled={pending} className="rounded bg-zinc-900 px-3 py-2 text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900">
        {pending ? "Creating…" : "Create user"}
      </button>
    </form>
  );
}
