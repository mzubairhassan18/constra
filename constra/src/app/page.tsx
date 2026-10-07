import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CountUp, Reveal } from "./reveal";

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
    body: "Every project breaks into ordered stages with budget, BOQ revenue, activities, milestones, risks and equipment — completing a stage auto-opens the next.",
  },
  {
    icon: "👷",
    title: "HR, attendance & payroll",
    body: "Permanent staff and daily wagers, assignments per stage, time-in/out and monthly payroll — labour cost lands on the right stage automatically.",
  },
  {
    icon: "🧾",
    title: "Bills with UAE VAT",
    body: "Supplier bills with line items, transport, discount and 5% VAT-in. Every posting is balanced double-entry with reversal — never a silent edit.",
  },
  {
    icon: "💰",
    title: "Finance that balances",
    body: "Client invoices, receipts, trial balance, P&L, balance sheet and VAT position from the same ledger. Dr always equals Cr — or it tells you.",
  },
  {
    icon: "🚚",
    title: "Site operations",
    body: "Daily manpower, foreman reporting with site photos, material requests, rentals, tool issuance and transport — mobile-first for the field.",
  },
  {
    icon: "💬",
    title: "Team chat & notifications",
    body: "Direct and group chats with unread counts, plus alerts for stage completion, bill dues, expiring visas and VAT deadlines.",
  },
  {
    icon: "🔗",
    title: "Client portal",
    body: "Magic-link portal per project: progress, timeline, photos and invoices — internal payroll and supplier rates never leak.",
  },
  {
    icon: "🤖",
    title: "AI ask",
    body: "Ask “upcoming dues?” or “survival forecast?” and get answers with charts and deep links — the model only calls audited tools, never raw SQL.",
  },
];

const ROLES = [
  { name: "Owner / Admin", desc: "Full control: users, ledger, periods, portal links." },
  { name: "Accountant", desc: "Bills, invoices, receipts, VAT and statements." },
  { name: "Foreman", desc: "Attendance, daily reports, manpower, material requests." },
  { name: "Client", desc: "Read-only portal: progress, photos, invoices, next due." },
];

const STEPS = [
  { n: "1", t: "Create the project", d: "Header, stages, BOQ and budget in minutes.", img: "/marketing/img-6.jpg", alt: "Architectural blueprint for a villa project" },
  { n: "2", t: "Run the site", d: "Attendance, reports, bills and manpower flow in daily.", img: "/marketing/img-2.jpg", alt: "Steel fixers working on a construction site" },
  { n: "3", t: "Close the books", d: "Invoices, receipts, VAT and statements stay balanced.", img: "/marketing/img-5.jpg", alt: "Finished villa interior ready for handover" },
  { n: "4", t: "Share progress", d: "Send the client a live portal link — no login needed.", img: "/marketing/img-3.jpg", alt: "Completed modern villa at dusk" },
];

