import sql from "@/lib/db";
import type { UsersPort, UserRecord } from "../use-cases/login";

export const neonUsers: UsersPort = {
  async findByUsername(username: string): Promise<UserRecord | null> {
    const rows = await sql`
      SELECT u.id, u.username, u.display_name, u.password_hash,
             u.is_active, r.name AS role, r.permissions
      FROM users u JOIN roles r ON r.id = u.role_id
      WHERE u.username = ${username}
      LIMIT 1`;
    if (rows.length === 0) return null;
    const r = rows[0] as Record<string, unknown>;
    return {
      id: r.id as string,
      username: r.username as string,
      displayName: r.display_name as string,
      passwordHash: r.password_hash as string,
      role: r.role as UserRecord["role"],
      permissions: (r.permissions ?? []) as string[],
      isActive: r.is_active as boolean,
    };
  },
};
