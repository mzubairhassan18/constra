import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  if (await getSessionUser()) redirect("/dashboard");
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Constra</h1>
        <p className="text-sm text-zinc-500">Construction site management</p>
      </div>
      <LoginForm />
    </main>
  );
}
