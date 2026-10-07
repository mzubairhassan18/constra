import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { listNotifications } from "@/modules/notify/adapters/notify-neon";
import { readAllAction } from "./actions";

export default async function NotificationsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const notes = await listNotifications(user.id);
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <span className="flex gap-3">
          <form action={readAllAction}>
            <button className="text-sm underline">Mark all read</button>
          </form>
          <Link href="/dashboard" className="text-sm underline">Dashboard</Link>
        </span>
      </header>
      <ul className="flex flex-col gap-2 text-sm">
        {notes.map((n) => (
          <li key={n.id} className={`rounded border p-3 ${n.isRead ? "border-zinc-200 text-zinc-500 dark:border-zinc-800" : "border-zinc-900 dark:border-zinc-100"}`}>
            <p>{n.title}</p>
            {n.link && <Link href={n.link} className="underline">{n.link}</Link>}
          </li>
        ))}
        {notes.length === 0 && <p className="text-sm text-zinc-500">All caught up.</p>}
      </ul>
    </main>
  );
}
