"use client";

import { useActionState, useState } from "react";
import { createBillAction } from "./actions";

interface Line {
  description: string;
  qty: string;
  unitPrice: string;
  taxCode: string;
}

const empty: Line = { description: "", qty: "1", unitPrice: "", taxCode: "standard" };
const input =
  "rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900";

export default function BillForm({
  suppliers,
  projects,
  stages,
}: {
  suppliers: { id: string; name: string }[];
  projects: { id: string; name: string }[];
  stages: { id: string; projectId: string; name: string }[];
}) {
  const [state, action, pending] = useActionState<{ error?: string }, FormData>(
    createBillAction,
    {},
  );
  const [lines, setLines] = useState<Line[]>([{ ...empty }]);
  const [projectId, setProjectId] = useState("");

  const set = (i: number, k: keyof Line, v: string) =>
    setLines((ls) => ls.map((l, j) => (j === i ? { ...l, [k]: v } : l)));

  const payload = lines.map((l) => ({
    description: l.description,
    qty: Number(l.qty) || 0,
    unitPrice: Number(l.unitPrice) || 0,
    discount: 0,
    taxCode: l.taxCode,
  }));

  return (
    <form action={action} className="flex flex-col gap-3 rounded border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="font-semibold">New supplier bill (VAT auto-posted)</h2>
      <div className="grid grid-cols-2 gap-3">
        <input name="invoiceNo" maxLength={100} placeholder="Invoice no." className={input} />
        <select name="supplierId" className={input} defaultValue="">
          <option value="">Supplier…</option>
          {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select name="projectId" className={input} value={projectId} onChange={(e) => setProjectId(e.target.value)}>
          <option value="">Project…</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select name="stageId" className={input} defaultValue="">
          <option value="">Stage…</option>
          {stages.filter((s) => !projectId || s.projectId === projectId).map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>
      <input type="hidden" name="lines" value={JSON.stringify(payload)} />
      {lines.map((l, i) => (
        <div key={i} className="grid grid-cols-5 gap-2">
          <input value={l.description} onChange={(e) => set(i, "description", e.target.value)}
            placeholder="Description" className={input} />
          <input value={l.qty} onChange={(e) => set(i, "qty", e.target.value)}
            inputMode="decimal" placeholder="Qty" className={input} />
          <input value={l.unitPrice} onChange={(e) => set(i, "unitPrice", e.target.value)}
            inputMode="decimal" placeholder="Rate" className={input} />
          <select value={l.taxCode} onChange={(e) => set(i, "taxCode", e.target.value)} className={input}>
            <option value="standard">VAT 5%</option>
            <option value="zero">Zero</option>
            <option value="exempt">Exempt</option>
            <option value="reverse">Reverse</option>
          </select>
          <button type="button" onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))}
            className="rounded border border-zinc-300 px-2 py-1 text-sm">✕</button>
        </div>
      ))}
      <button type="button" onClick={() => setLines((ls) => [...ls, { ...empty }])}
        className="self-start rounded border border-zinc-300 px-2 py-1 text-sm">+ Add line</button>
      {state?.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      <button disabled={pending} className="rounded bg-zinc-900 px-3 py-2 text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900">
        {pending ? "Posting…" : "Post bill"}
      </button>
    </form>
  );
}
