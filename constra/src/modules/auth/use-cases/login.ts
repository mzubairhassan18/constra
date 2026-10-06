import { compare } from "bcryptjs";
import type { SessionUser } from "../domain/types";

export interface UserRecord {
  id: string;
  username: string;
  displayName: string;
  passwordHash: string;
  role: SessionUser["role"];
  permissions: string[];
  isActive: boolean;
}

export interface UsersPort {
  findByUsername(username: string): Promise<UserRecord | null>;
}

export type LoginResult =
  | { ok: true; user: SessionUser }
  | { ok: false; error: "invalid_credentials" | "inactive" };

export async function login(
  port: UsersPort,
  username: string,
  password: string,
): Promise<LoginResult> {
  const record = await port.findByUsername(username.trim().toLowerCase());
  if (!record) return { ok: false, error: "invalid_credentials" };
  if (!record.isActive) return { ok: false, error: "inactive" };
  const match = await compare(password, record.passwordHash);
  if (!match) return { ok: false, error: "invalid_credentials" };
  const { passwordHash: _omit, ...user } = record;
  return { ok: true, user };
}
