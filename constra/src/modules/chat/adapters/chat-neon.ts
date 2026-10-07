import sql from "@/lib/db";
import type {
  ChatPort,
  ConversationRow,
  ConversationSummary,
  MessageRow,
} from "../use-cases/chat";

const toConv = (r: Record<string, unknown>): ConversationRow => ({
  id: r.id as string,
  name: (r.name as string | null) ?? null,
  isGroup: r.is_group as boolean,
  createdAt: String(r.created_at),
});

const toMsg = (r: Record<string, unknown>): MessageRow => ({
  id: r.id as string,
  conversationId: r.conversation_id as string,
  senderId: r.sender_id as string,
  body: r.body as string,
  createdAt: String(r.created_at),
});

export const neonChat: ChatPort = {
  async findDirect(a, b) {
    const rows = await sql`
      SELECT c.* FROM conversations c
      JOIN memberships m1 ON m1.conversation_id = c.id AND m1.user_id = ${a}
      JOIN memberships m2 ON m2.conversation_id = c.id AND m2.user_id = ${b}
      WHERE c.is_group = FALSE
        AND NOT EXISTS (
          SELECT 1 FROM memberships m3
          WHERE m3.conversation_id = c.id AND m3.user_id NOT IN (${a}, ${b})
        ) LIMIT 1`;
    return rows.length === 0 ? null : toConv(rows[0]);
  },
  async createConversation(input) {
    const c = await sql`
      INSERT INTO conversations (name, is_group)
      VALUES (${input.name}, ${input.isGroup}) RETURNING *`;
    for (const userId of input.memberIds) {
      await sql`
        INSERT INTO memberships (conversation_id, user_id)
        VALUES (${c[0].id as string}, ${userId})
        ON CONFLICT (conversation_id, user_id) DO NOTHING`;
    }
    return toConv(c[0]);
  },
  async insertMessage(input) {
    const rows = await sql`
      INSERT INTO messages (conversation_id, sender_id, body)
      VALUES (${input.conversationId}, ${input.senderId}, ${input.body})
      RETURNING *`;
    return toMsg(rows[0]);
  },
  async getLastRead(conversationId, userId) {
    const rows = await sql`
      SELECT last_read_at FROM memberships
      WHERE conversation_id = ${conversationId} AND user_id = ${userId}`;
    if (rows.length === 0 || rows[0].last_read_at == null) return null;
    return String(rows[0].last_read_at);
  },
  async setLastRead(conversationId, userId, at) {
    // GREATEST with now(): messages.created_at is stamped by the DB clock, so
    // storing the caller's app-clock value would leave last_read_at behind it
    // whenever the app clock lags the DB — and unread would never clear.
    // The caller's `at` still wins when it is ahead (backfills, tests).
    await sql`
      UPDATE memberships SET last_read_at = GREATEST(${at}::timestamptz, now())
      WHERE conversation_id = ${conversationId} AND user_id = ${userId}`;
  },
  async listMemberConversations(userId) {
    const rows = await sql`
      SELECT c.id, c.name, c.is_group,
        (SELECT max(m.created_at) FROM messages m WHERE m.conversation_id = c.id) AS last_at,
        (SELECT count(*)::int FROM messages m
         WHERE m.conversation_id = c.id
           AND (mem.last_read_at IS NULL OR m.created_at > mem.last_read_at)) AS unread
      FROM conversations c JOIN memberships mem
        ON mem.conversation_id = c.id AND mem.user_id = ${userId}
      ORDER BY last_at DESC NULLS LAST`;
    return rows.map(
      (r): ConversationSummary => ({
        id: r.id as string,
        name: (r.name as string | null) ?? null,
        isGroup: r.is_group as boolean,
        lastMessageAt: r.last_at ? String(r.last_at) : null,
        unread: r.unread as number,
      }),
    );
  },
  async listMessages(conversationId) {
    const rows = await sql`
      SELECT * FROM messages WHERE conversation_id = ${conversationId}
      ORDER BY created_at LIMIT 200`;
    return rows.map(toMsg);
  },
};
