"use client";

import { useActionState, useState } from "react";
import { createInvoiceAction } from "./actions";

const input =
  "rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900";

export default function InvoiceForm({ projects }: { projects: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState<{ error?: string }, FormData>(
    createInvoiceAction,
    {},
  );
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");

  return (
    <form action={action} className="flex flex-col gap-3 rounded border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="font-semibold">New client invoice (VAT 5% out)</h2>
      <div className="grid grid-cols-2 gap-3">
        <select name="projectId" required className={input} defaultValue="">
          <option value="" disabled>Project…</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <input name="invoiceNo" maxLength={100} placeholder="Invoice no." className={input} />
      </div>
      <input type="hidden" name="lines" value={JSON.stringify([
        { description: desc, qty: 1, unitPrice: Number(amount) || 0, discount: 0, taxCode: "standard" },
      ])} />
      <div className="grid grid-cols-2 gap-3">
        <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Work description" className={input} />
        <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="Amount (ex VAT)" className={input} />
      </div>
      {state?.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      <button disabled={pending} className="rounded bg-zinc-900 px-3 py-2 text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900">
        {pending ? "Issuing…" : "Issue invoice"}
      </button>
    </form>
  );
}
