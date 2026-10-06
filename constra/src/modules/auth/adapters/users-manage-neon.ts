import sql from "@/lib/db";

export interface ManagedUser {
  id: string;
  username: string;
  displayName: string;
  email: string | null;
  roleId: string | null;
  roleName: string | null;
  isActive: boolean;
}

export async function listManagedUsers(): Promise<ManagedUser[]> {
  const rows = await sql`
    SELECT u.id, u.username, u.display_name, u.email, u.role_id, r.name AS role_name, u.is_active
    FROM users u LEFT JOIN roles r ON r.id = u.role_id ORDER BY u.display_name`;
  return rows.map((r) => ({
    id: r.id as string,
    username: r.username as string,
    displayName: r.display_name as string,
    email: r.email as string | null,
    roleId: (r.role_id as string | null) ?? null,
    roleName: (r.role_name as string | null) ?? null,
    isActive: r.is_active as boolean,
  }));
}

export async function listRoles(): Promise<{ id: string; name: string }[]> {
  const rows = await sql`SELECT id, name FROM roles ORDER BY name`;
  return rows.map((r) => ({ id: r.id as string, name: r.name as string }));
}

export async function setUserRole(userId: string, roleId: string): Promise<void> {
  await sql`UPDATE users SET role_id = ${roleId} WHERE id = ${userId}`;
}

export async function setUserActive(userId: string, active: boolean): Promise<void> {
  await sql`UPDATE users SET is_active = ${active} WHERE id = ${userId}`;
}

export async function resetUserPassword(userId: string, hash: string): Promise<void> {
  await sql`UPDATE users SET password_hash = ${hash} WHERE id = ${userId}`;
}

export async function createUser(input: {
  username: string;
  displayName: string;
  email?: string;
  roleId: string;
  hash: string;
}): Promise<string> {
  const rows = await sql`
    INSERT INTO users (username, display_name, email, role_id, password_hash)
    VALUES (${input.username}, ${input.displayName}, ${input.email ?? null}, ${input.roleId}, ${input.hash})
    RETURNING id`;
  return rows[0].id as string;
}
