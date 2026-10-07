"use client";

import { useActionState } from "react";
import { sendClientMessageAction } from "./actions";

export function MessageForm({ projectId, compact }: { projectId: string; compact?: boolean }) {
  const [state, action, pending] = useActionState<{ error?: string }, FormData>(
    sendClientMessageAction,
    {},
  );
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="projectId" value={projectId} />
      <textarea
        name="body"
        rows={compact ? 2 : 3}
        required
        maxLength={2000}
        placeholder="Ask about progress, payments, delays…"
        className="constra-input"
        aria-label="Message to the company"
      />
      {state?.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
      <button disabled={pending} className="constra-btn-primary self-end">
        {pending ? "Sending…" : "Send to company →"}
      </button>
    </form>
  );
}
