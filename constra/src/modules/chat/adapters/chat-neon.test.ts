import { describe, expect, it } from "vitest";
import sql from "@/lib/db";
import { neonChat } from "./chat-neon";
import {
  getOrCreateDirect,
  listConversations,
  markRead,
  sendMessage,
} from "../use-cases/chat";

describe("chat port (neon)", () => {
  it("tracks unread via membership last_read_at", async () => {
    const suffix = `${Date.now()}`;
    let userA = "";
    let userB = "";
    let convId = "";
    try {
      const [a] = await sql`
        INSERT INTO users (username, password_hash, display_name)
        VALUES (${`__test_chat_a_${suffix}`}, 'x', 'chat a') RETURNING id`;
      const [b] = await sql`
        INSERT INTO users (username, password_hash, display_name)
        VALUES (${`__test_chat_b_${suffix}`}, 'x', 'chat b') RETURNING id`;
      userA = a.id as string;
      userB = b.id as string;

      const conv = await getOrCreateDirect(neonChat, userA, userB);
      convId = conv.id;

      const m1 = await sendMessage(neonChat, {
        conversationId: convId,
        senderId: userA,
        body: "hello one",
      });
      expect(m1.ok).toBe(true);
      const m2 = await sendMessage(neonChat, {
        conversationId: convId,
        senderId: userA,
        body: "hello two",
      });
      expect(m2.ok).toBe(true);

      const before = await listConversations(neonChat, userB);
      expect(before.find((c) => c.id === convId)?.unread).toBe(2);

      const read = await markRead(
        neonChat,
        convId,
        userB,
        new Date().toISOString(),
      );
      expect(read.advanced).toBe(true);

      const after = await listConversations(neonChat, userB);
      expect(after.find((c) => c.id === convId)?.unread).toBe(0);
    } finally {
      // FK-safe cleanup: messages -> memberships -> conversations -> users
      if (convId)
        await sql`DELETE FROM messages WHERE conversation_id = ${convId}`;
      if (convId)
        await sql`DELETE FROM memberships WHERE conversation_id = ${convId}`;
      if (convId)
        await sql`DELETE FROM conversations WHERE id = ${convId}`;
      if (userA) await sql`DELETE FROM users WHERE id = ${userA}`;
      if (userB) await sql`DELETE FROM users WHERE id = ${userB}`;
    }
  });
});
