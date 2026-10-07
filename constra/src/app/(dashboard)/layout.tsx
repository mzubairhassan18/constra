import { getSessionUser } from "@/lib/session";
import { isClient, navFor } from "@/lib/access";
import { unreadCount } from "@/modules/notify/adapters/notify-neon";
import { AppShell } from "@/ui/app-shell";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (isClient(user)) redirect("/client");
  const unread = await unreadCount(user.id).catch(() => 0);
  return <AppShell nav={navFor(user, unread)}>{children}</AppShell>;
}
