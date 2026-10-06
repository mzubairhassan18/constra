import { getSessionUser } from "@/lib/session";
import { neonChat } from "@/modules/chat/adapters/chat-neon";
import {
  getOrCreateDirect,
  listConversations,
  markRead,
  sendMessage,
} from "@/modules/chat/use-cases/chat";
import { neonChat as port } from "@/modules/chat/adapters/chat-neon";
import sql from "@/lib/db";

async function myId(): Promise<string | null> {
  const s = await getSessionUser();
  return s?.id ?? null;
}

export async function GET(request: Request) {
  const uid = await myId();
  if (!uid) return Response.json({ error: "unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  const conversationId = url.searchParams.get("conversationId");
  if (conversationId) {
    const messages = await port.listMessages(conversationId);
    await markRead(neonChat, conversationId, uid, new Date().toISOString());
    return Response.json({ messages });
  }
  const conversations = await listConversations(neonChat, uid);
  const users = await sql`
    SELECT u.id, u.display_name FROM users u WHERE u.is_active AND u.id <> ${uid}
    ORDER BY u.display_name LIMIT 50`;
  return Response.json({
    conversations,
    users: users.map((u) => ({ id: u.id as string, name: u.display_name as string })),
    me: uid,
  });
}

export async function POST(request: Request) {
  const uid = await myId();
  if (!uid) return Response.json({ error: "unauthorized" }, { status: 401 });
  const body = (await request.json()) as {
    op: "direct" | "send" | "read";
    otherId?: string;
    conversationId?: string;
    body?: string;
  };
  if (body.op === "direct" && body.otherId) {
    const conversation = await getOrCreateDirect(neonChat, uid, body.otherId);
    return Response.json({ conversation });
  }
  if (body.op === "send" && body.conversationId) {
    const res = await sendMessage(neonChat, {
      conversationId: body.conversationId,
      senderId: uid,
      body: body.body ?? "",
    });
    if (!res.ok) return Response.json({ error: res.error }, { status: 400 });
    return Response.json({ message: res.message });
  }
  if (body.op === "read" && body.conversationId) {
    await markRead(neonChat, body.conversationId, uid, new Date().toISOString());
    return Response.json({ ok: true });
  }
  return Response.json({ error: "bad op" }, { status: 400 });
}
