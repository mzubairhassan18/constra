import Link from "next/link";
import { requireAccess } from "@/lib/access";
import AskBox from "./AskBox";

export default async function AskPage() {
  await requireAccess();
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">AI Assistant</h1>
        <Link href="/dashboard" className="text-sm underline">Dashboard</Link>
      </header>
      <AskBox />
    </main>
  );
}
