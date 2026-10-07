import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { homeFor } from "@/lib/access";

export default async function SignupPage() {
  const me = await getSessionUser();
  if (me) redirect(homeFor(me));
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center gap-5 p-6">
      <div>
        <Link href="/" className="text-xl font-extrabold">
          Constra<span className="text-amber-500">.</span>
        </Link>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight">
          Create your company account
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Owner signup creates the first admin user. Additional
          foremen, accountants and clients are invited from
          Dashboard → Users.
        </p>
      </div>
      <form
        action="/api/signup"
        method="post"
        className="constra-card flex flex-col gap-4 p-5"
      >
        <label className="flex flex-col gap-1 text-sm font-medium">
          Company name
          <input name="company" required maxLength={120} placeholder="e.g. Marina Contracting LLC" className="constra-input" />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Your name
          <input name="name" required maxLength={120} placeholder="e.g. Ahmed Hassan" className="constra-input" />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Username
          <input name="username" required maxLength={100} autoComplete="username" placeholder="e.g. ahmed" className="constra-input" />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Password
          <input name="password" type="password" required minLength={8} autoComplete="new-password" placeholder="Min. 8 characters" className="constra-input" />
        </label>
        <button type="submit" className="constra-btn-accent w-full py-2.5">
          Create owner account →
        </button>
        <p className="text-center text-xs text-slate-500">
          Self-service signup is coming soon — today an admin provisions
          accounts. Already have one?{" "}
          <Link href="/login" className="font-semibold text-amber-600 hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </main>
  );
}
