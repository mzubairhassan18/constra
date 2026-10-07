"use client";

import { useActionState, useState } from "react";
import { loginAction, type LoginState } from "./actions";

const initial: LoginState = {};

const ROLE_TABS = [
  {
    id: "admin",
    label: "Owner / Admin",
    hint: "Full access — dashboard, users, ledger.",
    username: "admin",
  },
  {
    id: "accountant",
    label: "Accountant",
    hint: "Bills, invoices, VAT, statements.",
    username: "",
  },
  {
    id: "foreman",
    label: "Foreman",
    hint: "Attendance, reports, requests — mobile-first.",
    username: "",
  },
  {
    id: "hr",
    label: "HR Officer",
    hint: "Employees, assignments, attendance & payroll.",
    username: "",
  },
  {
    id: "client",
    label: "Client",
    hint: "Read-only portal via magic link — no password needed.",
    username: "",
  },
] as const;

export default function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initial);
  const [tab, setTab] = useState<(typeof ROLE_TABS)[number]["id"]>("admin");
  const active = ROLE_TABS.find((t) => t.id === tab)!;

  return (
    <div className="flex flex-col gap-4">
      <div
        className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 sm:grid-cols-5 dark:bg-slate-800"
        role="tablist"
        aria-label="Sign in as"
      >
        {ROLE_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-2 py-2 text-xs font-bold transition-colors ${
              tab === t.id
                ? "bg-white text-slate-900 shadow dark:bg-slate-900 dark:text-white"
                : "text-slate-600 hover:bg-white/80 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
        {active.hint}
        {tab === "client" && (
          <>
            {" "}Ask your contractor for a portal link — or sign in below
            if you have a client login.
          </>
        )}
      </p>
      <form action={action} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Username
          <input
            name="username"
            autoComplete="username"
            required
            maxLength={100}
            defaultValue={active.username}
            key={active.id}
            placeholder={
              tab === "admin"
                ? "e.g. admin"
                : tab === "client"
                  ? "e.g. client_marina"
                  : "e.g. ahmed.foreman"
            }
            className="constra-input"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Password
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className="constra-input"
          />
        </label>
        {state.error && (
          <p role="alert" className="text-sm text-red-600">
            {state.error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="constra-btn-primary w-full py-2.5"
        >
          {pending ? "Signing in…" : `Sign in as ${active.label}`}
        </button>
      </form>
      <p className="text-center text-xs text-slate-500">
        New company?{" "}
        <a href="/signup" className="font-semibold text-amber-600 hover:underline">
          Create an owner account →
        </a>
      </p>
    </div>
  );
}
