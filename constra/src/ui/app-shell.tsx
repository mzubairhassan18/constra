"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/projects", label: "Projects", icon: "🏗️" },
  { href: "/hr", label: "HR", icon: "👷" },
  { href: "/bills", label: "Bills", icon: "🧾" },
  { href: "/finance", label: "Finance", icon: "💰" },
  { href: "/operations", label: "Operations", icon: "🚚" },
  { href: "/fleet", label: "Fleet", icon: "🚛" },
  { href: "/masters", label: "Masters", icon: "📚" },
  { href: "/chat", label: "Team chat", icon: "💬" },
  { href: "/ask", label: "AI ask", icon: "🤖" },
  { href: "/users", label: "Users", icon: "👥" },
];

type FontSize = "small" | "medium" | "large";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [fontSize, setFontSize] = useState<FontSize>(() => {
    if (typeof window === "undefined") return "medium";
    const saved = window.localStorage.getItem("constra-font-size");
    return saved === "small" || saved === "large" ? saved : "medium";
  });

  useEffect(() => {
    document.documentElement.dataset.fontSize = fontSize;
    window.localStorage.setItem("constra-font-size", fontSize);
  }, [fontSize]);

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-[#0f2340] text-white md:flex">
        <div className="p-5">
          <p className="text-xl font-extrabold tracking-tight">
            Constra<span className="text-amber-400">.</span>
          </p>
          <p className="text-xs text-slate-300">Construction ERP · UAE</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 pb-4">
          {NAV.map((n) => {
            const active =
              pathname === n.href || pathname?.startsWith(`${n.href}/`);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-white/15 text-white"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span aria-hidden>{n.icon}</span> {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-4">
          <p className="mb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Text size
          </p>
          <div className="flex gap-1" role="group" aria-label="Text size">
            {(["small", "medium", "large"] as FontSize[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFontSize(s)}
                aria-pressed={fontSize === s}
                className={`flex-1 rounded-md px-2 py-1 text-xs font-semibold capitalize ${
                  fontSize === s
                    ? "bg-amber-400 text-black"
                    : "bg-white/10 text-slate-200 hover:bg-white/20"
                }`}
              >
                {s === "small" ? "A−" : s === "large" ? "A+" : "A"}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-40 flex items-center justify-between gap-2 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:hidden dark:border-slate-800 dark:bg-[#111a2e]/95">
          <p className="text-lg font-extrabold">
            Constra<span className="text-amber-500">.</span>
          </p>
          <div className="flex items-center gap-2">
            <div className="flex gap-1" role="group" aria-label="Text size">
              {(["small", "medium", "large"] as FontSize[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFontSize(s)}
                  aria-pressed={fontSize === s}
                  className={`rounded-md border px-2 py-1 text-xs font-bold ${
                    fontSize === s
                      ? "border-amber-500 bg-amber-100 dark:bg-amber-900"
                      : "border-slate-300 dark:border-slate-700"
                  }`}
                >
                  {s === "small" ? "A−" : s === "large" ? "A+" : "A"}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="constra-btn-ghost px-3 py-1.5"
              aria-expanded={menuOpen}
              aria-label="Toggle navigation menu"
            >
              ☰
            </button>
          </div>
        </header>
        {menuOpen && (
          <nav className="grid grid-cols-2 gap-2 border-b border-slate-200 p-4 md:hidden dark:border-slate-800">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setMenuOpen(false)}
                className="constra-btn-ghost text-center"
              >
                <span aria-hidden>{n.icon}</span> {n.label}
              </Link>
            ))}
          </nav>
        )}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
