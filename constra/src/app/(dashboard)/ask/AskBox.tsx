"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AskBox() {
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const ask = async () => {
    if (!q.trim() || busy) return;
    setBusy(true);
    try {
      const r = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q }),
      });
      const j = await r.json();
      setAnswer(j.answer ?? "No answer.");
      if (j.ui_action?.screen) router.push(j.ui_action.screen);
    } catch {
      setAnswer("Failed to ask.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="font-semibold">Ask Constra AI</h2>
      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask()}
          maxLength={500}
          placeholder="upcoming dues? stage costs? survival forecast?"
          className="flex-1 rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          onClick={ask}
          disabled={busy}
          className="rounded bg-zinc-900 px-3 py-2 text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {busy ? "…" : "Ask"}
        </button>
      </div>
      {answer && <p className="text-sm">{answer}</p>}
    </div>
  );
}
