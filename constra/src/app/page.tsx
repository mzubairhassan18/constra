import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Construction Site Management ERP for UAE Contractors",
  description:
    "Track villa and tower projects stage-by-stage, manage permanent & daily-wage labour, post supplier bills with UAE 5% VAT, keep a balanced double-entry ledger, run site operations, and share a live client portal — with AI answers on top.",
  alternates: { canonical: "/" },
};

const FEATURES = [
  {
    icon: "🏗️",
    title: "Projects & stages",
    body: "Villa or tower, every project breaks into ordered stages with budget, BOQ revenue, activities, milestones, risks and equipment — and completing a stage auto-opens the next.",
  },
  {
    icon: "👷",
    title: "HR, attendance & payroll",
    body: "Permanent staff and daily wagers, assignments per stage, time-in/out, overtime and monthly payroll with bonuses and deductions — labour cost lands on the right stage automatically.",
  },
  {
    icon: "🧾",
    title: "Bills with UAE VAT",
    body: "Supplier bills with line items, transport, discount and 5% VAT-in. Every posting is balanced double-entry with reversal — never a silent edit.",
  },
  {
    icon: "💰",
    title: "Finance that balances",
    body: "Client invoices, receipts, trial balance, P&L, balance sheet and VAT position from the same ledger RPCs. Dr always equals Cr — or it tells you.",
  },
  {
    icon: "🚚",
    title: "Site operations",
    body: "Daily manpower, foreman reporting with site photos, material requests, rentals, tool issuance and transport — the five actions a foreman needs on mobile.",
  },
  {
    icon: "💬",
    title: "Team chat & notifications",
    body: "Direct and group chats with unread counts, plus notifications for stage completion, bill dues, expiring visas and VAT deadlines.",
  },
  {
    icon: "🔗",
    title: "Client portal",
    body: "Magic-link portal per project: progress, timeline, photos and invoices — redacted so internal payroll and supplier rates never leak.",
  },
  {
    icon: "🤖",
    title: "AI ask",
    body: "Ask “upcoming dues?” or “survival forecast?” and get an answer with charts and deep links — the LLM only calls audited read-only tools, never raw SQL.",
  },
];

const ROLES = [
  { name: "Owner / Admin", desc: "Full control: users, ledger, periods, portal links.", cta: "Open dashboard" },
  { name: "Accountant", desc: "Bills, invoices, receipts, VAT and statements.", cta: "See finance" },
  { name: "Foreman", desc: "Attendance, daily reports, manpower, material requests — mobile-first.", cta: "See operations" },
  { name: "Client", desc: "Read-only portal: progress, photos, invoices and next payment due.", cta: "Client portal" },
];

const STEPS = [
  { n: "1", t: "Create the project", d: "Header, stages, BOQ and budget in minutes." },
  { n: "2", t: "Run the site", d: "Attendance, reports, bills and manpower flow in daily." },
  { n: "3", t: "Close the books", d: "Invoices, receipts, VAT and statements stay balanced." },
  { n: "4", t: "Share progress", d: "Send the client a live portal link — no login needed." },
];

