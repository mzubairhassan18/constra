"use client";

import { useActionState, useState } from "react";
import { resetPasswordAction } from "./actions";

export default function ResetPasswordForm({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<{ error?: string }, FormData>(
    resetPasswordAction,
    {},
  );
  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700">
        Reset password
      </button>
    );
  }
  return (
    <form action={action} className="flex items-center gap-1">
      <input type="hidden" name="userId" value={userId} />
      <input
        name="password"
        type="password"
        required
        minLength={8}
        placeholder="New password"
        className="rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      />
      <button disabled={pending} className="rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700">
        Set
      </button>
      {state?.error && <span className="text-xs text-red-600">{state.error}</span>}
    </form>
  );
}
