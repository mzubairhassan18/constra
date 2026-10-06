import { validateBody } from "../domain/chat";

export interface ConversationRow {
  id: string;
  name: string | null;
  isGroup: boolean;
  createdAt: string;
}

export interface MessageRow {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
}

export interface ConversationSummary {
  id: string;
  name: string | null;
  isGroup: boolean;
  lastMessageAt: string | null;
  unread: number;
}

export interface ChatPort {
  findDirect(a: string, b: string): Promise<ConversationRow | null>;
  createConversation(input: {
    name: string | null;
    isGroup: boolean;
    memberIds: string[];
  }): Promise<ConversationRow>;
  insertMessage(input: {
    conversationId: string;
    senderId: string;
    body: string;
  }): Promise<MessageRow>;
  getLastRead(conversationId: string, userId: string): Promise<string | null>;
  setLastRead(conversationId: string, userId: string, at: string): Promise<void>;
  listMemberConversations(userId: string): Promise<ConversationSummary[]>;
  listMessages(conversationId: string): Promise<MessageRow[]>;
}

export async function sendMessage(
  port: ChatPort,
  input: { conversationId: string; senderId: string; body: string },
): Promise<{ ok: true; message: MessageRow } | { ok: false; error: "empty" | "too_long" }> {
  const v = validateBody(input.body);
  if (!v.ok) return { ok: false, error: v.error };
  const message = await port.insertMessage({
    conversationId: input.conversationId,
    senderId: input.senderId,
    body: input.body,
  });
  return { ok: true, message };
}

export async function getOrCreateDirect(
  port: ChatPort,
  a: string,
  b: string,
): Promise<ConversationRow> {
  const existing = await port.findDirect(a, b);
  if (existing) return existing;
  return port.createConversation({ name: null, isGroup: false, memberIds: [a, b] });
}

export async function markRead(
  port: ChatPort,
  conversationId: string,
  userId: string,
  at: string,
): Promise<{ at: string; advanced: boolean }> {
  const prev = await port.getLastRead(conversationId, userId);
  if (prev !== null && prev >= at) return { at: prev, advanced: false };
  await port.setLastRead(conversationId, userId, at);
  return { at, advanced: true };
}

export async function listConversations(
  port: ChatPort,
  userId: string,
): Promise<ConversationSummary[]> {
  const rows = await port.listMemberConversations(userId);
  return [...rows].sort((x, y) =>
    (y.lastMessageAt ?? "").localeCompare(x.lastMessageAt ?? ""),
  );
}
