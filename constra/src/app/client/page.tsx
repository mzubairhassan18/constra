import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { homeFor } from "@/lib/access";
import { logoutAction } from "@/app/(auth)/login/actions";
import {
  listMessages,
  myProjects,
  projectDues,
  projectPhotos,
  projectStages,
  projectUpdates,
} from "@/modules/client/adapters/client-neon";
import { Card } from "@/ui/cards";
import { DataTable } from "@/ui/data-table";
import { MessageForm } from "./MessageForm";

const aed = (n: number) =>
  `AED ${n.toLocaleString("en-AE", { maximumFractionDigits: 0 })}`;

export default async function ClientPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const isStaff = user.role === "super_admin" || user.role === "admin";
  if (!isStaff && user.role !== "client") redirect(homeFor(user));

  const projects = await myProjects(isStaff ? null : user.id);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-[#0a0f1c]/95">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <p className="text-xl font-extrabold tracking-tight">
            Constra<span className="text-amber-500">.</span>
            <span className="ml-2 text-sm font-medium text-slate-500">Client portal</span>
          </p>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-slate-500 sm:inline">{user.displayName}</span>
            <form action={logoutAction}>
              <button type="submit" className="constra-btn-ghost">Sign out</button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-5 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            {isStaff ? "Client workspace (all linked projects)" : `Welcome, ${user.displayName} 👋`}
          </h1>
          <p className="text-sm text-slate-500">
            {isStaff
              ? "Every project linked to a client login, with dues, updates and message threads."
              : "Your live progress, upcoming payments, site updates and a direct line to us."}
          </p>
        </div>

        {projects.length === 0 && (
          <Card title="No linked projects yet">
            <p className="text-sm text-slate-500">
              {isStaff
                ? "Link a client login on the project page to activate their workspace."
                : "Your contractor has not linked your login to a project yet — please ask them to connect it."}
            </p>
          </Card>
        )}

        {await Promise.all(
          projects.map(async (p) => {
            const [dues, stages, updates, photos, messages] = await Promise.all([
              projectDues(p.id),
              projectStages(p.id),
              projectUpdates(p.id),
              projectPhotos(p.id),
              listMessages(p.id),
            ]);
            return (
              <Card
                key={p.id}
                title={`${p.name} — ${p.progressPct}%`}
                subtitle={[p.location, p.status].filter(Boolean).join(" · ")}
                action={
                  p.nextDue > 0 ? (
                    <span className="constra-chip bg-amber-100 text-amber-900">{aed(p.nextDue)} due</span>
                  ) : (
                    <span className="constra-chip bg-emerald-100 text-emerald-800">paid up ✓</span>
                  )
                }
              >
                <div className="mb-4 h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300"
                    style={{ width: `${p.progressPct}%` }}
                  />
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <section>
                    <h3 className="mb-1 text-sm font-bold">Stage timeline</h3>
                    <ul className="flex flex-col gap-1 text-sm">
                      {stages.map((s) => (
                        <li key={s.name} className="flex items-center gap-2">
                          <span aria-hidden>{s.status === "completed" ? "✅" : s.status === "in_progress" ? "🔨" : "⬜"}</span>
                          <span className="font-medium">{s.name}</span>
                          <span className="text-xs text-slate-500">{s.status.replace("_", " ")}</span>
                        </li>
                      ))}
                      {stages.length === 0 && <li className="text-slate-500">No stages yet.</li>}
                    </ul>
                    {photos.length > 0 && (
                      <div className="mt-3 grid grid-cols-4 gap-1.5">
                        {photos.map((k) => (
                          <a key={k} href={`/api/photos?key=${encodeURIComponent(k)}`} target="_blank" rel="noreferrer"
                            className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={`/api/photos?key=${encodeURIComponent(k)}`} alt="Site photo"
                              className="h-16 w-full object-cover transition-transform hover:scale-105" loading="lazy" />
                          </a>
                        ))}
                      </div>
                    )}
                  </section>

                  <section>
                    <h3 className="mb-1 text-sm font-bold">Payments</h3>
                    <DataTable
                      columns={[
                        { key: "no", header: "Invoice", render: (d: (typeof dues)[number]) => <b>{d.invoiceNo ?? "—"}</b> },
                        { key: "tot", header: "Total", align: "right", render: (d) => aed(d.gross) },
                        { key: "due", header: "Due", align: "right", render: (d) => <b className={d.due > 0 ? "text-amber-700" : "text-emerald-600"}>{aed(d.due)}</b> },
                      ]}
                      rows={dues}
                      empty="No invoices yet."
                    />
                    <h3 className="mt-3 mb-1 text-sm font-bold">Latest site updates</h3>
                    <ul className="flex flex-col gap-2 text-sm">
                      {updates.map((u, i) => (
                        <li key={i} className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800/60">
                          <p className="text-xs font-semibold text-slate-500">{u.date}</p>
                          <p>{u.workDone}</p>
                          {u.delays && <p className="text-red-600">Delays: {u.delays}</p>}
                        </li>
                      ))}
                      {updates.length === 0 && <li className="text-slate-500">No updates yet.</li>}
                    </ul>
                  </section>
                </div>

                <section className="mt-4 border-t border-slate-200 pt-3 dark:border-slate-700">
                  <h3 className="mb-2 text-sm font-bold">Messages with the company</h3>
                  <ul className="mb-3 flex max-h-64 flex-col gap-2 overflow-y-auto">
                    {messages.map((m) => (
                      <li
                        key={m.id}
                        className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                          m.authorId === user.id
                            ? "self-end bg-[#0f2340] text-white"
                            : "self-start bg-slate-100 dark:bg-slate-800"
                        }`}
                      >
                        <p className="text-[11px] font-semibold opacity-70">{m.author}</p>
                        <p>{m.body}</p>
                      </li>
                    ))}
                    {messages.length === 0 && (
                      <li className="text-sm text-slate-500">No messages yet — say hello below.</li>
                    )}
                  </ul>
                  <MessageForm projectId={p.id} compact />
                </section>
              </Card>
            );
          }),
        )}
      </main>
    </div>
  );
}
