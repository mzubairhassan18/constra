"use client";

import { useState } from "react";
import { getBillDetailAction, type BillDetail } from "./actions";

const aed = (n: number) => `AED ${Number(n).toFixed(2)}`;

/** Printable supplier-bill invoice. Detail loads on open; Print uses print CSS. */
export function BillInvoice({ billId, label }: { billId: string; label: string }) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<BillDetail | null>(null);
  const [loading, setLoading] = useState(false);

  const show = async () => {
    setOpen(true);
    if (!detail && !loading) {
      setLoading(true);
      try {
        setDetail(await getBillDetailAction(billId));
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <>
      <button type="button" onClick={show} className="constra-btn-ghost whitespace-nowrap">
        🖨 {label}
      </button>
      {open && (
        <div
          className="no-print fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label={`Bill ${label}`}
          onClick={() => setOpen(false)}
        >
          <div
            className="constra-card max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {loading && <p className="text-sm text-slate-500">Loading invoice…</p>}
            {!loading && !detail && (
              <p className="text-sm text-red-600">Could not load this bill.</p>
            )}
            {detail && (
              <>
                <div className="print-area">
                  <header className="flex items-start justify-between border-b-2 border-slate-900 pb-3">
                    <div>
                      <p className="text-xl font-extrabold">Constra<span className="text-amber-500">.</span></p>
                      <p className="text-xs text-slate-500">Supplier bill · posted to ledger</p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-bold">{detail.invoiceNo ?? "(no invoice no.)"}</p>
                      <p className="text-slate-500">{detail.date}</p>
                    </div>
                  </header>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <p><span className="text-slate-500">Supplier:</span> <b>{detail.supplier ?? "—"}</b></p>
                    <p><span className="text-slate-500">Project:</span> <b>{detail.project ?? "—"}{detail.stage ? ` / ${detail.stage}` : ""}</b></p>
                  </div>
                  <table className="constra-table mt-3">
                    <thead>
                      <tr><th>Description</th><th className="text-right">Qty</th><th className="text-right">Rate</th><th className="text-right">VAT</th><th className="text-right">Line total</th></tr>
                    </thead>
                    <tbody>
                      {detail.lines.map((l, i) => (
                        <tr key={i}>
                          <td>{l.description ?? "—"} <span className="text-xs text-slate-500">({l.taxCode})</span></td>
                          <td className="text-right">{l.qty}</td>
                          <td className="text-right">{aed(l.unitPrice)}</td>
                          <td className="text-right">{aed(l.vat)}</td>
                          <td className="text-right"><b>{aed(l.net + l.vat)}</b></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-3 ml-auto w-56 text-sm">
                    <p className="flex justify-between"><span>Net</span><span>{aed(detail.net)}</span></p>
                    <p className="flex justify-between"><span>VAT in</span><span>{aed(detail.vatIn)}</span></p>
                    <p className="flex justify-between border-t pt-1 text-base font-extrabold"><span>Gross</span><span>{aed(detail.gross)}</span></p>
                  </div>
                  {detail.images.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-semibold">Attachments ({detail.images.length})</p>
                      <div className="mt-2 grid grid-cols-3 gap-2">
                        {detail.images.map((img) => (
                          <a key={img.id} href={`/api/photos?key=${encodeURIComponent(img.key)}`} target="_blank" rel="noreferrer"
                            className="constra-card overflow-hidden p-1 text-center">
                            {img.mime.startsWith("image/") ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={`/api/photos?key=${encodeURIComponent(img.key)}`} alt="Bill attachment"
                                className="h-24 w-full rounded object-cover" loading="lazy" />
                            ) : (
                              <span className="flex h-24 items-center justify-center text-2xl">📄</span>
                            )}
                            <span className="block truncate text-[11px] text-slate-500">{(img.size / 1024).toFixed(0)} KB</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="no-print mt-4 flex justify-end gap-2">
                  <button type="button" onClick={() => setOpen(false)} className="constra-btn-ghost">Close</button>
                  <button type="button" onClick={() => window.print()} className="constra-btn-primary">🖨 Print</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
