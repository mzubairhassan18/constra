import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import ChatApp from "./ChatApp";

export const instant = false;

export default async function ChatPage() {
  if (!(await getSessionUser())) redirect("/login");
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Chat</h1>
        <Link href="/dashboard" className="text-sm underline">Dashboard</Link>
      </header>
      <ChatApp />
    </main>
  );
}