const MARQUEE = [
  "Stage tracking", "BOQ vs actual", "UAE 5% VAT", "Payroll", "Foreman mobile",
  "Tool issuance", "Client portal", "AI insights", "Trial balance", "Fleet & fines",
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
    a: "Yes — mobile-responsive with large touch targets, photo capture, drag-and-drop uploads and text-size controls for outdoor glare.",
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
          <Link href="/" className="text-xl font-extrabold tracking-tight transition-colors hover:text-amber-600">
            Constra<span className="text-amber-500">.</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium md:flex" aria-label="Primary">
            {[
              ["#features", "Features"],
              ["#showcase", "Showcase"],
              ["#roles", "Roles"],
              ["#how", "How it works"],
              ["#faq", "FAQ"],
            ].map(([href, label]) => (
              <a key={href} href={href} className="text-slate-600 transition-colors hover:text-amber-600 hover:underline dark:text-slate-300">
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="constra-btn-ghost transition-colors hover:border-amber-500 hover:text-amber-600">
              Sign in
            </Link>
            <Link href="/signup" className="constra-btn-primary transition-all hover:-translate-y-0.5 hover:bg-amber-500 hover:text-black hover:shadow-lg">
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero with photo */}
        <section className="relative overflow-hidden bg-[#0f2340] text-white">
          <div className="absolute inset-0" aria-hidden>
            <Image
              src="/marketing/img-1.jpg"
              alt=""
              fill
              priority
              className="constra-hero-img object-cover opacity-35"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0f2340] via-[#0f2340]/80 to-[#0f2340]/30" />
          </div>
          <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
            <Reveal>
              <p className="constra-chip mb-4 border-white/20 bg-white/10 text-amber-300">
                Built for UAE contractors
              </p>
              <h1 className="text-4xl leading-tight font-extrabold tracking-tight md:text-5xl">
                Run every villa project from foundation to handover — without the spreadsheets.
              </h1>
              <p className="mt-4 max-w-lg text-lg text-slate-300">
                Projects & stages, labour & payroll, supplier bills with 5% VAT,
                a balanced ledger, site operations, fleet, team chat, client
                portal and AI answers. One app, mobile-ready.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/signup" className="constra-btn-accent transition-all hover:-translate-y-0.5 hover:shadow-xl">
                  Start free → See the dashboard
                </Link>
                <Link
                  href="/login"
                  className="rounded-lg border border-white/30 px-4 py-2.5 text-sm font-semibold transition-colors hover:border-amber-400 hover:bg-white/10 hover:text-amber-300"
                >
                  Sign in
                </Link>
              </div>
              <dl className="mt-8 grid max-w-md grid-cols-3 gap-4 text-center">
                <div className="rounded-xl bg-white/10 p-3 backdrop-blur transition-colors hover:bg-white/20">
                  <dt className="text-2xl font-extrabold text-amber-300"><CountUp to={103} /></dt>
                  <dd className="text-xs text-slate-300">use cases</dd>
                </div>
                <div className="rounded-xl bg-white/10 p-3 backdrop-blur transition-colors hover:bg-white/20">
                  <dt className="text-2xl font-extrabold text-amber-300"><CountUp to={5} prefix="" suffix="%" /></dt>
                  <dd className="text-xs text-slate-300">UAE VAT</dd>
                </div>
                <div className="rounded-xl bg-white/10 p-3 backdrop-blur transition-colors hover:bg-white/20">
                  <dt className="text-2xl font-extrabold text-amber-300">24/7</dt>
                  <dd className="text-xs text-slate-300">client portal</dd>
                </div>
              </dl>
            </Reveal>
            <Reveal delay={150} className="hidden md:block">
              <div className="constra-card constra-float overflow-hidden p-0">
                <div className="relative h-64">
                  <Image
                    src="/marketing/img-3.jpg"
                    alt="Completed modern villa at dusk — the kind of project Constra manages"
                    fill
                    className="object-cover"
                  />
                  <p className="absolute top-3 left-3 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                    Live snapshot · Marina Villa · 62%
                  </p>
                </div>
                <div className="p-5">
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
                        <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300" style={{ width: `${p}%` }} />
                      </div>
                    </div>
                  ))}
                  <Link href="/login" className="constra-btn-primary mt-3 block text-center transition-all hover:-translate-y-0.5 hover:shadow-lg">
                    Open the live app →
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Marquee */}
        <div className="overflow-hidden border-b border-slate-200 bg-white py-3 dark:border-slate-800 dark:bg-[#111a2e]" aria-hidden>
          <div className="constra-marquee-track flex w-max gap-8 whitespace-nowrap">
            {[...MARQUEE, ...MARQUEE].map((m, i) => (
              <span key={i} className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                ✓ {m}
              </span>
            ))}
          </div>
        </div>

        {/* Features */}
        <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16">
          <Reveal>
            <h2 className="text-3xl font-extrabold tracking-tight">
              Everything a site needs, in one place
            </h2>
            <p className="mt-2 max-w-2xl text-slate-500">
              Rebuilt from a 103-use-case reference app — every workflow
              from foreman reporting to VAT filing has a home.
            </p>
          </Reveal>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={(i % 4) * 80}>
                <article className="constra-card constra-lift h-full p-5">
                  <p className="text-2xl" aria-hidden>{f.icon}</p>
                  <h3 className="mt-2 font-bold">{f.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">{f.body}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Showcase gallery */}
        <section id="showcase" className="scroll-mt-20 border-y border-slate-200 bg-white dark:border-slate-800 dark:bg-[#111a2e]">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <Reveal>
              <h2 className="text-3xl font-extrabold tracking-tight">From foundation to finishing</h2>
              <p className="mt-2 max-w-2xl text-slate-500">
                The same stages your engineers walk every day — tracked photo by photo in Constra.
              </p>
            </Reveal>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                { src: "/marketing/img-1.jpg", alt: "Engineers reviewing foundation works on site", cap: "Foundation & structure" },
                { src: "/marketing/img-2.jpg", alt: "Steel fixers at work on a construction site", cap: "Site execution" },
                { src: "/marketing/img-4.jpg", alt: "Luxury villa exterior ready for handover", cap: "Handover & portal" },
              ].map((g, i) => (
                <Reveal key={g.src} delay={i * 100}>
                  <figure className="constra-card constra-zoom-img constra-lift overflow-hidden p-0">
                    <div className="relative h-56 overflow-hidden">
                      <Image src={g.src} alt={g.alt} fill loading="lazy" className="object-cover" />
                    </div>
                    <figcaption className="p-4 text-sm font-semibold">{g.cap}</figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Roles */}
        <section id="roles" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16">
          <Reveal>
            <h2 className="text-3xl font-extrabold tracking-tight">One login for every role</h2>
            <p className="mt-2 text-slate-500">Sign in once — the sidebar, permissions and landing adapt to who you are.</p>
          </Reveal>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ROLES.map((r, i) => (
              <Reveal key={r.name} delay={i * 80}>
                <article className="constra-card constra-lift h-full p-5">
                  <h3 className="font-bold">{r.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">{r.desc}</p>
                  <Link href="/login" className="mt-3 inline-block text-sm font-semibold text-amber-600 transition-colors hover:text-amber-500 hover:underline">
                    Sign in →
                  </Link>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        {/* How with photos */}
        <section id="how" className="border-y border-slate-200 bg-white dark:border-slate-800 dark:bg-[#111a2e]">
          <div className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16">
            <Reveal>
              <h2 className="text-3xl font-extrabold tracking-tight">How it works</h2>
            </Reveal>
            <ol className="mt-8 grid gap-4 md:grid-cols-4">
              {STEPS.map((s, i) => (
                <Reveal key={s.n} delay={i * 80}>
                  <li className="constra-card constra-lift h-full overflow-hidden p-0">
                    <div className="constra-zoom-img relative h-36 overflow-hidden">
                      <Image src={s.img} alt={s.alt} fill loading="lazy" className="object-cover" />
                      <p className="absolute top-2 left-2 flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 font-extrabold text-black">
                        {s.n}
                      </p>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold">{s.t}</h3>
                      <p className="mt-1 text-sm text-slate-500">{s.d}</p>
                    </div>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mx-auto max-w-4xl scroll-mt-20 px-4 py-16">
          <Reveal>
            <h2 className="text-3xl font-extrabold tracking-tight">FAQ</h2>
          </Reveal>
          <div className="mt-6 flex flex-col gap-3">
            {FAQS.map((f) => (
              <Reveal key={f.q}>
                <details className="constra-card group p-5 transition-colors open:border-amber-500">
                  <summary className="cursor-pointer font-semibold transition-colors group-hover:text-amber-600">{f.q}</summary>
                  <p className="mt-2 text-sm text-slate-500">{f.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <div className="relative mt-8 overflow-hidden rounded-2xl bg-[#0f2340] p-8 text-center text-white">
              <div className="absolute inset-0 opacity-20" aria-hidden>
                <Image src="/marketing/img-2.jpg" alt="" fill loading="lazy" className="object-cover" />
              </div>
              <div className="relative">
                <h2 className="text-2xl font-extrabold">Stop running sites on WhatsApp + Excel.</h2>
                <p className="mt-2 text-slate-300">Sign in and see your first dashboard in under a minute.</p>
                <div className="mt-4 flex justify-center gap-3">
                  <Link href="/signup" className="constra-btn-accent transition-all hover:-translate-y-0.5 hover:shadow-xl">Get started</Link>
                  <Link href="/login" className="rounded-lg border border-white/30 px-4 py-2.5 text-sm font-semibold transition-colors hover:border-amber-400 hover:text-amber-300">
                    Sign in
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-slate-200 py-8 dark:border-slate-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-sm text-slate-500 md:flex-row">
          <p>Constra — construction site management for UAE contractors.</p>
          <nav className="flex gap-4" aria-label="Footer">
            <Link href="/login" className="transition-colors hover:text-amber-600 hover:underline">Sign in</Link>
            <Link href="/signup" className="transition-colors hover:text-amber-600 hover:underline">Sign up</Link>
            <Link href="/dashboard" className="transition-colors hover:text-amber-600 hover:underline">Dashboard</Link>
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
