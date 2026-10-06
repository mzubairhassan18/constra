"use client";

import { useActionState } from "react";
import { useState } from "react";
import { createEmployeeAction } from "./actions";

export default function NewEmployeeForm() {
  const [state, action, pending] = useActionState<{ error?: string }, FormData>(
    createEmployeeAction,
    {},
  );
  const [kind, setKind] = useState("permanent");
  const input =
    "rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900";
  return (
    <form action={action} className="flex flex-col gap-3 rounded border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="font-semibold">New employee</h2>
      <div className="grid grid-cols-2 gap-3">
        <input name="name" required maxLength={200} placeholder="Full name" className={input} />
        <select name="kind" value={kind} onChange={(e) => setKind(e.target.value)} className={input}>
          <option value="permanent">Permanent</option>
          <option value="daily_wager">Daily wager</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {kind === "permanent" ? (
          <input name="monthlySalary" inputMode="decimal" placeholder="Monthly salary (AED)" className={input} />
        ) : (
          <>
            <input name="hourlyRate" inputMode="decimal" placeholder="Hourly rate" className={input} />
            <input name="dayRate" inputMode="decimal" placeholder="Day rate (optional)" className={input} />
          </>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input name="designation" maxLength={200} placeholder="Designation" className={input} />
        <input name="phone" maxLength={50} placeholder="Phone" className={input} />
      </div>
      {state?.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      <button disabled={pending} className="rounded bg-zinc-900 px-3 py-2 text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900">
        {pending ? "Adding…" : "Add employee"}
      </button>
    </form>
  );
}
