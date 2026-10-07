import Link from "next/link";
import { requireAccess } from "@/lib/access";
import { listNotifications } from "@/modules/notify/adapters/notify-neon";
import { readAllAction } from "./actions";
import { Card } from "@/ui/cards";

const TYPE_LABEL: Record<string, string> = {
  bill_due: "💸 Bill due",
  bill_posted: "🧾 Bill posted",
  invoice_posted: "💰 Invoice issued",
  payment_received: "✅ Payment received",
  payment_overdue: "⚠️ Payment overdue",
  wager_due: "👷 Wages due",
  stage_completed: "🏗️ Stage completed",
  report_filed: "📋 Report filed",
  request_filed: "📦 Material request",
  request_decided: "📦 Request decided",
  assignment_moved: "🔀 Assignment",
  client_message: "💬 Client message",
};

export default async function NotificationsPage() {
  const user = await requireAccess();
  const notes = await listNotifications(user.id);
  const unread = notes.filter((n) => !n.isRead).length;
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-5 p-4 md:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
            <Link href="/dashboard" className="hover:underline">Home</Link> / Notifications
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Notification center {unread > 0 && <span className="constra-chip ml-1 bg-amber-100 text-amber-900">{unread} unread</span>}
          </h1>
          <p className="text-sm text-slate-500">Every item opens the exact update it refers to.</p>
        </div>
        {unread > 0 && (
          <form action={readAllAction}>
            <button className="constra-btn-ghost">Mark all read</button>
          </form>
        )}
      </header>
      <Card>
        <ul className="flex flex-col">
          {notes.map((n) => (
            <li
              key={n.id}
              className={`flex items-center justify-between gap-3 border-b border-slate-100 py-3 last:border-0 dark:border-slate-800 ${n.isRead ? "opacity-70" : ""}`}
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  {TYPE_LABEL[n.type] ?? `🔔 ${n.type.replace(/_/g, " ")}`}
                </p>
                <p className={`truncate text-sm ${n.isRead ? "" : "font-bold"}`}>{n.title}</p>
                <p className="text-xs text-slate-400">{new Date(n.at).toLocaleString("en-AE")}</p>
              </div>
              {n.link ? (
                <Link href={n.link} className="constra-btn-ghost shrink-0 whitespace-nowrap">
                  Open →
                </Link>
              ) : (
                <span className="constra-chip shrink-0">info</span>
              )}
            </li>
          ))}
          {notes.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-500">
              All caught up. Site reports, bills, invoices and decisions will appear here.
            </p>
          )}
        </ul>
      </Card>
    </main>
  );
}
