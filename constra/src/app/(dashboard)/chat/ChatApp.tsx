"use client";

import { useCallback, useEffect, useState } from "react";

interface Conv {
  id: string;
  name: string | null;
  isGroup: boolean;
  lastMessageAt: string | null;
  unread: number;
}
interface Msg {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
}
interface Peer {
  id: string;
  name: string;
}

export default function ChatApp() {
  const [convs, setConvs] = useState<Conv[]>([]);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [me, setMe] = useState("");
  const [active, setActive] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");

  const loadList = useCallback(async () => {
    const r = await fetch("/api/chat");
    if (!r.ok) return;
    const j = await r.json();
    setConvs(j.conversations);
    setPeers(j.users);
    setMe(j.me);
  }, []);

  const loadMessages = useCallback(async (id: string) => {
    const r = await fetch(`/api/chat?conversationId=${id}`);
    if (!r.ok) return;
    const j = await r.json();
    setMessages(j.messages);
    setActive(id);
    void loadList();
  }, [loadList]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => {
      fetch(`/api/chat?conversationId=${active}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => j && setMessages(j.messages))
        .catch(() => {});
    }, 5000);
    return () => clearInterval(t);
  }, [active]);

  const startDirect = async (otherId: string) => {
    const r = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ op: "direct", otherId }),
    });
    if (r.ok) {
      const j = await r.json();
      await loadMessages(j.conversation.id);
    }
  };

  const send = async () => {
    if (!draft.trim() || !active) return;
    const r = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ op: "send", conversationId: active, body: draft }),
    });
    if (r.ok) {
      setDraft("");
      await loadMessages(active);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="flex flex-col gap-2">
        <h2 className="font-semibold">Chats</h2>
        {convs.map((c) => (
          <button
            key={c.id}
            onClick={() => loadMessages(c.id)}
            className={`rounded border p-2 text-left text-sm ${active === c.id ? "border-zinc-900 dark:border-zinc-100" : "border-zinc-200 dark:border-zinc-800"}`}
          >
            {c.name ?? "Direct chat"}{c.unread > 0 && <b> ({c.unread})</b>}
          </button>
        ))}
        <h2 className="mt-2 font-semibold">People</h2>
        {peers.map((p) => (
          <button key={p.id} onClick={() => startDirect(p.id)} className="rounded border border-zinc-200 p-2 text-left text-sm dark:border-zinc-800">
            {p.name}
          </button>
        ))}
      </div>
      <div className="col-span-2 flex flex-col gap-2">
        {!active && <p className="text-sm text-zinc-500">Pick a chat or a person.</p>}
        {active && (
          <>
            <div className="flex max-h-96 flex-col gap-1 overflow-y-auto rounded border border-zinc-200 p-3 dark:border-zinc-800">
              {messages.map((m) => (
                <p key={m.id} className={`text-sm ${m.senderId === me ? "text-right" : ""}`}>
                  {m.body}
                </p>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                maxLength={2000}
                placeholder="Message…"
                className="flex-1 rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              />
              <button onClick={send} className="rounded bg-zinc-900 px-3 py-2 text-white dark:bg-zinc-100 dark:text-zinc-900">
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
