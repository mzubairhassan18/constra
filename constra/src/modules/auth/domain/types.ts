// Pure domain types — no framework imports.
export type RoleName =
  | "super_admin"
  | "admin"
  | "foreman"
  | "accountant"
  | "client";

export interface SessionUser {
  id: string;
  username: string;
  displayName: string;
  role: RoleName;
  permissions: string[];
}

/** "module.action" match; "*" and "module.*" wildcards supported. */
export function can(permissions: string[], required: string): boolean {
  if (permissions.includes("*")) return true;
  if (permissions.includes(required)) return true;
  const [mod] = required.split(".");
  return permissions.includes(`${mod}.*`);
}
