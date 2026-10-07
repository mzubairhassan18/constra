"use client";

import { useActionState, useMemo, useState } from "react";
import { createBillAction } from "./actions";
import { FileUpload } from "@/ui/file-upload";

interface Line {
  description: string;
  qty: string;
  unitPrice: string;
  taxCode: string;
}

const empty: Line = { description: "", qty: "1", unitPrice: "", taxCode: "standard" };
const input = "constra-input";
const aed = (n: number) => `AED ${n.toFixed(2)}`;

function lineNet(l: Line): number {
  return (Number(l.qty) || 0) * (Number(l.unitPrice) || 0);
}
function lineVat(l: Line): number {
  return l.taxCode === "standard" ? lineNet(l) * 0.05 : 0;
}

export default function BillForm({
  suppliers,
  projects,
  stages,
}: {
  suppliers: { id: string; name: string }[];
  projects: { id: string; name: string }[];
  stages: { id: string; projectId: string; name: string }[];
}) {
  const [state, action, pending] = useActionState<{ error?: string; warning?: string }, FormData>(
    createBillAction,
    {},
  );
  const [lines, setLines] = useState<Line[]>([{ ...empty }]);
  const [projectId, setProjectId] = useState("");

  const set = (i: number, k: keyof Line, v: string) =>
    setLines((ls) => ls.map((l, j) => (j === i ? { ...l, [k]: v } : l)));

  const totals = useMemo(() => {
    const net = lines.reduce((n, l) => n + lineNet(l), 0);
    const vat = lines.reduce((n, l) => n + lineVat(l), 0);
    return { net, vat, gross: net + vat };
  }, [lines]);

  const payload = lines.map((l) => ({
    description: l.description,
    qty: Number(l.qty) || 0,
    unitPrice: Number(l.unitPrice) || 0,
    discount: 0,
    taxCode: l.taxCode,
  }));

  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input name="invoiceNo" maxLength={100} placeholder="Invoice no." className={input} />
        <input name="date" type="date" className={input} aria-label="Bill date" />
        <select name="supplierId" className={input} defaultValue="" aria-label="Supplier">
          <option value="">Supplier…</option>
          {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select
          name="projectId"
          className={input}
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          aria-label="Project"
        >
          <option value="">Project…</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <select name="stageId" className={input} defaultValue="" aria-label="Stage">
        <option value="">Stage…</option>
        {stages.filter((s) => !projectId || s.projectId === projectId).map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>

      <input type="hidden" name="lines" value={JSON.stringify(payload)} />
      <div className="flex flex-col gap-2">
        {lines.map((l, i) => (
          <div key={i} className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_4rem_6rem_7rem_2.5rem]">
            <input
              value={l.description} onChange={(e) => set(i, "description", e.target.value)}
              placeholder="Description — e.g. Cement 50kg" className={`${input} col-span-2 sm:col-span-1`} aria-label={`Line ${i + 1} description`}
            />
            <input
              value={l.qty} onChange={(e) => set(i, "qty", e.target.value)}
              inputMode="decimal" placeholder="Qty" className={input} aria-label={`Line ${i + 1} quantity`}
            />
            <input
              value={l.unitPrice} onChange={(e) => set(i, "unitPrice", e.target.value)}
              inputMode="decimal" placeholder="Rate (AED)" className={input} aria-label={`Line ${i + 1} rate`}
            />
            <select value={l.taxCode} onChange={(e) => set(i, "taxCode", e.target.value)} className={input} aria-label={`Line ${i + 1} tax`}>
              <option value="standard">VAT 5%</option>
              <option value="zero">Zero</option>
              <option value="exempt">Exempt</option>
              <option value="reverse">Reverse</option>
            </select>
            <button
              type="button" onClick={() => setLines((ls) => (ls.length > 1 ? ls.filter((_, j) => j !== i) : ls))}
              className="constra-btn-ghost px-2" aria-label={`Remove line ${i + 1}`}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => setLines((ls) => [...ls, { ...empty }])}
        className="constra-btn-ghost self-start">+ Add line</button>

      <div>
        <p className="mb-1 text-sm font-medium">Receipts / delivery notes <span className="font-normal text-slate-500">(drag & drop, images preview)</span></p>
        <FileUpload name="attachments" />
      </div>

      <div className="constra-card flex justify-between gap-4 bg-slate-50 p-3 text-sm dark:bg-slate-800/50">
        <span className="text-slate-500">Net {aed(totals.net)} + VAT {aed(totals.vat)}</span>
        <b>Total {aed(totals.gross)}</b>
      </div>

      {state?.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      {state?.warning && <p role="status" className="text-sm text-amber-700 dark:text-amber-300">{state.warning}</p>}
      <button disabled={pending} className="constra-btn-primary w-full py-2.5">
        {pending ? "Posting…" : `Post bill · ${aed(totals.gross)}`}
      </button>
    </form>
  );
}
