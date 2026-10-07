import { redirect } from "next/navigation";
import { can, type SessionUser } from "@/modules/auth/domain/types";
import { getSessionUser } from "./session";

export interface NavItem {
  href: string;
  label: string;
  icon: string;
  /** Required permission ("module.read" style; wildcards honored). Omit = any staff. */
  perm?: string;
  /** Super-admin only. */
  superAdmin?: boolean;
}

const BASE_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/projects", label: "Projects", icon: "🏗️", perm: "projects.read" },
  { href: "/hr", label: "HR", icon: "👷", perm: "hr.read" },
  { href: "/bills", label: "Bills", icon: "🧾", perm: "bills.read" },
  { href: "/finance", label: "Finance", icon: "💰", perm: "finance.read" },
  { href: "/operations", label: "Operations", icon: "🚚", perm: "operations.read" },
  { href: "/fleet", label: "Fleet", icon: "🚛", perm: "fleet.read" },
  { href: "/masters", label: "Masters", icon: "📚", perm: "masters.read" },
  { href: "/chat", label: "Team chat", icon: "💬", perm: "chat.read" },
  { href: "/ask", label: "AI ask", icon: "🤖" },
  { href: "/users", label: "Users", icon: "👥", superAdmin: true },
];

/** Clients live in /client, not the staff shell. */
export function isClient(user: SessionUser): boolean {
  return user.role === "client";
}

/** Landing page per role (used after login and by guards). */
export function homeFor(user: SessionUser): string {
  switch (user.role) {
    case "client":
      return "/client";
    case "accountant":
      return "/finance";
    case "foreman":
      return "/operations";
    case "hr":
      return "/hr";
    default:
      return "/dashboard";
  }
}

/** Sidebar items this user may see (+ notifications with unread badge). */
export function navFor(user: SessionUser, unread: number): (NavItem & { badge?: number })[] {
  if (isClient(user)) return [];
  const items = BASE_NAV.filter((n) => {
    if (n.superAdmin) return user.role === "super_admin";
    if (n.perm) return can(user.permissions, n.perm);
    return true; // Dashboard + AI ask: any staff
  });
  return [
    ...items,
    {
      href: "/notifications",
      label: "Notifications",
      icon: "🔔",
      ...(unread > 0 ? { badge: unread } : {}),
    },
  ];
}

/**
 * Page guard: must be signed in; clients stay in /client;
 * otherwise the required permission (or redirect home).
 */
export async function requireAccess(perm?: string): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (isClient(user)) redirect("/client");
  if (perm && !can(user.permissions, perm)) redirect(homeFor(user));
  return user;
}
