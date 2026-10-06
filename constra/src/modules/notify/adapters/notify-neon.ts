import sql from "@/lib/db";
import {
  buildNotifications,
  type NotifyEvent,
  type RolesMap,
} from "../domain/notify";

export async function rolesMap(): Promise<RolesMap> {
  const rows = await sql`
    SELECT u.id, r.name AS role, r.permissions
    FROM users u JOIN roles r ON r.id = u.role_id WHERE u.is_active`;
  const map: RolesMap = {};
  for (const r of rows) {
    map[r.id as string] = {
      role: r.role as RolesMap[string]["role"],
      permissions: (r.permissions ?? []) as string[],
    };
  }
  return map;
}

/** Build drafts for an event and persist them. Never throws (notifications must not break actions). */
export async function fanout(event: NotifyEvent): Promise<number> {
  try {
    const drafts = buildNotifications(event, await rolesMap());
    for (const d of drafts) {
      await sql`
        INSERT INTO notifications (user_id, type, title, link)
        VALUES (${d.userId}, ${d.type}, ${d.title}, ${d.link})`;
    }
    return drafts.length;
  } catch {
    return 0;
  }
}

export async function unreadCount(userId: string): Promise<number> {
  const rows = await sql`
    SELECT count(*)::int AS n FROM notifications WHERE user_id = ${userId} AND NOT is_read`;
  return rows[0].n as number;
}

export async function listNotifications(userId: string, limit = 30): Promise<
  { id: string; type: string; title: string; link: string | null; isRead: boolean; at: string }[]
> {
  const rows = await sql`
    SELECT id, type, title, link, is_read, created_at FROM notifications
    WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT ${limit}`;
  return rows.map((r) => ({
    id: r.id as string,
    type: r.type as string,
    title: r.title as string,
    link: r.link as string | null,
    isRead: r.is_read as boolean,
    at: String(r.created_at),
  }));
}

export async function markAllRead(userId: string): Promise<void> {
  await sql`UPDATE notifications SET is_read = TRUE WHERE user_id = ${userId}`;
}