const FAQS = [
  {
    q: "Is my accounting really double-entry?",
    a: "Yes. Every money event posts through one balanced entry function with reversal instead of edits. Trial balance, P&L, balance sheet and VAT all read the same ledger.",
  },
  {
    q: "How does UAE VAT work?",
    a: "Supplier bills carry VAT-in, client invoices carry VAT-out at 5% (zero/exempt/reverse supported). The VAT card shows net payable per period.",
  },
  {
    q: "Can foremen use it on phones?",
    a: "Yes — the app shell is mobile-responsive with large touch targets, offline-tolerant forms, photo capture and text-size controls.",
  },
  {
    q: "What does the client see?",
    a: "Only what you enable: progress %, stage timeline, site photos and invoices. Internal costs and payroll stay hidden.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-[#0a0f1c]/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <p className="text-xl font-extrabold tracking-tight">
            Constra<span className="text-amber-500">.</span>
          </p>
          <nav className="hidden items-center gap-6 text-sm font-medium md:flex" aria-label="Primary">
            <a href="#features" className="hover:underline">Features</a>
            <a href="#roles" className="hover:underline">Roles</a>
            <a href="#how" className="hover:underline">How it works</a>
            <a href="#faq" className="hover:underline">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="constra-btn-ghost">
              Sign in
            </Link>
            <Link href="/signup" className="constra-btn-primary">
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-[#0f2340] text-white">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
            <div>
              <p className="constra-chip mb-4 border-white/20 bg-white/10 text-amber-300">
                Built for UAE contractors
              </p>
              <h1 className="text-4xl leading-tight font-extrabold tracking-tight md:text-5xl">
                Run every villa project from foundation to handover — without the spreadsheets.
              </h1>
              <p className="mt-4 max-w-lg text-lg text-slate-300">
                Projects & stages, labour & payroll, supplier bills with 5% VAT,
                a balanced ledger, site operations, fleet, team chat, client
                portal and AI answers. One app, mobile-ready, SEO-fast.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/signup" className="constra-btn-accent">
                  Start free → See the dashboard
                </Link>
                <Link
                  href="/login"
                  className="rounded-lg border border-white/30 px-4 py-2.5 text-sm font-semibold hover:bg-white/10"
                >
                  Sign in
                </Link>
              </div>
              <dl className="mt-8 grid max-w-md grid-cols-3 gap-4 text-center">
                {[
                  ["103", "use cases"],
                  ["5%", "UAE VAT"],
                  ["24/7", "portal"],
                ].map(([v, l]) => (
                  <div key={l} className="rounded-xl bg-white/10 p-3">
                    <dt className="text-2xl font-extrabold text-amber-300">{v}</dt>
                    <dd className="text-xs text-slate-300">{l}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="constra-card p-5 text-slate-900 dark:text-slate-100" aria-label="Live preview">
              <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                Live snapshot · Marina Villa
              </p>
              <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                {[
                  ["AED 1.2M", "Agreement"],
                  ["62%", "Complete"],
                  ["AED 84K", "Due"],
                ].map(([v, l]) => (
                  <div key={l} className="rounded-lg bg-slate-100 p-3 dark:bg-slate-800">
                    <p className="text-lg font-extrabold">{v}</p>
                    <p className="text-xs text-slate-500">{l}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3">
                {[
                  ["Foundation", 100],
                  ["Structure", 72],
                  ["MEP", 35],
                  ["Finishing", 8],
                ].map(([s, p]) => (
                  <div key={s as string} className="mb-2">
                    <div className="mb-1 flex justify-between text-xs font-medium">
                      <span>{s}</span>
                      <span>{p}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <div
                        className="h-full rounded-full bg-amber-500"
                        style={{ width: `${p}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/login" className="constra-btn-primary mt-3 block text-center">
                Open the live app →
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-3xl font-extrabold tracking-tight">
            Everything a site needs, in one place
          </h2>
          <p className="mt-2 max-w-2xl text-slate-500">
            Rebuilt from a 103-use-case Laravel reference app — every workflow
            from foreman reporting to VAT filing has a home.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <article key={f.title} className="constra-card p-5">
                <p className="text-2xl" aria-hidden>{f.icon}</p>
                <h3 className="mt-2 font-bold">{f.title}</h3>
                <p className="mt-1 text-sm text-slate-500">{f.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Roles */}
        <section id="roles" className="border-y border-slate-200 bg-white dark:border-slate-800 dark:bg-[#111a2e]">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <h2 className="text-3xl font-extrabold tracking-tight">
              One login for every role
            </h2>
            <p className="mt-2 text-slate-500">
              Sign in once — the sidebar, permissions and landing adapt to who you are.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {ROLES.map((r) => (
                <article key={r.name} className="constra-card p-5">
                  <h3 className="font-bold">{r.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">{r.desc}</p>
                  <Link href="/login" className="mt-3 inline-block text-sm font-semibold text-amber-600 hover:underline">
                    {r.cta} →
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* How */}
        <section id="how" className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-3xl font-extrabold tracking-tight">How it works</h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-4">
            {STEPS.map((s) => (
              <li key={s.n} className="constra-card p-5">
                <p className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0f2340] font-extrabold text-white">
                  {s.n}
                </p>
                <h3 className="mt-3 font-bold">{s.t}</h3>
                <p className="mt-1 text-sm text-slate-500">{s.d}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* FAQ */}
        <section id="faq" className="mx-auto max-w-4xl px-4 pb-16">
          <h2 className="text-3xl font-extrabold tracking-tight">FAQ</h2>
          <div className="mt-6 flex flex-col gap-3">
            {FAQS.map((f) => (
              <details key={f.q} className="constra-card p-5">
                <summary className="cursor-pointer font-semibold">{f.q}</summary>
                <p className="mt-2 text-sm text-slate-500">{f.a}</p>
              </details>
            ))}
          </div>
          <div className="constra-card mt-8 bg-[#0f2340] p-8 text-center text-white">
            <h2 className="text-2xl font-extrabold">Stop running sites on WhatsApp + Excel.</h2>
            <p className="mt-2 text-slate-300">Sign in and see your first dashboard in under a minute.</p>
            <div className="mt-4 flex justify-center gap-3">
              <Link href="/signup" className="constra-btn-accent">Get started</Link>
              <Link href="/login" className="rounded-lg border border-white/30 px-4 py-2.5 text-sm font-semibold hover:bg-white/10">
                Sign in
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 py-8 dark:border-slate-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-sm text-slate-500 md:flex-row">
          <p>Constra — construction site management for UAE contractors.</p>
          <nav className="flex gap-4" aria-label="Footer">
            <Link href="/login" className="hover:underline">Sign in</Link>
            <Link href="/signup" className="hover:underline">Sign up</Link>
            <Link href="/dashboard" className="hover:underline">Dashboard</Link>
          </nav>
        </div>
      </footer>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Constra",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            description:
              "Construction site management ERP: projects, HR, UAE VAT bills, ledger, operations, fleet, chat, portal and AI.",
            offers: { "@type": "Offer", price: "0", priceCurrency: "AED" },
          }),
        }}
      />
    </div>
  );
}
