import { describe, expect, it } from "vitest";
import {
  getOrCreateDirect,
  listConversations,
  markRead,
  sendMessage,
  type ChatPort,
  type ConversationRow,
  type MessageRow,
} from "./chat";

function makeFakePort(): ChatPort & {
  created: number;
  inserted: MessageRow[];
  reads: Map<string, string | null>;
} {
  const convs = new Map<string, ConversationRow>();
  const keyOf = (a: string, b: string) =>
    [a, b].sort().join(":");
  const state = {
    created: 0,
    inserted: [] as MessageRow[],
    reads: new Map<string, string | null>(),
  };
  const port: ChatPort & typeof state = {
    ...state,
    async findDirect(a: string, b: string) {
      return convs.get(keyOf(a, b)) ?? null;
    },
    async createConversation(input: {
      name: string | null;
      isGroup: boolean;
      memberIds: string[];
    }) {
      state.created += 1;
      const [m1, m2] = [...input.memberIds].sort();
      const row: ConversationRow = {
        id: `conv-${state.created}`,
        name: input.name,
        isGroup: input.isGroup,
        createdAt: new Date().toISOString(),
      };
      if (!input.isGroup) convs.set(keyOf(m1, m2), row);
      for (const m of input.memberIds)
        state.reads.set(`${row.id}:${m}`, null);
      port.created = state.created;
      port.inserted = state.inserted;
      return row;
    },
    async insertMessage(input: {
      conversationId: string;
      senderId: string;
      body: string;
    }) {
      const msg: MessageRow = {
        id: `msg-${state.inserted.length + 1}`,
        conversationId: input.conversationId,
        senderId: input.senderId,
        body: input.body,
        createdAt: new Date().toISOString(),
      };
      state.inserted.push(msg);
      port.inserted = state.inserted;
      return msg;
    },
    async getLastRead(conversationId: string, userId: string): Promise<string | null> {
      return state.reads.get(`${conversationId}:${userId}`) ?? null;
    },
    async setLastRead(conversationId: string, userId: string, at: string) {
      state.reads.set(`${conversationId}:${userId}`, at);
    },
    async listMemberConversations() {
      return [];
    },
    async listMessages() {
      return [];
    },
  };
  return port;
}

describe("sendMessage", () => {
  it("rejects blank body without inserting", async () => {
    const port = makeFakePort();
    const res = await sendMessage(port, {
      conversationId: "c1",
      senderId: "u1",
      body: "   ",
    });
    expect(res).toEqual({ ok: false, error: "empty" });
    expect(port.inserted).toHaveLength(0);
  });
  it("rejects oversize body without inserting", async () => {
    const port = makeFakePort();
    const res = await sendMessage(port, {
      conversationId: "c1",
      senderId: "u1",
      body: "x".repeat(2001),
    });
    expect(res).toEqual({ ok: false, error: "too_long" });
    expect(port.inserted).toHaveLength(0);
  });
});

describe("getOrCreateDirect", () => {
  it("returns the existing conversation for the same pair (either order)", async () => {
    const port = makeFakePort();
    const first = await getOrCreateDirect(port, "u1", "u2");
    const second = await getOrCreateDirect(port, "u2", "u1");
    expect(second.id).toBe(first.id);
    expect(port.created).toBe(1);
  });
});

describe("markRead", () => {
  it("advances last_read_at only forward", async () => {
    const port = makeFakePort();
    const conv = await getOrCreateDirect(port, "u1", "u2");
    const t1 = "2026-01-01T00:00:00.000Z";
    const t0 = "2025-01-01T00:00:00.000Z";

    const fwd = await markRead(port, conv.id, "u2", t1);
    expect(fwd.advanced).toBe(true);
    expect(await port.getLastRead(conv.id, "u2")).toBe(t1);

    const back = await markRead(port, conv.id, "u2", t0);
    expect(back.advanced).toBe(false);
    expect(await port.getLastRead(conv.id, "u2")).toBe(t1);
  });
});

describe("listConversations", () => {
  it("orders by latest message, newest first", async () => {
    const port = makeFakePort();
    port.listMemberConversations = async () => [
      { id: "old", name: null, isGroup: false, lastMessageAt: "2026-01-01T00:00:00.000Z", unread: 0 },
      { id: "new", name: null, isGroup: false, lastMessageAt: "2026-03-01T00:00:00.000Z", unread: 1 },
      { id: "mid", name: null, isGroup: false, lastMessageAt: "2026-02-01T00:00:00.000Z", unread: 0 },
    ];
    const rows = await listConversations(port, "u1");
    expect(rows.map((r) => r.id)).toEqual(["new", "mid", "old"]);
  });
});
