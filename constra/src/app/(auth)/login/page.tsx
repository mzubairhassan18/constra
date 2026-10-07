import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  if (await getSessionUser()) redirect("/dashboard");
  return (
    <main className="flex min-h-screen">
      <div className="hidden flex-1 flex-col justify-between bg-[#0f2340] p-10 text-white lg:flex">
        <p className="text-2xl font-extrabold tracking-tight">
          Constra<span className="text-amber-400">.</span>
        </p>
        <div>
          <h1 className="max-w-md text-4xl leading-tight font-extrabold">
            Every stage, bill and payslip — one sign-in.
          </h1>
          <ul className="mt-6 flex max-w-md flex-col gap-3 text-sm text-slate-300">
            <li className="rounded-xl bg-white/10 p-3">📊 Owner dashboard with live costs & dues</li>
            <li className="rounded-xl bg-white/10 p-3">🧾 Accountant ledger with balanced VAT entries</li>
            <li className="rounded-xl bg-white/10 p-3">👷 Foreman mobile: attendance, photos, requests</li>
          </ul>
        </div>
        <p className="text-xs text-slate-400">
          Double-entry ledger · UAE 5% VAT · Client portal · AI ask
        </p>
      </div>
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-6 lg:hidden">
            <Link href="/" className="text-xl font-extrabold">
              Constra<span className="text-amber-500">.</span>
            </Link>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">Welcome back</h2>
          <p className="mt-1 mb-5 text-sm text-slate-500">
            Choose your role, then sign in. Accounts are created by your company admin.
          </p>
          <LoginForm />
          <p className="mt-4 text-center text-xs text-slate-500">
            <Link href="/" className="hover:underline">← Back to home</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
